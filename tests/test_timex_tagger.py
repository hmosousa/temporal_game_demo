from src.timex_tagger import TimexTagger

class TestTimexTagger:
    def test_call(self):
        tagger = TimexTagger()
        text = "I have a meeting tomorrow at 3 PM and another one next week."
        timexes = tagger(text)
        assert timexes
