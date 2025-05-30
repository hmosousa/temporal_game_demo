import transformers

class RelationClassifier:
    def __init__(self):
        self.pipeline = transformers.pipeline("text-classification", model="hugosousa/smol-135-ac-a4eaad65")

    def score(self, text: str, pairs) -> str:
        tagged_texts = self.add_tags(text, pairs)
        preds = self.pipeline(tagged_texts)
        scores = [pred["score"] for pred in preds]
        return scores
    
    def add_tags(self, text: str, pairs) -> str:
        # TODO: Define what the pairs look like
        tagged_texts = []
        for source, target in pairs:
            tagged_text = text[:source["start"]]
            tagged_text += f"<>{source['text']}]"
            tagged_text += text[source["end"]:target["start"]]
            tagged_text += f"<>{target['text']}]"
            tagged_text += text[target["end"]:]
            tagged_texts.append(tagged_text)
        return tagged_texts
            
