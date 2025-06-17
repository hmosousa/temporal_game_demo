# Dynamic Mode Annotation Implementation

This document describes the implementation of dynamic mode annotation for the Temporal Game, as described in the research paper. Dynamic mode presents entity pairs one at a time, reducing cognitive load and enabling guided annotation workflows.

## Overview

Dynamic mode annotation allows users to annotate temporal relations between entity pairs sequentially, showing only 2 entities at a time instead of the full temporal board. This approach offers two selection strategies:

1. **Guided Mode**: Pairs are ordered by confidence scores from a temporal relation classification model (most confident first)
2. **Random Mode**: Pairs are presented in random order for unbiased annotation

## Backend Implementation

### Core Components

#### 1. RelationClassifier (`src/relation_classifier.py`)
- **Enhanced scoring**: Uses the HuggingFace model `hugosousa/smol-135-ac-a4eaad65` for confidence scoring
- **Entity tagging**: Properly formats text with `<source>` and `<target>` tags for the model
- **Pair selection**: Implements guided and random pair ordering strategies
- **Dynamic mode support**: Methods for selecting next entity pairs based on confidence

Key methods:
- `score(text, pairs)`: Gets confidence scores for entity pairs
- `add_tags(text, pairs)`: Formats text with entity tags
- `get_entity_pairs_for_dynamic_mode(entities, mode, text)`: Orders pairs by mode
- `select_next_entity_pair(entities, annotated_pairs, mode, text)`: Selects next pair

#### 2. DynamicModeManager (`src/dynamic_mode.py`)
- **Session management**: Handles dynamic annotation sessions
- **Pair progression**: Manages moving through entity pairs
- **Game integration**: Creates level-2 TemporalGame instances for each pair
- **Progress tracking**: Monitors annotation progress and completion

Key methods:
- `create_dynamic_session(text, entities, dct, mode)`: Initialize session
- `step_dynamic_session(session_data, action)`: Process annotation step
- `skip_current_pair(session_data)`: Skip current pair
- `get_session_progress(session_data)`: Get progress information

#### 3. API Endpoints (`app.py`)
New endpoints for dynamic mode:
- `POST /api/new_dynamic_session`: Create dynamic session
- `POST /api/dynamic_step`: Make annotation step
- `POST /api/dynamic_undo`: Undo last action
- `POST /api/dynamic_skip`: Skip current pair
- `POST /api/dynamic_results`: Get session results

## Frontend Implementation

### Core Components

#### 1. DynamicModeBoard (`frontend/src/components/DynamicModeBoard.js`)
- **Progress display**: Shows current pair, progress bar, and statistics
- **Entity highlighting**: Highlights the two entities being annotated
- **Control buttons**: Skip pair, export progress
- **Completion handling**: Shows completion screen with statistics

#### 2. ModeSelector (`frontend/src/components/ModeSelector.js`)
- **Mode selection**: Toggle between standard, guided, and random modes
- **Feature descriptions**: Explains each mode's benefits
- **Session protection**: Prevents mode changes during active sessions

#### 3. Updated Annotation Page (`frontend/src/app/annotate/page.js`)
- **Mode integration**: Renders appropriate component based on selected mode
- **State management**: Handles mode switching and session state
- **Backward compatibility**: Maintains existing standard annotation functionality

## Usage

### Backend Usage

```python
from src.dynamic_mode import DynamicModeManager

# Create manager
manager = DynamicModeManager()

# Create session
session_data = manager.create_dynamic_session(
    text="The meeting started at 9:00 AM and ended at 10:00 AM.",
    entities=[...],  # List of entity dictionaries
    dct="2023-01-15",  # Optional document creation time
    mode="guided"  # "guided" or "random"
)

# Make annotation step
action = ((0, 1), "<")  # Position and relation
updated_session = manager.step_dynamic_session(session_data, action)

# Check progress
progress = manager.get_session_progress(updated_session)
print(f"Progress: {progress['progress_percent']:.1f}%")
```

### Frontend Usage

The frontend automatically switches between modes based on user selection:

1. **Standard Mode**: Full temporal board with all entities
2. **Dynamic Guided Mode**: AI-ordered pairs, confidence-based
3. **Dynamic Random Mode**: Randomly ordered pairs

Users can switch modes via the ModeSelector component, which shows:
- Current mode information
- Available modes with descriptions
- Feature lists for each mode

## API Examples

### Create Dynamic Session
```bash
curl -X POST http://localhost:5000/api/new_dynamic_session \
  -H "Content-Type: application/json" \
  -d '{
    "text": "The meeting started at 9:00 AM and ended at 10:00 AM.",
    "entities": [
      {"text": "meeting", "start": 4, "end": 11, "type": "interval"},
      {"text": "started", "start": 12, "end": 19, "type": "interval"},
      {"text": "9:00 AM", "start": 23, "end": 30, "type": "interval"}
    ],
    "mode": "guided"
  }'
```

### Make Annotation Step
```bash
curl -X POST http://localhost:5000/api/dynamic_step \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "SESSION_ID",
    "action": [[0, 1], "<"]
  }'
```

### Skip Pair
```bash
curl -X POST http://localhost:5000/api/dynamic_skip \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "SESSION_ID"
  }'
```

## Features

### Backend Features
- ✅ Confidence-based pair ordering (guided mode)
- ✅ Random pair ordering (random mode)
- ✅ Progress tracking and completion detection
- ✅ Pair skipping functionality
- ✅ Undo support within current pair
- ✅ Export functionality with mode information
- ✅ Session management and state persistence

### Frontend Features
- ✅ Mode selection interface with descriptions
- ✅ Progress visualization (progress bar, statistics)
- ✅ Current pair highlighting
- ✅ Skip and export controls
- ✅ Completion screen with statistics
- ✅ Responsive design for mobile devices
- ✅ Session protection (prevents mode changes during annotation)

## Testing

Run the test script to verify functionality:

```bash
python test_dynamic_mode_api.py
```

This tests:
- RelationClassifier scoring and pair ordering
- API endpoint functionality (requires running Flask app)
- Error handling and edge cases

## Research Integration

This implementation directly supports the research described in the paper:

1. **Point-based annotation**: All relations are at the point level (start/end)
2. **Temporal closure**: Automatic inference of additional relations
3. **Reduced cognitive load**: Only 2 entities shown at a time
4. **Confidence-based ordering**: Model-guided annotation sequence
5. **RL foundation**: Framework ready for reinforcement learning agents

The dynamic mode serves as both a practical annotation tool and a research platform for studying human-in-the-loop temporal reasoning and training RL agents for temporal relation extraction.

## Future Work

- Integration with reinforcement learning agents
- Multi-annotator support for agreement studies
- Advanced confidence scoring models
- Batch annotation workflows
- Integration with temporal reasoning evaluation metrics 