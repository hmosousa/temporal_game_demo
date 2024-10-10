from src.temporal_closure import compute_temporal_closure


def test_compute_temporal_closure():
    relations = [
        {"relation": "<", "source": "start A", "target": "start B"},
        {"relation": "<", "source": "start B", "target": "start C"},
    ]

    inferred_relations = compute_temporal_closure(relations)

    expected_relations = [
        {"relation": "<", "source": "start A", "target": "start B"},
        {"relation": "<", "source": "start B", "target": "start C"},
        {"relation": "<", "source": "start A", "target": "start C"},
    ]
    # Check that the number of relations is correct
    assert inferred_relations == expected_relations, "Unexpected number of relations in the result"
    
