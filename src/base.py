from typing import Dict, List, Literal, Set

from tieval.closure import _compute_point_temporal_closure
from tieval.links import TLink

ENDPOINTS = ["start", "end"]
RELATIONS = [">", "<", "=", "-"]
N_RELATIONS = len(RELATIONS)


RELATIONS2ID = {
    ">": 0,
    "<": 1,
    "=": 2,
    "-": 3,
}
ID2RELATIONS = {v: k for k, v in RELATIONS2ID.items()}

INVERT_POINT_RELATION = {
    "<": ">",
    ">": "<",
    "=": "=",
    "-": "-",
}

ENDPOINT_TYPES = ["start", "end"]


NEW_TOKENS = [
    "<start_source>",
    "</start_source>",
    "<start_target>",
    "</start_target>",
    "<end_source>",
    "</end_source>",
    "<end_target>",
    "</end_target>",
    "<NO_ENTITY>",
]


class Endpoint:
    def __init__(
        self,
        id: str,
        text: str,
        type_: Literal["start", "end", "instant"],
        offsets: List[int],
        **kwargs,
    ):
        self.id = id
        self.text = text
        self.type = type_
        self.offsets = offsets

    def __str__(self) -> str:
        return f"{self.type} {self.id}"

    def __repr__(self) -> str:
        return f"Endpoint({self.type} {self.id})"


class EntityPair:
    def __init__(self, source: str, target: str):
        self.source = source
        self.target = target

    def __str__(self) -> str:
        return f"{self.source} {self.target}"

    def __repr__(self) -> str:
        return f"EntityPair({self.source}, {self.target})"

    def __eq__(self, other: "EntityPair") -> bool:
        return (self.source == other.source and self.target == other.target) or (
            self.source == other.target and self.target == other.source
        )

    def __hash__(self) -> int:
        return hash(tuple(sorted([self.source, self.target])))


class PointRelation:
    def __init__(self, source: str, target: str, relation: Literal["<", ">", "="]):
        if not (
            source.startswith("start")
            or source.startswith("end")
            or source.startswith("instant")
        ):
            raise ValueError(
                f"Invalid source: {source}. It must start with 'start', 'end' or 'instant'."
            )

        if not (
            target.startswith("start")
            or target.startswith("end")
            or target.startswith("instant")
        ):
            raise ValueError(
                f"Invalid target: {target}. It must start with 'start', 'end' or 'instant'."
            )

        if relation not in RELATIONS:
            raise ValueError(f"Invalid relation type: {relation}")
        self.source = source
        self.target = target
        self.type = relation

    def __str__(self) -> str:
        return f"{self.source} {self.type} {self.target}"

    def __repr__(self) -> str:
        return f"Relation({self.source}, {self.target}, {self.type})"

    def __eq__(self, other: "PointRelation") -> bool:
        if (
            self.source == other.source
            and self.target == other.target
            and self.type == other.type
        ):
            return True
        elif (
            self.source == other.target
            and self.target == other.source
            and self.type == INVERT_POINT_RELATION[other.type]
        ):
            return True
        return False

    def __ne__(self, other: "PointRelation") -> bool:
        return not self == other

    def __invert__(self) -> "PointRelation":
        return PointRelation(
            source=self.target,
            target=self.source,
            relation=INVERT_POINT_RELATION[self.type],
        )

    def __hash__(self) -> int:
        tmp = sorted([self.source, self.target])
        if tmp[0] == self.source:
            return hash(tuple([self.source, self.target, self.type]))
        else:
            return hash(
                tuple([self.target, self.source, INVERT_POINT_RELATION[self.type]])
            )

    def to_dict(self) -> Dict:
        return {
            "source": self.source,
            "target": self.target,
            "relation": self.type,
        }

    @property
    def source_endpoint(self) -> str:
        return self.source.split(" ")[0]

    @property
    def source_id(self) -> str:
        return self.source.split(" ")[1]

    @property
    def target_endpoint(self) -> str:
        return self.target.split(" ")[0]

    @property
    def target_id(self) -> str:
        return self.target.split(" ")[1]


class Timeline:
    def __init__(self, relations: List[PointRelation] | None = None):
        if relations is not None:
            self._relations = set(relations)
            self._closure = self._compute_closure(self._relations)
        else:
            self._relations = set()
            self._closure = None

    def __str__(self) -> str:
        return "\n".join([str(r) for r in self._relations])

    def __repr__(self) -> str:
        return f"Timeline({self._relations})"

    def __len__(self) -> int:
        return len(self._relations)

    def __contains__(self, relation: PointRelation) -> bool:
        return relation in self._relations

    def add(self, relation: PointRelation):
        self._relations.add(relation)
        self._closure = self._compute_closure(self._relations)

    @staticmethod
    def _compute_closure(relations: Set[PointRelation]) -> Set[PointRelation]:
        """Compute the closure of the relations."""
        dict_relations = [relation.to_dict() for relation in relations]
        none_relations = [rel for rel in dict_relations if rel["relation"] == "-"]

        # Add the self relations
        unique_interval_entities = set(
            [
                entity.split()[-1]
                for relation in dict_relations
                for entity in [relation["source"], relation["target"]]
                if entity.split()[0] != "instant"
            ]
        )
        dict_relations += [
            PointRelation(f"start {entity}", f"end {entity}", "<").to_dict()
            for entity in unique_interval_entities
        ]

        inferred_relations = _compute_point_temporal_closure(dict_relations)
        inferred_relations += none_relations

        # Remove the self relations
        inferred_relations = [
            relation
            for relation in inferred_relations
            if relation["source"].split()[-1] != relation["target"].split()[-1]
        ]

        return set(PointRelation(**relation) for relation in inferred_relations)

    @property
    def relations(self) -> Set[PointRelation]:
        """Get the temporal relations that were explicitly added to the timeline."""
        return self._relations

    @property
    def closure(self) -> Set[PointRelation]:
        """Get all the relations. The ones that were explicitly added and the ones that can be inferred."""
        return Timeline(self._closure)

    @property
    def is_valid(self) -> bool:
        """Check if the timeline is valid.

        A timeline is valid if its closure doesn't contain any contradictions.
        """
        if len(self.relations) != 0 and len(self._closure) == 0:
            return False

        relations_entity_pairs = set(
            EntityPair(relation.source, relation.target) for relation in self._relations
        )
        if len(relations_entity_pairs) != len(self._relations):
            return False

        closure_entity_pairs = set(
            EntityPair(relation.source, relation.target) for relation in self._closure
        )
        if len(closure_entity_pairs) != len(self._closure):
            return False

        return True

    def to_dict(self) -> Dict:
        """Return the relations as a list of dictionaries."""
        return [relation.to_dict() for relation in self._relations]

    def sort(self, entities: List[str]) -> "Timeline":
        """Sort the relations by the entities order.
        If a relation is e2 < e1 but e1 is before e2 in the entities list, then the relation is inverted e1 > e2.
        This is useful in the closure timeline which outputs all the relations as either <, =, or -.
        """
        sorted_relations = []
        for relation in self._relations:
            src_entity = relation.source_id.split(" ")[-1]
            src_idx = entities.index(src_entity)

            tgt_entity = relation.target_id.split(" ")[-1]
            tgt_idx = entities.index(tgt_entity)

            if src_idx < tgt_idx:
                sorted_relations.append(relation)
            else:
                sorted_relations.append(~relation)
        return Timeline(sorted_relations)
