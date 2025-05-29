import copy
import math
import random
from dataclasses import dataclass
from typing import Callable, Literal

import datasets
import numpy as np
import transformers

from src.base import (
    ENDPOINTS,
    ID2RELATIONS,
    NEW_TOKENS,
    RELATIONS,
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
    "small_temporal_games_default_2",
    "small_temporal_games_closure_2",
    "small_temporal_games_default_3",
    "small_temporal_games_closure_3",
    "small_temporal_games_default_4",
    "small_temporal_games_closure_4",
    "small_temporal_games_default_5",
    "small_temporal_games_closure_5",
]


REWARD_ANNOTATED_CORRECT = 1.0
REWARD_INFERRED = 0.0
REWARD_SUCCESS = 0.0
REWARD_INVALID = -1.0
REWARD_VALID = 0.0


@dataclass
class GameTracker:
    step_id: int = 0
    n_inferred: int = 0
    n_annotated: int = 0
    n_annotated_correct: int = 0
    new_relations: set = None


class Game:
    def __init__(
        self,
        doc: dict,
        dim: int,
        tokenizer: Callable[[str], dict],
        max_seq_len: int,
        reward_map: dict,
    ):
        """
        Initialize the game.

        Args:
            doc (dict): The document annotated with temporal relations.
            dim (int): The dimension of the game, i.e., the number of positions in the board to be filled.
        """
        self.dim = dim
        self.tokenizer = tokenizer
        self.max_seq_len = max_seq_len
        self.reward_map = reward_map

        self.true_doc = doc
        self.pred_doc = copy.deepcopy(self.true_doc)
        self.pred_doc["relations"] = []

        # Initialize endpoints and contexts
        self.endpoints = [
            Endpoint(**ent, type=endpoint)
            for ent in doc["entities"]
            for endpoint in ENDPOINTS
        ]

        self.idx2edp_pair = {}
        idx = 0
        for tgt_idx, tgt_ept in enumerate(self.endpoints):  # TODO: Check if it is ok
            for src_idx, src_ept in enumerate(self.endpoints):
                if src_idx < tgt_idx and src_ept.id != tgt_ept.id:
                    self.idx2edp_pair[idx] = (str(src_ept), str(tgt_ept))
                    idx += 1

        self.edp_pair2idx = {
            (src, tgt): idx for idx, (src, tgt) in self.idx2edp_pair.items()
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

        self.last_action = None

    def tokenize(self, text: str) -> dict:
        return self.tokenizer(
            text,
            padding="max_length",
            truncation=True,
            return_tensors="np",
            max_length=self.max_seq_len,
        )

    @property
    def observation(self) -> dict:
        """Get the current observation."""
        return self.state

    def step(self, action: tuple[int, int]) -> tuple[dict, float, bool, bool, dict]:
        """Take a step in the game."""
        self.tracker.step_id += 1
        self.last_action = action

        position, _ = action
        if self.state["predictions"][position] != UNCLASSIFIED_POSITION:
            return self.handle_invalid_action()

        self.state["predictions"] = self.update_predictions(action)
        terminated, is_success = self.terminated
        reward = self.compute_step_reward(terminated, is_success)
        return self.state, reward, terminated, False, is_success

    def init_state(self):
        # Tokenize context
        context = add_tags(self.true_doc["text"], self.true_doc["entities"])
        context_inputs = self.tokenize(context)

        # New token idxs
        new_token_ids = self.tokenizer.convert_tokens_to_ids(NEW_TOKENS)
        new_tokens_idxs = np.where(context_inputs["input_ids"] >= min(new_token_ids))[1]
        edp_idxs = []
        for i in range(0, len(new_tokens_idxs), 4):
            start_edp_idxs = new_tokens_idxs[[i, i + 2, i + 3]].tolist()
            end_edp_idxs = new_tokens_idxs[[i + 1, i + 2, i + 3]].tolist()
            edp_idxs.append(start_edp_idxs)
            edp_idxs.append(end_edp_idxs)
        edp_idxs_maps = {str(edp): idxs for edp, idxs in zip(self.endpoints, edp_idxs)}
        new_tokens_map = np.zeros((self.dim, 6))
        for ridx, (src, tgt) in enumerate(self.idx2edp_pair.values()):
            src_idxs = edp_idxs_maps[str(src)]
            tgt_idxs = edp_idxs_maps[str(tgt)]
            new_tokens_map[ridx, :] = np.array(src_idxs + tgt_idxs)

        # Init the state board
        predictions = self.make_predictions([])

        return {
            "input_ids": context_inputs["input_ids"],
            "attention_mask": context_inputs["attention_mask"],
            "new_tokens_idxs": new_tokens_map,
            "predictions": predictions,
        }

    def update_predictions(self, action):
        """Update the environment state based on the action."""
        position, rel_idx = action
        src_endpoint, tgt_endpoint = self.idx2edp_pair[position]

        # Add the new relation
        relation = PointRelation(
            source=src_endpoint,
            target=tgt_endpoint,
            relation=ID2RELATIONS[rel_idx],
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
        predictions = self.make_predictions(self.pred_doc["relations"])
        return predictions

    def make_predictions(self, relations):
        """Make the state of the environment."""
        predictions = np.full(
            shape=(self.dim, 1), fill_value=MASKED_POSITION, dtype=int
        )
        predictions[list(self.idx2edp_pair.keys())] = UNCLASSIFIED_POSITION
        for rel in relations:
            idx = self.edp_pair2idx[(rel["source"], rel["target"])]
            predictions[idx] = RELATIONS2ID[rel["relation"]]
        return predictions

    def handle_invalid_action(self):
        """Handle invalid action (position already taken)."""
        return (
            {
                "state": self._state,
                "contexts": self._contexts["input_ids"],
                "attention_mask": self._contexts["attention_mask"],
                "new_tokens_idxs": self._contexts["new_tokens_idxs"],
            },
            REWARD_INVALID,
            False,
            False,
            {},
        )

    @property
    def terminated(self):
        """Check if the episode should terminate."""
        is_success = False
        terminated = False

        if not self.pred_timeline.is_valid:
            terminated = True
        elif (~self.position_mask).all():
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
    def position_mask(self):
        """True if the position is unclassified and not masked. Otherwise False."""
        return (self.state["predictions"] == UNCLASSIFIED_POSITION).reshape(-1)


class TemporalGameEnv:
    """Vectorized Temporal Game environment."""

    metadata = {"render_modes": ["rgb_array"]}

    N_RELATIONS = len(RELATIONS)
    N_RELATIONS_PER_ENTITY_PAIR = 4

    def __init__(
        self,
        tokenizer: transformers.PreTrainedTokenizer,
        level: int = 2,
        level_lower_or_equal: bool = True,
        closure: bool = False,
        mode: Literal["train", "valid", "test"] = "test",
        max_seq_len: int = 128,
    ):

        self.mode = mode
        self.tokenizer = tokenizer
        self.max_seq_len = max_seq_len

        self.docs = self._load_documents(
            level, closure, mode, max_seq_len, level_lower_or_equal
        )
        self.n_docs = len(self.docs)

        self._obs_dim = math.comb(level, 2) * self.N_RELATIONS_PER_ENTITY_PAIR

        self.reward_map = {
            "<": REWARD_ANNOTATED_CORRECT,
            "=": REWARD_ANNOTATED_CORRECT,
            ">": REWARD_ANNOTATED_CORRECT,
            "-": REWARD_ANNOTATED_CORRECT,
        }

    def reset(
        self,
        doc_id: int | None = None,
        seed: int | None = None,
        options: dict | None = None,
    ):
        """Reset the environment to initial state.

        Args:
            seed: Optional random seed
            options: Optional configuration options (to be passed to gym.Env.reset)

        Returns:
            tuple: (observation dict, info dict)
        """
        super().reset(seed=seed, options=options)

        if doc_id is None:
            doc_id = random.randint(0, self.n_docs - 1)
        else:
            doc_id = doc_id

        self.doc_id = doc_id
        doc = copy.deepcopy(self.docs[doc_id])
        self.game = Game(
            doc, self._obs_dim, self.tokenizer, self.max_seq_len, self.reward_map
        )

        obs = self.game.observation
        info = self.get_info(terminated=False, is_success=False)
        return obs, info

    def step(self, action):
        obs, reward, terminated, truncated, is_success = self.game.step(action)
        info = self.get_info(terminated=terminated, is_success=is_success)
        return obs, reward, terminated, truncated, info

    def render(self):
        if self.render_mode == "rgb_array":
            return self._render_board()

    def _load_documents(
        self,
        level: int,
        closure: bool,
        mode: Literal["train", "valid", "test"],
        max_seq_len: int,
        level_lower_or_equal: bool,
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

        def _token_count(doc):
            return {"n_tokens": len(self.tokenizer.tokenize(doc["text"]))}

        docs = docs.map(_token_count)
        docs = docs.filter(lambda x: x["n_tokens"] <= max_seq_len)

        if len(docs) == 0:
            raise ValueError(
                f"No documents with less than {max_seq_len} tokens found in the dataset"
            )
        return docs

    def get_info(self, terminated, is_success):
        """Prepare the info dictionary for the step."""
        info = {
            "doc_id": self.doc_id,
            "n_inferred": self.game.tracker.n_inferred,
            "n_annotated": self.game.tracker.n_annotated,
            "n_annotated_correct": self.game.tracker.n_annotated_correct,
            "is_success": is_success,
            "terminal_observation": terminated,
        }
        if terminated:
            info["true_timeline"] = self.game.true_timeline
            info["pred_timeline"] = self.game.pred_timeline
        return info

    def state_to_board(self, state):
        """Convert the state to a board."""
        board = np.full(
            (self._n_endpoints, self._n_endpoints), MASKED_POSITION, dtype=int
        )
        edp_strs = [str(edp) for edp in self._endpoints]
        for idx, (src_edp, tgt_edp) in self._idx2edp_pair.items():
            row = edp_strs.index(src_edp)
            col = edp_strs.index(tgt_edp)
            board[row, col] = state[idx]
        board = board[:-2, 2:]  # Remove the last two rows and first two columns
        return board

    @property
    def n_entities(self):
        return self._n_entities

    @property
    def obs_dim(self):
        return self._obs_dim

    @property
    def n_endpoints(self):
        return self._n_endpoints

    @property
    def true_timeline(self):
        return self._true_timeline

    @property
    def pred_timeline(self):
        return self._pred_timeline

    def action_masks(self) -> list[bool]:
        """
        Action masks for the environment.

        True means the action is valid.
        False means the action is invalid.
        """
        relation_mask = np.ones(self.N_RELATIONS, dtype=bool)
        mask = np.concatenate([self.position_mask, relation_mask], axis=0)
        return mask.tolist()

    @property
    def position_mask(self):
        return self.game.position_mask
