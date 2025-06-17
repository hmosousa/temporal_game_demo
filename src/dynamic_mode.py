"""
Dynamic mode annotation for the Temporal Game.

This module implements the dynamic mode annotation as described in the paper,
where the interface presents a temporal board for only two entities at a time.
Entity pairs can be selected either randomly or in a guided manner using
confidence scores from a temporal relation classification model.
"""

import copy
import random
from typing import List, Dict, Tuple, Optional
from src.relation_classifier import RelationClassifier
from src.env import TemporalGame
from src.base import EntityPair, Endpoint


class DynamicModeManager:
    """Manages dynamic mode annotation sessions."""
    
    def __init__(self):
        self.classifier = RelationClassifier()
    
    def create_dynamic_session(self, text: str, entities: List[Dict], dct: Optional[str] = None,
                             mode: str = "guided") -> Dict:
        """Create a new dynamic mode annotation session.
        
        Args:
            text: The document text
            entities: List of entity dictionaries
            dct: Document creation time (optional)
            mode: Selection mode ('guided' or 'random')
            
        Returns:
            Dictionary containing session data
        """
        if len(entities) < 2:
            raise ValueError("At least 2 entities required for dynamic mode")
        
        # Get ordered entity pairs based on mode
        if mode == "guided":
            ordered_pairs = self.classifier.get_entity_pairs_for_dynamic_mode(entities, mode="guided", text=text)
        else:
            ordered_pairs = self.classifier.get_entity_pairs_for_dynamic_mode(entities, mode="random", text=text)
        
        session_data = {
            "text": text,
            "entities": entities,
            "dct": dct,
            "mode": mode,
            "ordered_pairs": ordered_pairs,
            "current_pair_index": 0,
            "annotated_pairs": [],
            "current_game": None,
            "relations": []
        }
        
        # Initialize first pair
        if ordered_pairs:
            session_data = self._load_next_pair(session_data)
        
        return session_data
    
    def _load_next_pair(self, session_data: Dict) -> Dict:
        """Load the next entity pair for annotation.
        
        Args:
            session_data: Current session data
            
        Returns:
            Updated session data with current game loaded
        """
        ordered_pairs = session_data["ordered_pairs"]
        current_index = session_data["current_pair_index"]
        
        if current_index >= len(ordered_pairs):
            # No more pairs to annotate
            session_data["current_game"] = None
            return session_data
        
        # Get current pair indices
        entity_idx1, entity_idx2 = ordered_pairs[current_index]
        current_entities = [
            session_data["entities"][entity_idx1],
            session_data["entities"][entity_idx2]
        ]
        
        # Create a mock document for the pair
        mock_doc = {
            "text": session_data["text"],
            "entities": [
                {
                    "id": f"e{i}",
                    "text": entity.get("text", session_data["text"][entity["start"]:entity["end"]]),
                    "offsets": [entity["start"], entity["end"]],
                    "type": entity.get("type", "interval"),
                }
                for i, entity in enumerate(current_entities)
            ],
            "relations": [],
        }
        
        # Create TemporalGame instance for this pair
        game = TemporalGame(mock_doc)
        obs, info = game.reset()
        
        session_data["current_game"] = game
        session_data["current_entities"] = current_entities
        session_data["current_entity_indices"] = (entity_idx1, entity_idx2)
        session_data["current_obs"] = obs
        session_data["current_info"] = info
        
        return session_data
    
    def step_dynamic_session(self, session_data: Dict, action: Tuple[Tuple[int, int], str]) -> Dict:
        """Take a step in the dynamic annotation session.
        
        Args:
            session_data: Current session data
            action: The action to take (position, relation)
            
        Returns:
            Updated session data
        """
        current_game = session_data["current_game"]
        if not current_game:
            raise ValueError("No current game in session")
        
        # Take step in current game
        obs, reward, terminated, info = current_game.step(action)
        
        # Update session data
        session_data["current_obs"] = obs
        session_data["current_info"] = info
        
        # Track the relation globally
        entity_idx1, entity_idx2 = session_data["current_entity_indices"]
        position, relation = action
        session_data["relations"].append({
            "entity_indices": (entity_idx1, entity_idx2),
            "position": position,
            "relation": relation,
            "pair_index": session_data["current_pair_index"]
        })
        
        # Check if current pair is complete or has errors
        if terminated or current_game.all_classified:
            # Mark pair as complete and move to next
            session_data["annotated_pairs"].append(session_data["current_entity_indices"])
            session_data["current_pair_index"] += 1
            session_data = self._load_next_pair(session_data)
        
        return session_data
    
    def undo_dynamic_session(self, session_data: Dict) -> Tuple[Dict, bool]:
        """Undo the last action in dynamic annotation session.
        
        Args:
            session_data: Current session data
            
        Returns:
            Tuple of (updated session data, success flag)
        """
        current_game = session_data["current_game"]
        if not current_game:
            return session_data, False
        
        # Try to undo in current game
        obs, info, success = current_game.undo()
        
        if success:
            # Update session data
            session_data["current_obs"] = obs
            session_data["current_info"] = info
            
            # Remove last relation from global tracking
            if session_data["relations"]:
                last_relation = session_data["relations"][-1]
                if last_relation["pair_index"] == session_data["current_pair_index"]:
                    session_data["relations"].pop()
        
        return session_data, success
    
    def get_next_pair_info(self, session_data: Dict) -> Optional[Dict]:
        """Get information about the next pair to be annotated.
        
        Args:
            session_data: Current session data
            
        Returns:
            Dictionary with next pair info or None if no more pairs
        """
        ordered_pairs = session_data["ordered_pairs"]
        current_index = session_data["current_pair_index"]
        
        if current_index >= len(ordered_pairs):
            return None
        
        entity_idx1, entity_idx2 = ordered_pairs[current_index]
        entities = session_data["entities"]
        
        return {
            "entity_indices": (entity_idx1, entity_idx2),
            "entity1": entities[entity_idx1],
            "entity2": entities[entity_idx2],
            "pair_number": current_index + 1,
            "total_pairs": len(ordered_pairs)
        }
    
    def skip_current_pair(self, session_data: Dict) -> Dict:
        """Skip the current entity pair and move to the next one.
        
        Args:
            session_data: Current session data
            
        Returns:
            Updated session data
        """
        # Mark current pair as annotated (skipped)
        if session_data["current_game"]:
            session_data["annotated_pairs"].append(session_data["current_entity_indices"])
        
        # Move to next pair
        session_data["current_pair_index"] += 1
        return self._load_next_pair(session_data)
    
    def is_session_complete(self, session_data: Dict) -> bool:
        """Check if the dynamic annotation session is complete.
        
        Args:
            session_data: Current session data
            
        Returns:
            True if all pairs have been processed
        """
        return session_data["current_pair_index"] >= len(session_data["ordered_pairs"])
    
    def get_session_progress(self, session_data: Dict) -> Dict:
        """Get progress information for the session.
        
        Args:
            session_data: Current session data
            
        Returns:
            Dictionary with progress information
        """
        total_pairs = len(session_data["ordered_pairs"])
        completed_pairs = len(session_data["annotated_pairs"])
        current_pair = session_data["current_pair_index"]
        
        return {
            "total_pairs": total_pairs,
            "completed_pairs": completed_pairs,
            "current_pair": current_pair + 1 if current_pair < total_pairs else total_pairs,
            "progress_percent": (completed_pairs / total_pairs) * 100 if total_pairs > 0 else 100,
            "remaining_pairs": max(0, total_pairs - current_pair),
            "is_complete": self.is_session_complete(session_data)
        } 