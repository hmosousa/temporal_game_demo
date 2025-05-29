import json
import json.scanner
import logging
import os
import uuid

from flask import Flask, jsonify, request, session

from src.base import PointRelation
from src.env import TemporalGameEnv

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(), logging.FileHandler("temporal_game.log")],
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "temporal_game_secret")

# Dictionary to store game instances
games = {}


@app.route("/api/new_game", methods=["POST"])
def new_game():
    logger.info("Creating new game")
    
    # Get level from request data, default to 2
    data = request.get_json() or {}
    level = data.get("level", 3)
    
    # Validate level
    if not isinstance(level, int) or level < 2 or level > 5:
        logger.error(f"Invalid level: {level}")
        return jsonify({"error": "Level must be an integer between 2 and 6"}), 400
    
    logger.info(f"Creating game with level: {level}")
    
    game_id = str(uuid.uuid4())
    game = TemporalGameEnv(mode="test", level=level)
    obs, info = game.reset()

    games[game_id] = {"game": game, "obs": obs, "info": info, "reward": 0}

    # Store the game_id in the session
    session["game_id"] = game_id

    logger.info(f"New game created with ID: {game_id}, level: {level}")

    return jsonify(
        {
            "game_id": game_id,
            "text": obs["context"],
            "board": obs["board"],
            "endpoints": obs["endpoints"],
            "reward": 0,
            "terminated": False,
            "is_success": False,
            "level": level,
        }
    )


@app.route("/api/step", methods=["POST"])
def step():
    data = request.json
    game_id = data.get("game_id", session.get("game_id"))

    if not game_id or game_id not in games:
        logger.error(f"Invalid game ID: {game_id}")
        return jsonify({"error": "Invalid game ID"}), 400

    game_data = games[game_id]
    game = game_data["game"]

    action = data["action"]
    try:
        obs, reward, terminated, info = game.step(action)

        # Update game data
        game_data["obs"] = obs
        game_data["info"] = info
        game_data["reward"] += reward

        logger.info(
            f"Game {game_id}: Step completed with reward={reward}, total reward={game_data['reward']}"
        )

        return jsonify(
            {
                "text": obs["context"],
                "board": obs["board"],
                "endpoints": obs["endpoints"],
                "reward": game_data["reward"],
                "terminated": terminated,
                "is_success": info["is_success"],
            }
        )
    except Exception as e:
        logger.error(f"Game {game_id}: Error during step: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    logger.info("Starting Temporal Game server")
    app.run(debug=True)
