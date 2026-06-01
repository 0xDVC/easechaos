import pytest
from api.config.redis_config import create_cache_key_from_parameters


class TestCreateCacheKeyFromParameters:
    def test_lecture_key_removes_spaces(self):
        assert create_cache_key_from_parameters("CE 4", False) == "CE4-lecture"

    def test_exam_key(self):
        assert create_cache_key_from_parameters("MECH 3", True) == "MECH3-exam"

    def test_single_word_class(self):
        assert create_cache_key_from_parameters("All", False) == "All-lecture"

    def test_multiple_spaces_collapsed(self):
        assert create_cache_key_from_parameters("CE  4", False) == "CE4-lecture"
