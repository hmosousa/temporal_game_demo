import json
import re

from flask import Flask, render_template, jsonify, request
from src.utils import highlight_entities, build_entities_dict
from src.temporal_closure import Timeline

app = Flask(__name__)


def order_entities_by_appearance(context, entities):
    entity_positions = {}
    for entity in entities:
        match = re.search(f"<{entity}>(.*?)</{entity}>", context)
        if match:
            entity_positions[entity] = match.start()

    return sorted(entities, key=lambda e: entity_positions.get(e, float("inf")))


def _build_data(data):
    data["eid2name"] = build_entities_dict(data["context"])
    data["ordered_entities"] = order_entities_by_appearance(
        data["context"], data["entities"]
    )
    data["context"] = highlight_entities(data["context"])
    return data


@app.route("/")
def index():
    with open("sample_data.json", "r") as f:
        data = json.load(f)
    data = _build_data(data)
    return render_template("index.html", data=data)


@app.route("/api/data", methods=["GET"])
def get_context():
    with open("sample_data.json", "r") as f:
        data = json.load(f)
    data = _build_data(data)
    return jsonify(data)


@app.route("/api/temporal_closure", methods=["POST"])
def temporal_closure():
    data = request.json
    relations = data.get("timeline", [])
    app.logger.info(f"Received relations: {relations}")

    timeline = Timeline.from_relations(relations)
    closed_timeline = timeline.closure()  # Compute the temporal closure
    closed_relations = closed_timeline.to_dict()
    app.logger.info(f"Computed timeline: {closed_relations}")

    return jsonify({"timeline": closed_relations})


if __name__ == "__main__":
    app.run(debug=True)
