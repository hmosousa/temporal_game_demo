from src.env import TemporalGameEnv


class TestTemporalGameEnv:
    def test_init(self):
        env = TemporalGameEnv(mode="test", level=None)
        assert env is not None

    def test_reset(self):
        env = TemporalGameEnv()
        env.reset()
        env.step(((0, 2), "-"))
        assert env is not None