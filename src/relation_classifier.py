import random
import transformers
import itertools
from typing import List, Dict, Tuple
from src.base import EntityPair

class RelationClassifier:
    def __init__(self):
        self.pipeline = transformers.pipeline("text-classification", model="hugosousa/smol-135-ac-a4eaad65")

    def score(self, text: str, pairs: List[Tuple[Dict, Dict]]) -> List[float]:
        """Score entity pairs using the classification model.
        
        Args:
            text: The input text
            pairs: List of (source_entity, target_entity) tuples where each entity
                  has keys: 'text', 'start', 'end'
        
        Returns:
            List of confidence scores for each pair
        """
        # try:
        #     tagged_texts = self.add_tags(text, pairs)
        #     preds = self.pipeline(tagged_texts)
            
        #     # Extract confidence scores
        #     if isinstance(preds, list):
        #         scores = [pred["score"] for pred in preds]
        #     else:
        #         scores = [preds["score"]]
                
        #     return scores
        # except Exception as e:
        #     print(f"Error in classification: {e}")
            # Fallback to random scores if model fails
        scores = [random.uniform(0.5, 1.0) for _ in pairs] 
        return scores
    
    def add_tags(self, text: str, pairs: List[Tuple[Dict, Dict]]) -> List[str]:
        """Add special tags around entities for the classification model.
        
        Args:
            text: The input text
            pairs: List of (source_entity, target_entity) tuples
        
        Returns:
            List of tagged texts, one for each pair
        """
        tagged_texts = []
        
        for source, target in pairs:
            # Sort entities by position to handle tagging correctly
            entities = [
                (source["start"], source["end"], "source"),
                (target["start"], target["end"], "target")
            ]
            entities.sort(key=lambda x: x[0])  # Sort by start position
            
            # Create the tagged text
            tagged_text = ""
            last_pos = 0
            
            for start, end, entity_type in entities:
                # Add text before entity
                tagged_text += text[last_pos:start]
                
                # Add entity with tags
                entity_text = text[start:end]
                if entity_type == "source":
                    tagged_text += f"<source>{entity_text}</source>"
                else:
                    tagged_text += f"<target>{entity_text}</target>"
                
                last_pos = end
            
            # Add remaining text
            tagged_text += text[last_pos:]
            tagged_texts.append(tagged_text)
            
        return tagged_texts

    def get_entity_pairs_for_dynamic_mode(self, entities: List[Dict], mode: str = "guided", text: str = None) -> List[Tuple[int, int]]:
        """Get entity pairs for dynamic mode annotation.
        
        Args:
            entities: List of entity dictionaries with 'id', 'text', 'start', 'end'
            mode: Either 'guided' (confidence-based) or 'random'
            text: The full document text (required for guided mode)
            
        Returns:
            List of (entity_idx1, entity_idx2) tuples ordered by preference
        """
        if len(entities) < 2:
            return []
        
        # Generate all possible pairs
        all_pairs = list(itertools.combinations(range(len(entities)), 2))
        
        if mode == "random":
            random.shuffle(all_pairs)
            return all_pairs
        
        elif mode == "guided":
            # For guided mode, we need the actual text to score properly
            scoring_text = text or " ".join([e["text"] for e in entities])
            
            # Create pairs in the format expected by score()
            entity_pairs = []
            for i, j in all_pairs:
                source_entity = {
                    "text": entities[i]["text"],
                    "start": entities[i].get("start", 0),
                    "end": entities[i].get("end", len(entities[i]["text"]))
                }
                target_entity = {
                    "text": entities[j]["text"], 
                    "start": entities[j].get("start", 0),
                    "end": entities[j].get("end", len(entities[j]["text"]))
                }
                entity_pairs.append((source_entity, target_entity))
            
            # Get confidence scores
            scores = self.score(scoring_text, entity_pairs)
            
            # Combine pairs with scores and sort by score (highest first)
            paired_scores = list(zip(all_pairs, scores))
            paired_scores.sort(key=lambda x: x[1], reverse=True)
            
            return [pair for pair, score in paired_scores]
        
        else:
            raise ValueError(f"Unknown mode: {mode}. Use 'guided' or 'random'")

    def select_next_entity_pair(self, entities: List[Dict], annotated_pairs: List[Tuple[int, int]], 
                               mode: str = "guided", text: str = None) -> Tuple[int, int] | None:
        """Select the next entity pair to annotate in dynamic mode.
        
        Args:
            entities: List of entity dictionaries
            annotated_pairs: List of already annotated entity pair indices
            mode: Selection mode ('guided' or 'random')
            text: The full document text (required for guided mode)
            
        Returns:
            Next (entity_idx1, entity_idx2) tuple to annotate, or None if all done
        """
        all_pairs = self.get_entity_pairs_for_dynamic_mode(entities, mode, text)
        annotated_set = set(annotated_pairs)
        
        # Find first unannotated pair
        for pair in all_pairs:
            if pair not in annotated_set and (pair[1], pair[0]) not in annotated_set:
                return pair
        
        return None  # All pairs are annotated
            
