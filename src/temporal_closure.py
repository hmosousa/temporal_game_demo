from typing import Set, Tuple

import networkx as nx


def compute_temporal_closure(relations):
    # make all relations "<" or "="
    edges = set()
    equal_nodes = set()
    for relation in relations:
        if relation["relation"] == "<":
            edges.add((relation["source"], relation["target"]))

        if relation["relation"] == ">":
            edges.add((relation["target"], relation["source"]))

        elif relation["relation"] == "=":
            sorted_nodes = tuple(sorted((relation["source"], relation["target"])))
            equal_nodes.add(sorted_nodes)

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
