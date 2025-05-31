from tieval.base import Document
from tieval.models.identification.event import EventIdentificationBaseline


class EventTagger:
    def __init__(self):
        self.model = EventIdentificationBaseline()

    def __call__(self, text: str) -> list[dict]:
        doc = Document(name="doc", text=text, dct=None, entities=[], tlinks=[])
        events = self.model.predict([doc])["doc"]
        result = [
            {
                "text": event.text,
                "offsets": list(event.offsets),
                "type": "interval",
            } 
            for event in events
        ]
        return result
