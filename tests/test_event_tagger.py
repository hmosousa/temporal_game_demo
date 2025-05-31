from src.event_tagger import EventTagger


class TestEventTagger:
    def test_call(self):
        text = "The meeting started at 9:00 AM and ended at 10:00 AM."
        events = EventTagger()(text)
        assert len(events) == 2
