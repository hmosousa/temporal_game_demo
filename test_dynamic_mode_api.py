#!/usr/bin/env python3
"""
Test script for Dynamic Mode API endpoints.

This script demonstrates how to use the dynamic mode annotation API:
1. Create a dynamic session (guided or random mode)
2. Make annotation steps
3. Skip pairs
4. Get results
"""

import requests
import json


def test_dynamic_mode_api():
    base_url = "http://localhost:5000"
    
    # Test data
    test_data = {
        "text": "The meeting started at 9:00 AM and ended at 10:00 AM. John said he would arrive soon.",
        "entities": [
            {"text": "meeting", "start": 4, "end": 11, "type": "interval"},
            {"text": "started", "start": 12, "end": 19, "type": "interval"},
            {"text": "9:00 AM", "start": 23, "end": 30, "type": "interval"},
            {"text": "ended", "start": 35, "end": 40, "type": "interval"},
            {"text": "10:00 AM", "start": 44, "end": 52, "type": "interval"},
            {"text": "said", "start": 59, "end": 63, "type": "interval"},
            {"text": "arrive", "start": 75, "end": 81, "type": "interval"}
        ],
        "dct": "2023-01-15",
        "mode": "guided"
    }
    
    print("🚀 Testing Dynamic Mode API")
    print("=" * 50)
    
    # 1. Create dynamic session
    print("\n1. Creating dynamic session...")
    response = requests.post(f"{base_url}/api/new_dynamic_session", json=test_data)
    
    if response.status_code != 200:
        print(f"❌ Failed to create session: {response.text}")
        return
    
    session_data = response.json()
    session_id = session_data["session_id"]
    print(f"✅ Session created: {session_id}")
    print(f"   Mode: {session_data['mode']}")
    print(f"   Current pair: {session_data.get('current_pair', {}).get('pair_number', 'N/A')} of {session_data.get('progress', {}).get('total_pairs', 'N/A')}")
    
    # 2. Make some annotation steps
    print("\n2. Making annotation steps...")
    
    # Example annotation (position [0,1] with relation "<")
    action = [[0, 1], "<"]  # First entity start < second entity start
    
    response = requests.post(
        f"{base_url}/api/dynamic_step",
        json={"session_id": session_id, "action": action}
    )
    
    if response.status_code == 200:
        step_data = response.json()
        print(f"✅ Step completed")
        print(f"   Progress: {step_data.get('progress', {}).get('progress_percent', 0):.1f}%")
        print(f"   Current pair: {step_data.get('current_pair', {}).get('pair_number', 'N/A')}")
        print(f"   Is complete: {step_data.get('is_complete', False)}")
    else:
        print(f"❌ Step failed: {response.text}")
    
    # 3. Skip current pair
    print("\n3. Skipping current pair...")
    response = requests.post(
        f"{base_url}/api/dynamic_skip",
        json={"session_id": session_id}
    )
    
    if response.status_code == 200:
        skip_data = response.json()
        print(f"✅ Pair skipped")
        print(f"   Progress: {skip_data.get('progress', {}).get('progress_percent', 0):.1f}%")
        print(f"   Current pair: {skip_data.get('current_pair', {}).get('pair_number', 'N/A')}")
    else:
        print(f"❌ Skip failed: {response.text}")
    
    # 4. Get session results
    print("\n4. Getting session results...")
    response = requests.post(
        f"{base_url}/api/dynamic_results",
        json={"session_id": session_id}
    )
    
    if response.status_code == 200:
        results = response.json()
        print(f"✅ Results retrieved")
        print(f"   Total relations: {results.get('total_relations', 0)}")
        print(f"   Progress: {results.get('progress', {}).get('progress_percent', 0):.1f}%")
        print(f"   Mode: {results.get('mode', 'N/A')}")
        print(f"   Relations: {len(results.get('relations', []))}")
    else:
        print(f"❌ Failed to get results: {response.text}")
    
    print("\n" + "=" * 50)
    print("🎉 Dynamic Mode API test completed!")


def test_relation_classifier():
    """Test the relation classifier scoring functionality."""
    print("\n🧠 Testing Relation Classifier")
    print("=" * 30)
    
    from src.relation_classifier import RelationClassifier
    
    classifier = RelationClassifier()
    
    text = "The meeting started at 9:00 AM and ended at 10:00 AM."
    pairs = [
        (
            {"text": "meeting", "start": 4, "end": 11},
            {"text": "started", "start": 12, "end": 19}
        ),
        (
            {"text": "started", "start": 12, "end": 19},
            {"text": "9:00 AM", "start": 23, "end": 30}
        ),
        (
            {"text": "9:00 AM", "start": 23, "end": 30},
            {"text": "ended", "start": 35, "end": 40}
        )
    ]
    
    print(f"Text: {text}")
    print(f"Pairs: {len(pairs)}")
    
    # Test scoring
    scores = classifier.score(text, pairs)
    print(f"\n✅ Confidence scores: {[f'{s:.3f}' for s in scores]}")
    
    # Test entity pair ordering
    entities = [
        {"id": "e1", "text": "meeting", "start": 4, "end": 11},
        {"id": "e2", "text": "started", "start": 12, "end": 19},
        {"id": "e3", "text": "9:00 AM", "start": 23, "end": 30},
        {"id": "e4", "text": "ended", "start": 35, "end": 40}
    ]
    
    guided_pairs = classifier.get_entity_pairs_for_dynamic_mode(entities, "guided", text)
    random_pairs = classifier.get_entity_pairs_for_dynamic_mode(entities, "random", text)
    
    print(f"\n✅ Guided pairs: {guided_pairs}")
    print(f"✅ Random pairs: {random_pairs}")


if __name__ == "__main__":
    try:
        # Test relation classifier first
        test_relation_classifier()
        
        # Test API endpoints (requires running Flask app)
        print("\n" + "=" * 70)
        print("Note: Make sure the Flask app is running (python app.py)")
        print("=" * 70)
        
        # Uncomment to test API:
        # test_dynamic_mode_api()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc() 