import pandas as pd
import pytest
from api.extract.extract_lectures_table import (
    _get_time_row,
    _get_daily_table,
    get_time_table,
    convert_to_24hour,
)


class TestGetTimeRow:
    def test_finds_row_matching_time_pattern(self):
        df = pd.DataFrame(
            {
                "A": ["foo", "bar"],
                "B": ["baz", "7:00-8:00"],
                "C": ["qux", "9:00-10:00"],
            }
        )
        result = _get_time_row(df)
        assert result is not None
        _, series = result
        assert series.iloc[1] == "7:00-8:00"
        assert series.iloc[2] == "9:00-10:00"

    def test_returns_none_when_no_time_pattern(self):
        df = pd.DataFrame({"A": ["foo", "bar"], "B": ["baz", "qux"]})
        assert _get_time_row(df) is None

    def test_returns_none_for_empty_dataframe(self):
        df = pd.DataFrame()
        assert _get_time_row(df) is None


class TestGetDailyTable:
    def _make_df(self, time_row_values, data_rows):
        columns = [f"c{i}" for i in range(len(time_row_values))]
        df = pd.DataFrame(data_rows, columns=columns)
        df.loc[-1] = time_row_values
        df = df.sort_index().reset_index(drop=True)
        return df

    def test_filters_courses_matching_class_pattern(self):
        df = self._make_df(
            ["Classroom", "8:00-9:00", "9:00-10:00"],
            [
                ["Room 1", "CE 459", "CE 408"],
                ["Room 2", "ME 301", "ME 302"],
                ["Room 3", "CE 460", "CE 409"],
            ],
        )
        result = _get_daily_table(df, "CE 4")
        assert "Room 1" in result.index
        assert "Room 3" in result.index
        assert "Room 2" not in result.index

    def test_returns_df_when_no_time_row(self):
        df = pd.DataFrame({"A": ["foo"], "B": ["bar"]})
        result = _get_daily_table(df, "CE 4")
        assert isinstance(result, pd.DataFrame)

    def test_multiple_dept_shared_course(self):
        df = self._make_df(
            ["Classroom", "8:00-9:00"],
            [
                ["Room 1", "CE/RN 459"],
                ["Room 2", "CE 5A"],
            ],
        )
        result = _get_daily_table(df, "CE 4")
        assert "Room 1" in result.index


class TestConvertTo24Hour:
    def test_hours_leq_7_become_pm(self):
        assert convert_to_24hour("7:00") == "19:00"

    def test_pm_start_time(self):
        assert convert_to_24hour("13:00") == "13:00"

    def test_end_time_adds_12(self):
        assert convert_to_24hour("2:00", is_end_time=True) == "14:00"

    def test_end_time_noon(self):
        assert convert_to_24hour("12:00", is_end_time=False) == "12:00"

    def test_end_time_11pm(self):
        assert convert_to_24hour("11:00", is_end_time=True) == "23:00"


class TestGetTimeTable:
    def test_returns_dataframe(self, tmp_path):
        import openpyxl

        wb = openpyxl.Workbook()
        ws = wb.active
        assert ws is not None
        ws.title = "Monday"
        ws.append(["Classroom", "8:00-9:00", "9:00-10:00"])
        ws.append(["CE 4A", "Math 101", "Phy 101"])
        ws.append(["CE 4B", "Math 201", "Phy 201"])
        path = tmp_path / "test.xlsx"
        wb.save(path)

        result = get_time_table(path.read_bytes(), "CE 4")
        assert not result.empty
        assert "Monday" in result.index

    def test_raises_on_no_valid_sheet(self, tmp_path):
        import openpyxl

        wb = openpyxl.Workbook()
        ws = wb.active
        assert ws is not None
        ws.title = "NotADay"
        ws.append(["foo", "bar"])
        path = tmp_path / "bad.xlsx"
        wb.save(path)

        with pytest.raises(ValueError, match="No sheet found"):
            get_time_table(path.read_bytes(), "CE 4")
