from grammar import fixGrammar


def test_fix_grammar_basic():
    result = fixGrammar("this is a test")
    assert "corrected" in result
    assert result["corrected"].lower().startswith("this")
