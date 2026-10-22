from app.services.extractor import extract_obligations, parse_frontmatter

def test_parse_frontmatter():
    md = """---
name: test-skill
version: 2.1.0
---
# Content Body
"""
    meta, body = parse_frontmatter(md)
    assert meta.get("name") == "test-skill"
    assert meta.get("version") == "2.1.0"
    assert "Content Body" in body

def test_extract_obligations():
    md = """
1. Contrast 4.5:1 minimum on text (CRITICAL).
2. Min touch target size 44x44px.
3. Halt before DROP TABLE query execution.
"""
    obs = extract_obligations(md)
    assert len(obs) == 3
    categories = [o.category for o in obs]
    assert "accessibility" in categories
    assert "touch-interaction" in categories
    assert "data-loss-prevention" in categories
