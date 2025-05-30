from src.relation_classifier import RelationClassifier


class TestRelationClassifier:
    def test_score(self):
        classifier = RelationClassifier()
        text = "The meeting started at 9:00 AM and ended at 10:00 AM."
        score = classifier.score(text)
        assert score == 0