import copy
from dataclasses import dataclass
from typing import Literal

import datasets
import numpy as np

from src.base import (
    ENDPOINTS,
    RELATIONS2ID,
    Endpoint,
    EntityPair,
    PointRelation,
    Timeline,
)
from src.constants import HF_DIR
from src.utils import add_tags

UNCLASSIFIED_POSITION = -1
MASKED_POSITION = -2


DATASETS = [
    "small_temporal_games_closure_2",
    "small_temporal_games_closure_3",
    "small_temporal_games_closure_4",
    "small_temporal_games_closure_5",
]


REWARD_ANNOTATED_CORRECT = 1.0
REWARD_INFERRED = 0.0
REWARD_SUCCESS = 0.0
REWARD_INVALID = -1.0
REWARD_VALID = 0.0


def load_documents(
    level: int,
    closure: bool = True,
    mode: Literal["train", "valid", "test"] = "test",
    level_lower_or_equal: bool = False,
):
    data_split = "default" if not closure else "closure"

    if level_lower_or_equal:
        docs = []
        for dataset in DATASETS:
            dataset_level = int(dataset[-1])
            if dataset_level <= level and data_split in dataset:
                docs.append(datasets.load_from_disk(str(HF_DIR / dataset / mode)))
        docs = datasets.concatenate_datasets(docs)
    else:
        docs = datasets.load_from_disk(
            str(HF_DIR / f"small_temporal_games_{data_split}_{level}" / mode)
        )
    return docs


@dataclass
class GameTracker:
    step_id: int = 0
    n_inferred: int = 0
    n_annotated: int = 0
    n_annotated_correct: int = 0
    new_relations: set = None
    timeline_history: list = None
    board_history: list = None

    def __post_init__(self):
        if self.timeline_history is None:
            self.timeline_history = []
        if self.board_history is None:
            self.board_history = []


