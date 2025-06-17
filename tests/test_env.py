import pytest

from src.env import TemporalGame


@pytest.fixture
def doc():
    return {
        "text": "The quick brown fox jumps over the lazy dog.",
        "entities": [
            {"id": "e0", "text": "The", "type": "interval", "offsets": [0, 3]},
            {"id": "e2", "text": "jumps", "type": "instant", "offsets": [11, 15]},
        ],
        "relations": [],
    }


class TestTemporalGame:
    def test_init(self, doc):
        env = TemporalGame(doc)
        assert env is not None

    def test_reset(self, doc):
        env = TemporalGame(doc)
        env.reset()
        env.step(((0, 2), "-"))
        assert env is not None
