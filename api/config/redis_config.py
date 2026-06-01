import redis
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict
import logging
from pathlib import Path
import hashlib

load_dotenv()

logger = logging.getLogger(__name__)

DRAFTS_FOLDER = Path(__file__).resolve().parents[1] / "drafts"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    REDIS_HOST: str = ""
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""
    PORT: int = 80
    CORS_ORIGINS: str = "*"

settings = Settings()


def _get_latest_draft() -> Path:
    xlsx_files = list(DRAFTS_FOLDER.glob("*.xlsx"))
    if not xlsx_files:
        raise FileNotFoundError(f"No draft files found in {DRAFTS_FOLDER}")
    return max(xlsx_files, key=lambda f: f.stat().st_mtime)


def _current_file_hash() -> str:
    return hashlib.md5(_get_latest_draft().read_bytes()).hexdigest()


def get_redis_connection():
    try:
        logger.info("Redis connection established")
        return redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            password=settings.REDIS_PASSWORD,
            db=0,
            ssl=False,
            decode_responses=True,
            socket_timeout=5,
        )

    except redis.ConnectionError as e:
        logger.error(f"Redis connection failed: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error connecting to Redis: {e}")
        raise


r = get_redis_connection()


def create_cache_key_from_parameters(class_pattern: str, is_exam: bool) -> str:
    return f"{class_pattern.replace(' ', '')}-{'exam' if is_exam else 'lecture'}"


def get_table_from_cache(class_pattern: str, is_exam: bool) -> str | None:
    try:
        current_hash = _current_file_hash()

        cache_key = create_cache_key_from_parameters(class_pattern, is_exam)
        hash_key = f"{cache_key}_hash"

        cached_hash = r.get(hash_key)
        cached_data = r.get(cache_key)

        if isinstance(cached_hash, str) and isinstance(cached_data, str) and cached_hash == current_hash:
            return cached_data
        return None

    except redis.RedisError as e:
        logger.error(f"Error retrieving from cache: {e}")
        return None
    except FileNotFoundError as e:
        logger.error(f"File not found for cache check: {e}")
        return None


def add_table_to_cache(table: str, class_pattern: str, is_exam: bool, expire_seconds: int = 3600):
    try:
        current_hash = _current_file_hash()

        cache_key = create_cache_key_from_parameters(class_pattern, is_exam)
        hash_key = f"{cache_key}_hash"

        pipe = r.pipeline()
        pipe.setex(cache_key, expire_seconds, table)
        pipe.setex(hash_key, expire_seconds, current_hash)
        pipe.execute()

    except redis.RedisError as e:
        logger.error(f"Error adding to cache: {e}")
    except FileNotFoundError as e:
        logger.error(f"File not found for cache addition: {e}")
