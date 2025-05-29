import numpy as np
from typing import List

from src.base import (
    INVERT_POINT_RELATION,
    RELATIONS2ID,
    Endpoint,
    Timeline,
    PointRelation,
)


def make_board(document: dict) -> np.ndarray:
    """
    Create a board representation of the document.
    The board is a square matrix where each cell represents a relation
    between two entity endpoints (start or end). The entities are represented by their IDs,
    and the relations are represented by their corresponding IDs.
    """
    sorted_ent_ids = [
        f"{endpoint} {ent['id']}"
        for ent in document["entities"]
        for endpoint in ["start", "end"]
    ]
    ent2idx = {ent_id: i for i, ent_id in enumerate(sorted_ent_ids)}

    board = np.full((len(sorted_ent_ids), len(sorted_ent_ids)), -1)
    for rel in document["relations"]:
        board[ent2idx[rel["source"]], ent2idx[rel["target"]]] = RELATIONS2ID[
            rel["relation"]
        ]
    return board


def add_tags(text: str, entities: List[Endpoint]) -> str:
    """Add tags to the text."""
    offset = 0
    tagged_text = ""
    for eid, entity in enumerate(entities):
        tagged_text += text[offset : entity["offsets"][0]]
        tagged_text += f"<start><end><e{eid}>{entity['text']}</e{eid}>"
        offset = entity["offsets"][1]
    tagged_text += text[offset:]
    return tagged_text


def sort_entities(example: dict) -> dict:
    entities = example["entities"]
    entities = sorted(entities, key=lambda x: x["offsets"][0])
    example["entities"] = entities
    return example


def order_relations(example: dict) -> dict:
    sorted_eids = [ent["id"] for ent in example["entities"]]
    sorted_relations = []
    for relation in example["relations"]:
        src = relation["source"].split(" ")[-1]
        tgt = relation["target"].split(" ")[-1]
        src_idx = sorted_eids.index(src)
        tgt_idx = sorted_eids.index(tgt)
        if src_idx < tgt_idx:
            sorted_relations.append(relation)
        else:
            sorted_relations.append(
                {
                    "source": relation["target"],
                    "target": relation["source"],
                    "relation": INVERT_POINT_RELATION[relation["relation"]],
                }
            )
    example["relations"] = sorted_relations
    return example


def compute_closure(example: dict) -> dict:
    relations = example["relations"]
    timeline = Timeline([PointRelation(**rel) for rel in relations])
    closure = timeline.closure
    example["relations"] = [rel.to_dict() for rel in closure.relations]
    return example