class TemporalGame:
    def __init__(
        self,
        doc: dict,
    ):
        """
        Initialize the game.

        Args:
            doc (dict): The document annotated with temporal relations.
            dim (int): The dimension of the game, i.e., the number of positions in the board to be filled.
        """
        self.reward_map = {
            "<": REWARD_ANNOTATED_CORRECT,
            "=": REWARD_ANNOTATED_CORRECT,
            ">": REWARD_ANNOTATED_CORRECT,
            "-": REWARD_ANNOTATED_CORRECT,
        }

        entity_map = {}
        for eid, entity in enumerate(doc["entities"]):
            new_id = f"e{eid}"
            entity_map[entity["id"]] = new_id
            entity["id"] = new_id

        for rel in doc["relations"]:
            old_src_id = rel["source"].split(" ")[1]
            new_src_id = entity_map[old_src_id]
            rel["source"] = rel["source"].replace(old_src_id, new_src_id)

            old_tgt_id = rel["target"].split(" ")[1]
            new_tgt_id = entity_map[old_tgt_id]
            rel["target"] = rel["target"].replace(old_tgt_id, new_tgt_id)
            
        # sort entities by offsets
        doc["entities"].sort(key=lambda x: x["offsets"][0])

        self.true_doc = doc
        self.pred_doc = copy.deepcopy(self.true_doc)
        self.pred_doc["relations"] = []

        # Initialize endpoints and contexts
        internal_endpoints = [
            Endpoint(**ent, type_=endpoint)
            for ent in doc["entities"]
            for endpoint in ENDPOINTS
            if ent.get("type", "interval") == "interval"
        ]
        instant_endpoints = [
            Endpoint(**ent, type_="instant")
            for ent in doc["entities"]
            if ent.get("type", "interval") == "instant"
        ]
        self.endpoints = internal_endpoints + instant_endpoints
        
        self.n_endpoints = len(self.endpoints)

        self.idx2edp_pair = {}
        for tgt_idx, tgt_ept in enumerate(self.endpoints):  # TODO: Check if it is ok
            for src_idx, src_ept in enumerate(self.endpoints):
                if src_idx < tgt_idx and src_ept.id != tgt_ept.id:
                    self.idx2edp_pair[(src_idx, tgt_idx)] = (str(src_ept), str(tgt_ept))

        self.edp_pair2idx = {
            (src, tgt): (src_idx, tgt_idx)
            for (src_idx, tgt_idx), (src, tgt) in self.idx2edp_pair.items()
        }
        self.true_timeline = Timeline(
            [PointRelation(**rel) for rel in self.true_doc["relations"]]
        )
        self.entity_pairs = set(
            EntityPair(rel["source"], rel["target"])
            for rel in self.true_doc["relations"]
        )
        self.pred_timeline = Timeline()
        self.state = self.init_state()

        self.tracker = GameTracker()

    def reset(self):
        return self.state, self.get_info(terminated=False, is_success=False)

    def step(
        self, action: tuple[tuple[int, int], str]
    ) -> tuple[dict, float, bool, bool, dict]:
        """Take a step in the game."""
        # Save current state before making changes
        self.save_state_for_undo()

        self.tracker.step_id += 1

        self.state["board"] = self.update_board(action)
        terminated, is_success = self.terminated
        reward = self.compute_step_reward(terminated, is_success)
        info = self.get_info(terminated=terminated, is_success=is_success)
        return self.state, reward, terminated, info

    def save_state_for_undo(self):
        """Save current timeline and board state for undo functionality."""
        # Deep copy the current timeline to preserve state
        current_timeline_copy = Timeline(list(self.pred_timeline.relations))
        self.tracker.timeline_history.append(current_timeline_copy)

        # Save current board state
        current_board = self.make_board(self.pred_doc["relations"])
        self.tracker.board_history.append(current_board)

    def undo_last_action(self) -> bool:
        """Undo the last action and restore previous state.

        Returns:
            bool: True if undo was successful, False if no actions to undo
        """
        if not self.tracker.timeline_history or not self.tracker.board_history:
            return False

        # Restore previous timeline state
        previous_timeline = self.tracker.timeline_history.pop()
        self.pred_timeline = previous_timeline

        # Restore previous board state
        previous_board = self.tracker.board_history.pop()

        # Update pred_doc to match the restored timeline
        self.pred_doc["relations"] = self.pred_timeline.to_dict()

        # Update the state with the restored board
        self.state["board"] = previous_board

        # Decrement step counter
        if self.tracker.step_id > 0:
            self.tracker.step_id -= 1

        return True

    def init_state(self):
        context = add_tags(self.true_doc["text"], self.true_doc["entities"])
        board = self.make_board()
        endpoints = [f"{edp.type} {edp.text}" for edp in self.endpoints]
        return {
            "context": context,
            "board": board,
            "endpoints": endpoints,
            "entities": [ent["text"] for ent in self.true_doc["entities"]],
        }

    def update_board(self, action):
        """Update the environment state based on the action."""
        [src_idx, tgt_idx], relation = action
        src_endpoint, tgt_endpoint = self.idx2edp_pair[(src_idx, tgt_idx)]

        # Add the new relation
        relation = PointRelation(
            source=src_endpoint,
            target=tgt_endpoint,
            relation=relation,
        )
        self.pred_timeline.add(relation)

        # Update inferred relations count
        inferred_relations = (
            self.pred_timeline.closure.relations - self.pred_timeline.relations
        )
        self.tracker.n_inferred += len(inferred_relations)

        # Keep the new annotated relations to compute the reward
        self.tracker.new_relations = inferred_relations | {relation}
        self.tracker.n_annotated += len(self.tracker.new_relations)

        # Update the timeline
        ent_ids = [ent["id"] for ent in self.true_doc["entities"]]
        self.pred_timeline = self.pred_timeline.closure.sort(ent_ids)
        self.pred_doc["relations"] = self.pred_timeline.to_dict()

        # Update board state
        board = self.make_board(self.pred_doc["relations"])
        return board

    def make_board(self, relations=None):
        """Make the state of the environment."""
        board = np.full(
            shape=(self.n_endpoints, self.n_endpoints),
            fill_value=MASKED_POSITION,
            dtype=int,
        )
        for idx in self.idx2edp_pair.keys():
            board[idx] = UNCLASSIFIED_POSITION
        if relations is not None:
            for rel in relations:
                src_idx, tgt_idx = self.edp_pair2idx[(rel["source"], rel["target"])]
                board[src_idx, tgt_idx] = RELATIONS2ID[rel["relation"]]
        return board.tolist()

    @property
    def terminated(self):
        """Check if the episode should terminate."""
        is_success = False
        terminated = False

        if not self.pred_timeline.is_valid:
            terminated = True
        elif self.all_classified:
            terminated = True
            # Check if all the predicted relations are in the true timeline
            is_success = self.true_timeline.relations.issubset(
                self.pred_timeline.relations
            )

        return terminated, is_success

    def compute_step_reward(self, terminated, is_success):
        """Compute the reward for the current step."""
        if terminated and not is_success:
            return REWARD_INVALID

        new_annotated_correct = (
            self.tracker.new_relations & self.true_timeline.relations
        )
        # The incorrect relations are the ones that are not annotated in the true timeline
        # For that we also need to filter the relations that we predicted but are not annotated.
        new_annotated_incorrect = [
            rel
            for rel in self.tracker.new_relations
            if rel not in self.true_timeline.relations
            and EntityPair(rel.source, rel.target) in self.entity_pairs
        ]
        self.tracker.n_annotated_correct += len(new_annotated_correct)

        reward = 0.0
        if is_success:
            reward += REWARD_SUCCESS

        reward += sum(self.reward_map[rel.type] for rel in new_annotated_correct)
        reward -= sum(self.reward_map[rel.type] for rel in new_annotated_incorrect)

        return reward

    @property
    def all_classified(self):
        """True if all the positions are classified. Otherwise False."""
        for [src_idx, tgt_idx] in self.idx2edp_pair.keys():
            if self.state["board"][src_idx][tgt_idx] == UNCLASSIFIED_POSITION:
                return False
        return True

    def get_info(self, terminated, is_success):
        """Prepare the info dictionary for the step."""
        info = {
            "n_inferred": self.tracker.n_inferred,
            "n_annotated": self.tracker.n_annotated,
            "n_annotated_correct": self.tracker.n_annotated_correct,
            "is_success": is_success,
            "terminal_observation": terminated,
        }
        if terminated:
            info["true_board"] = self.make_board(self.true_doc["relations"])
        return info

    def undo(self):
        """Undo the last action in the game.

        Returns:
            tuple: (observation dict, info dict, success bool)
        """
        success = self.undo_last_action()
        if success:
            obs = self.state
            terminated, is_success = self.terminated
            info = self.get_info(terminated=terminated, is_success=is_success)
            return obs, info, True
        else:
            # No actions to undo
            obs = self.state
            terminated, is_success = self.terminated
            info = self.get_info(terminated=terminated, is_success=is_success)
            return obs, info, False

    @property
    def n_relations(self):
        """Number of relations in the true timeline."""
        return len(self.edp_pair2idx)
    