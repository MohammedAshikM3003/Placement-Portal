from resume import enhance_resume_text


def test_resume_enhancement_template():
    result = enhance_resume_text("I worked on placement portal project")
    assert "Developed" in result
    assert result.endswith(".")
