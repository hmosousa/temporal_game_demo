from tieval.base import Document
from tieval.models.identification.event import EventIdentificationBaseline


class EventTagger:
    def __init__(self):
        self.model = EventIdentificationBaseline()

    def tag_events(self, text: str) -> list[dict]:
        doc = Document(name="doc", text=text, dct=None, entities=[], tlinks=[])
        events = self.model.predict([doc])["doc"]
        result = [
            {
                "text": event.text,
                "start": event.offsets[0],
                "end": event.offsets[1],
            } 
            for event in events
        ]
        return result
