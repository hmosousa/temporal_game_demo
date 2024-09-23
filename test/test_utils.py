from src.utils import highlight_entities


def test_highlight_entities():
    input_text = "This is a <e1>sample</e1> text with <t2>entities</t2>."
    expected_output = 'This is a <span class="entity e1">sample</span> text with <span class="entity t2">entities</span>.'
    assert highlight_entities(input_text) == expected_output


def test_highlight_entities_no_entities():
    input_text = "This is a sample text without entities."
    assert highlight_entities(input_text) == input_text


def test_highlight_entities_with_ei():
    input_text = "This is a <ei1>sample</ei1> text with <t2>entities</t2>."
    expected_output = 'This is a <span class="entity ei1">sample</span> text with <span class="entity t2">entities</span>.'
    assert highlight_entities(input_text) == expected_output