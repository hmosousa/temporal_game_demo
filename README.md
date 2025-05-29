# Temporal Game Web Demo

This is a web-based demo for the TemporalGame, allowing users to interact with the game through a visual interface.

## Features

- Interactive text display with highlighted temporal entities
- Lower triangular grid showing temporal relations between entity endpoints
- Four relation types to choose from: Before (<), After (>), Equal (=), Unknown (-)
- Reward tracking and game over screen

## Setup

1. Create a virtual environment
```sh
conda create -p ./.conda python=3.11
conda activate ./.conda
```

2. Install the required dependencies installed:
```sh
poetry install
```

3. Set up your environment variables. Create a `.env` file in the root directory with:
```
HF_USERNAME=your_huggingface_username
HF_TOKEN=your_huggingface_token
```

4. Run the Flask application:
```
cd demo
python app.py
```

5. Open your browser and go to `http://localhost:5000`

## How to Play

1. The main screen displays a text with temporal entities and a grid.
2. The grid represents the possible relations between the start and end points of each entity.
3. Click on a cell in the grid to select it.
4. Choose one of the four relation types: Before (<), After (>), Equal (=), or Unknown (-).
5. The game will update based on your selection and show your current reward.
6. Continue until the game ends or start a new game at any time.

## Game Rules

- The goal is to correctly annotate temporal relations between entity endpoints.
- You get rewards for valid annotations based on the rules in the TemporalGame class.
- The game ends if you make an invalid annotation (create a contradiction in the timeline).

## Technical Details

- Backend: Flask
- Frontend: HTML, CSS, JavaScript
- Game logic: Uses the TemporalGame class from the source code
