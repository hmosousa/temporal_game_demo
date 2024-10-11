from typing import Set, Tuple

import networkx as nx

from typing import Any


class Relation:
    _VALID_RELATIONS = {"<", ">", "=", "-"}

    def __init__(self, value: str) -> None:
        if value not in self._VALID_RELATIONS:
            raise ValueError(f"Invalid relation value: {value}")
        self.value = value

    def __str__(self):
        return self.value

    def __repr__(self):
        return self.value

    def __invert__(self):
        if self.value == "<":
            return Relation(">")
        elif self.value == ">":
            return Relation("<")
        else:
            return self

    def __eq__(self, other):
        if isinstance(other, Relation):
            return self.value == other.value
        else:
            return False

    def __hash__(self) -> int:
        return hash(self.value)


class PointRelation:
    def __init__(self, source: str, target: str, relation: str | Relation) -> None:
        if any(arg is None for arg in (source, target, relation)):
            raise ValueError("Source, target, and relation must not be None.")

        self.source = source
        self.target = target
        self.relation = Relation(relation) if isinstance(relation, str) else relation

    def __str__(self):
        return f"{self.source} {self.relation} {self.target}"

    def __repr__(self):
        return f"{self.source} {self.relation} {self.target}"

    def __invert__(self):
        return PointRelation(self.target, self.source, ~self.relation)

    def __eq__(self, other):
        if isinstance(other, PointRelation):
            if (
                self.source == other.source
                and self.target == other.target
                and self.relation == other.relation
            ):
                return True

            elif (
                self.source == other.target
                and self.target == other.source
                and self.relation == ~other.relation
            ):
                return True
        else:
            return False

    def __hash__(self) -> int:
        s = sorted([self.source, self.target])
        if s == [self.source, self.target]:
            return hash(f"{self.source}{self.target}{self.relation}")
        else:
            return hash(f"{self.target}{self.source}{~self.relation}")

    @property
    def value(self) -> str:
        return self.relation.value

    def to_dict(self) -> dict:
        return {
            "source": str(self.source),
            "target": str(self.target),
            "relation": str(self.relation),
        }


class Timeline:
    def __init__(
        self,
        relations: set[PointRelation] = None,
    ):
        if relations is not None:
            self.relations = set(relations)
        else:
            self.relations = set()

    def __call__(self) -> Any:
        return self.relations

    def __iter__(self):
        return iter(self.relations)

    def __len__(self) -> int:
        return len(self.relations)

    def __next__(self):
        return next(self.relations)

    def __add__(self, other: PointRelation) -> "Timeline":
        self.relations.add(other)
        return self

    def __iadd__(self, other: PointRelation) -> "Timeline":
        self.relations.add(other)
        return self

    def __eq__(self, other):
        if isinstance(other, Timeline):
            return self.relations == other.relations
        else:
            return False

    def to_dict(self) -> dict:
        return [r.to_dict() for r in self.relations]
    
    @classmethod
    def from_relations(cls, relations: list[dict]) -> "Timeline":
        return cls([PointRelation(**r) for r in relations]) 

    def closure(self) -> "Timeline":
        inferred_relations = compute_temporal_closure(self.to_dict())
        return Timeline([PointRelation(**r) for r in inferred_relations])


def compute_temporal_closure(relations):
    # make all relations "<" or "="
    edges = set()
    equal_nodes = set()
    null_relations = set()
    for relation in relations:
        if relation["relation"] == "<":
            edges.add((relation["source"], relation["target"]))

        elif relation["relation"] == ">":
            edges.add((relation["target"], relation["source"]))

        elif relation["relation"] == "=":
            sorted_nodes = tuple(sorted((relation["source"], relation["target"])))
            equal_nodes.add(sorted_nodes)

        elif relation["relation"] == "-":
            null_relations.add((relation["source"], relation["relation"], relation["target"]))

    # build to equal graph
    equal_graph = nx.Graph()
    equal_graph.add_edges_from(equal_nodes)

    equal_point_relations = set()
    for connected_nodes in nx.connected_components(equal_graph):
        while len(connected_nodes) > 1:
            n1 = connected_nodes.pop()
            for n2 in connected_nodes:
                equal_point_relations.add((n1, "=", n2))

    # build temporal graph
    tempgraph = nx.DiGraph()
    tempgraph.add_edges_from(edges)
    inferred_point_relations = _get_connected_nodes(tempgraph)
    inferred_point_relations = set((n1, "<", n2) for n1, n2 in inferred_point_relations)

    # add relations to points that are equivalent
    new_point_relations = set()
    for relation in inferred_point_relations:
        for node1_eq, _, node2_eq in equal_point_relations:
            if node2_eq in relation:
                new_point_relations.update(
                    [tuple(map(lambda x: x.replace(node2_eq, node1_eq), relation))]
                )

            if node1_eq in relation:
                new_point_relations.update(
                    [tuple(map(lambda x: x.replace(node1_eq, node2_eq), relation))]
                )

    inferred_point_relations.update(new_point_relations)
    inferred_point_relations.update(equal_point_relations)
    inferred_point_relations.update(null_relations)
    
    return [
        {"relation": relation, "source": source, "target": target}
        for source, relation, target in inferred_point_relations
    ]


def _get_connected_nodes(graph: nx.Graph) -> Set[Tuple[str, str]]:
    """Retrieve the pairs of nodes that are connected by a path

    :param graph: A directed graph.
    :type: nx.Graph

    :return: Set[Tuple[str, str]]
    """

    # segment the temporal graph in disconnected graphs
    undirected = graph.to_undirected()
    sub_graphs_nodes = nx.connected_components(undirected)
    sub_graphs = [graph.subgraph(nodes) for nodes in sub_graphs_nodes]

    # retrieve all the possible paths between root and leaf nodes
    node_pairs = set()
    for sub_graph in sub_graphs:
        for node in sub_graph.nodes:
            descendants = nx.algorithms.descendants(sub_graph, node)
            node_pairs.update(list(zip([node] * len(descendants), descendants)))

    return node_pairs
