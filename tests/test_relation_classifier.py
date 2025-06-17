from src.relation_classifier import RelationClassifier


class TestRelationClassifier:
    def test_score(self):
        classifier = RelationClassifier()
        text = "The meeting started at 9:00 AM and ended at 10:00 AM."
        
        # Create test entity pairs
        pairs = [
            (
                {"text": "meeting", "start": 4, "end": 11},
                {"text": "9:00 AM", "start": 23, "end": 30}
            )
        ]
        
        scores = classifier.score(text, pairs)
        assert isinstance(scores, list)
        assert len(scores) == 1
        assert isinstance(scores[0], float)
        assert 0.0 <= scores[0] <= 1.0
    
    def test_add_tags(self):
        classifier = RelationClassifier()
        text = "The meeting started at 9:00 AM and ended at 10:00 AM."
        
        pairs = [
            (
                {"text": "meeting", "start": 4, "end": 11},
                {"text": "9:00 AM", "start": 23, "end": 30}
            )
        ]
        
        tagged_texts = classifier.add_tags(text, pairs)
        assert isinstance(tagged_texts, list)
        assert len(tagged_texts) == 1
        assert "<source>" in tagged_texts[0]
        assert "</source>" in tagged_texts[0]
        assert "<target>" in tagged_texts[0]
        assert "</target>" in tagged_texts[0]
    
    def test_entity_pairs_for_dynamic_mode(self):
        classifier = RelationClassifier()
        entities = [
            {"id": "e1", "text": "meeting", "start": 4, "end": 11},
            {"id": "e2", "text": "9:00 AM", "start": 23, "end": 30},
            {"id": "e3", "text": "ended", "start": 39, "end": 44},
        ]
        
        # Test guided mode
        pairs_guided = classifier.get_entity_pairs_for_dynamic_mode(entities, "guided")
        assert isinstance(pairs_guided, list)
        assert len(pairs_guided) == 3  # All possible pairs of 3 entities
        
        # Test random mode  
        pairs_random = classifier.get_entity_pairs_for_dynamic_mode(entities, "random")
        assert isinstance(pairs_random, list)
        assert len(pairs_random) == 3
        
        # Test insufficient entities
        single_entity = [{"id": "e1", "text": "meeting", "start": 4, "end": 11}]
        pairs_single = classifier.get_entity_pairs_for_dynamic_mode(single_entity, "guided")
        assert pairs_single == []