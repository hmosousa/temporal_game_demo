import json

from flask import Flask, render_template

from src.utils import highlight_entities

app = Flask(__name__)


def order_entities_by_appearance(context, entities):
    entity_positions = {}
    for entity in entities:
        position = context.find(f"<{entity}>")
        print(entity, position)
        entity_positions[entity] = position

    entities = sorted(entities, key=lambda e: entity_positions.get(e, float("inf")))
    return entities


@app.route("/")
def index():
    with open("sample_data.json", "r") as f:
        data = json.load(f)

    data["ordered_entities"] = order_entities_by_appearance(
        data["context"], data["entities"]
    )
    data["context"] = highlight_entities(data["context"])
    # app.logger.info(json.dumps(data, indent=2))
    return render_template("index.html", data=data)


if __name__ == "__main__":
    app.run(debug=True)
