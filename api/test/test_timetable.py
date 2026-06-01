from fastapi.testclient import TestClient
from fastapi import FastAPI
from api.routes.timetable import router as timetable_router, TimeTableRequest
import pytest

app = FastAPI()
app.include_router(timetable_router)

client = TestClient(app)


@pytest.fixture
def mock_get_latest_draft(mocker):
    return mocker.patch("api.routes.timetable._get_latest_draft", return_value="api/drafts/Draft_3.xlsx")


@pytest.fixture
def mock_get_table_from_cache(mocker):
    return mocker.patch("api.routes.timetable.get_table_from_cache")


@pytest.fixture
def mock_add_table_to_cache(mocker):
    return mocker.patch("api.routes.timetable.add_table_to_cache")


@pytest.fixture
def mock_get_time_table(mocker):
    return mocker.patch("api.routes.timetable.get_time_table")


@pytest.fixture
def mock_get_exam_timetable(mocker):
    return mocker.patch("api.routes.timetable.get_exam_timetable")


def test_get_lecture_time_table_endpoint(
    mock_get_latest_draft, mock_get_table_from_cache, mock_add_table_to_cache, mock_get_time_table
):
    request = TimeTableRequest(class_pattern="MECH 3", is_exam=False)
    mock_get_table_from_cache.return_value = None
    mock_get_time_table.return_value.to_json.return_value = (
        '[{"day": "Monday", "data": []}]'
    )

    response = client.post("/get_time_table", json=request.model_dump())

    assert response.status_code == 200
    assert "data" in response.json()
    assert "version" in response.json()
    mock_get_table_from_cache.assert_called_once_with("MECH 3", False)
    mock_add_table_to_cache.assert_called_once_with(
        '[{"day": "Monday", "data": []}]',
        "MECH 3",
        False,
    )


def test_get_exam_time_table_endpoint(
    mock_get_latest_draft, mock_get_table_from_cache, mock_add_table_to_cache, mock_get_exam_timetable
):
    request = TimeTableRequest(class_pattern="CE 4", is_exam=True)
    mock_get_table_from_cache.return_value = None
    mock_get_exam_timetable.return_value.to_json.return_value = (
        '[{"DATE": "2024-01-15", "START": "11:00 AM", "END": "2:00 PM", "COURSE NAME": "MATH 301", "CLASS": "CE 4", "LECTURE HALL": "Room A", "INVIGILATOR (UPDATED)": "Dr. Smith"}]'
    )

    response = client.post("/get_time_table", json=request.model_dump())

    assert response.status_code == 200
    assert "data" in response.json()
    assert "version" in response.json()
    mock_get_table_from_cache.assert_called_once_with("CE 4", True)
    mock_add_table_to_cache.assert_called_once_with(
        '[{"DATE": "2024-01-15", "START": "11:00 AM", "END": "2:00 PM", "COURSE NAME": "MATH 301", "CLASS": "CE 4", "LECTURE HALL": "Room A", "INVIGILATOR (UPDATED)": "Dr. Smith"}]',
        "CE 4",
        True,
    )


def test_get_time_table_cache_hit(mock_get_latest_draft, mock_get_table_from_cache, mock_add_table_to_cache):
    request = TimeTableRequest(class_pattern="EL 3", is_exam=False)
    mock_get_table_from_cache.return_value = '[{"day": "Monday", "data": []}]'

    response = client.post("/get_time_table", json=request.model_dump())

    assert response.status_code == 200
    assert "data" in response.json()
    mock_get_table_from_cache.assert_called_once_with("EL 3", False)
    mock_add_table_to_cache.assert_not_called()


def test_get_time_table_file_not_found(mock_get_latest_draft, mock_get_table_from_cache):
    request = TimeTableRequest(class_pattern="COMP 2", is_exam=False)
    mock_get_table_from_cache.return_value = None

    response = client.post("/get_time_table", json=request.model_dump())

    assert response.status_code == 200
    assert "data" in response.json()
