from src.temporal_closure import (
    compute_temporal_closure,
    Timeline,
    PointRelation,
)


class TestPointRelation:
    def test_simple_relation(self):
        relation = PointRelation("start A", "start B", "<")
        assert relation.source == "start A"
        assert relation.target == "start B"
        assert relation.value == "<"

    def test_to_dict(self):
        relation = PointRelation("start A", "start B", "<")
        assert relation.to_dict() == {
            "source": "start A",
            "target": "start B",
            "relation": "<",
        }


class TestTimeline:
    def test_simple_timeline(self):
        return Timeline(
            [
                PointRelation("start A", "start B", "<"),
                PointRelation("start B", "start C", "<"),
            ]
        )

    def test_equality(self):
        timeline1 = Timeline(
            [
                PointRelation("start A", "start B", "<"),
                PointRelation("start B", "start C", "<"),
            ]
        )
        timeline2 = Timeline(
            [
                PointRelation("start B", "start A", ">"),
                PointRelation("start C", "start B", ">"),
            ]
        )
        assert timeline1 == timeline2

    def test_add(self):
        timeline = self.test_simple_timeline()
        timeline += PointRelation("start C", "start D", "<")
        assert len(timeline) == 3

    def test_add_same_relation(self):
        timeline = self.test_simple_timeline()
        timeline += PointRelation("start A", "start B", "<")
        assert len(timeline) == 2

    def test_closure(self):
        timeline = Timeline(
            [
                PointRelation("start A", "start B", "<"),
                PointRelation("start B", "start C", "<"),
            ]
        )

        inferred_timeline = timeline.closure()

        expected_timeline = Timeline(
            [
                PointRelation("start A", "start B", "<"),
                PointRelation("start B", "start C", "<"),
                PointRelation("start A", "start C", "<"),
            ]
        )

        assert (
            inferred_timeline == expected_timeline
        ), "Unexpected relations in the result"

    def test_closure_with_null(self):
        timeline = Timeline(
            [
                PointRelation("start A", "start B", "<"),
                PointRelation("start B", "start C", "-"),
            ]
        )

        inferred_timeline = timeline.closure()

        expected_timeline = Timeline(
            [
                PointRelation("start A", "start B", "<"),
                PointRelation("start B", "start C", "-"),
            ]
        )

        assert (
            inferred_timeline == expected_timeline
        ), "Unexpected relations in the result"

    def test_closure_with_after(self):
        timeline = Timeline(
            [
                PointRelation("start A", "start B", "<"),
                PointRelation("start B", "start C", ">"),
            ]
        )

        inferred_timeline = timeline.closure()

        expected_timeline = Timeline(
            [
                PointRelation("start A", "start B", "<"),
                PointRelation("start B", "start C", ">"),
            ]
        )

        assert (
            inferred_timeline == expected_timeline
        ), "Unexpected relations in the result"

    def test_from_relations(self):
        relations = [
            {"source": "start A", "target": "start B", "relation": "<"},
        ]
        timeline = Timeline.from_relations(relations)
        assert len(timeline) == 1
        assert timeline.relations == {PointRelation("start A", "start B", "<")}
