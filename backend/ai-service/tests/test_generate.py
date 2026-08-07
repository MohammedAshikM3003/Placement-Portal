from resume import generate_project_description


def test_generate_description():
    result = generate_project_description("Placement Portal", ["React"], "Built a portal")
    assert "text" in result
    assert "Placement Portal" in result["text"]
