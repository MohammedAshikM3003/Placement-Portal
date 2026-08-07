from ats import check_ats


def test_ats_basic():
    result = check_ats("Python and React developer", "Looking for a Python developer")
    assert "score" in result
    assert result["score"] >= 0
