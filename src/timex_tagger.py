import requests


class TimexTagger:
    def __init__(self, url: str = "http://localhost:8000/annotate"):
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
