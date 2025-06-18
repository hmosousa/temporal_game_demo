import os
import requests


class TimexTagger:
    def __init__(self, url: str = None):
        # Use environment variable or fallback to appropriate default
        # In Docker: temporal-tagger:8000, Local dev: localhost:8000
        if url is None:
            base_url = os.environ.get('TEMPORAL_TAGGER_URL', 'http://temporal-tagger:8000')
            self.url = f"{base_url}/annotate"
        else:
            self.url = url

    def __call__(self, text: str) -> list[dict]:
        response = requests.post(self.url, json={"text": text})
        content = response.json()
        result = [
            {
                "text": timex["text"],
                "offsets": [timex["start"], timex["end"]],
                "type": "interval",
            }
            for timex in content["timexs"]
        ]
        return result
