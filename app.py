import copy
import logging
import os
import random
import uuid

from flask import Flask, jsonify, request, session

from src.env import TemporalGame, load_documents

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
# Dictionary to store annotation sessions
annotation_sessions = {}


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
    docs = load_documents(level)
    doc_id = random.randint(0, len(docs) - 1)
    doc = copy.deepcopy(docs[doc_id])
    game = TemporalGame(doc)
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
            "entities": obs["entities"],
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

        data = {
            "text": obs["context"],
            "board": obs["board"],
            "endpoints": obs["endpoints"],
            "entities": obs["entities"],
            "reward": game_data["reward"],
            "terminated": terminated,
            "is_success": info["is_success"],
        }

        if terminated:
            data["true_board"] = info["true_board"]
        return jsonify(data)

    except Exception as e:
        logger.error(f"Game {game_id}: Error during step: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 400


@app.route("/api/undo", methods=["POST"])
def undo():
    data = request.json
    game_id = data.get("game_id", session.get("game_id"))

    if not game_id or game_id not in games:
        logger.error(f"Invalid game ID: {game_id}")
        return jsonify({"error": "Invalid game ID"}), 400

    game_data = games[game_id]
    game_env = game_data["game"]

    try:
        obs, info, success = game_env.undo()

        if not success:
            logger.warning(f"Game {game_id}: No actions to undo")
            return jsonify({"error": "No actions to undo"}), 400

        # Update game data
        game_data["obs"] = obs
        game_data["info"] = info
        # Note: We don't update reward on undo as the user might want to see cumulative score

        logger.info(f"Game {game_id}: Undo successful")

        response_data = {
            "text": obs["context"],
            "board": obs["board"],
            "endpoints": obs["endpoints"],
            "entities": obs["entities"],
            "reward": game_data["reward"],  # Keep current total reward
            "terminated": info["terminal_observation"],
            "is_success": info["is_success"],
            "undo_success": True,
        }

        return jsonify(response_data)

    except Exception as e:
        logger.error(f"Game {game_id}: Error during undo: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 400


@app.route("/api/new_annotation_session", methods=["POST"])
def new_annotation_session():
    logger.info("Creating new annotation session")

    data = request.get_json() or {}
    text = data.get("text")
    entities = data.get("entities", [])
    dct = data.get("dct")

    if not text:
        logger.error("Missing text for annotation session")
        return jsonify({"error": "Text is required for annotation session"}), 400

    if len(entities) < 2:
        logger.error("Need at least 2 entities for annotation")
        return jsonify({"error": "At least 2 entities required for annotation"}), 400

    logger.info(f"Creating annotation session with {len(entities)} entities")

    session_id = str(uuid.uuid4())

    try:
        # Create a mock document structure that matches what TemporalGame expects
        mock_doc = {
            "text": text,
            "entities": [
                {
                "id": f"e{i}",
                "text": entity.get("text", text[entity["start"] : entity["end"]]),
                "offsets": [entity["start"], entity["end"]],
                "type": entity.get("type", "interval"),
            }
            for i, entity in enumerate(entities)
        ],
            "relations": [], 
        }

        # Create TemporalGame instance directly with our custom document
        game = TemporalGame(mock_doc)
        obs, info = game.reset()

        annotation_sessions[session_id] = {
            "game": game,
            "obs": obs,
            "info": info,
            "text": text,
            "entities": entities,
            "dct": dct,
            "relations": [],  # Track annotated relations
        }

        # Store the session_id in the session
        session["annotation_session_id"] = session_id

        logger.info(f"New annotation session created with ID: {session_id}")

        return jsonify(
            {
                "session_id": session_id,
                "text": text,
                "board": obs["board"],
                "endpoints": obs["endpoints"],
                "entities": obs["entities"],
                "has_incoherence": False,
                "n_annotated": 0,
                "n_relations": game.n_relations,
            }
        )

    except Exception as e:
        logger.error(f"Error creating annotation session: {str(e)}", exc_info=True)
        return jsonify({"error": f"Failed to create annotation session: {str(e)}"}), 500


@app.route("/api/annotation_step", methods=["POST"])
def annotation_step():
    data = request.json
    session_id = data.get("session_id", session.get("annotation_session_id"))

    if not session_id or session_id not in annotation_sessions:
        logger.error(f"Invalid annotation session ID: {session_id}")
        return jsonify({"error": "Invalid annotation session ID"}), 400

    session_data = annotation_sessions[session_id]
    game = session_data["game"]

    action = data["action"]
    try:
        # For annotation mode, we don't care about termination on errors
        obs, _, _, info = game.step(action)

        # Update session data
        session_data["obs"] = obs
        session_data["info"] = info

        # Track the relation
        position, relation = action
        session_data["relations"].append(
            {
                "position": position,
                "relation": relation,
                "timestamp": len(session_data["relations"]),
            }
        )

        logger.info(f"Annotation session {session_id}: Step completed")

        # Check for temporal incoherence (but don't terminate)
        has_incoherence = not game.pred_timeline.is_valid

        response_data = {
            "board": obs["board"],
            "endpoints": obs["endpoints"],
            "entities": obs["entities"],
            "has_incoherence": has_incoherence,
            "relations_count": len(session_data["relations"]),
            "n_annotated": info["n_annotated"],
            "n_relations": game.n_relations,
        }

        return jsonify(response_data)

    except Exception as e:
        logger.error(
            f"Annotation session {session_id}: Error during step: {str(e)}",
            exc_info=True,
        )
        return jsonify({"error": str(e)}), 400


@app.route("/api/annotation_undo", methods=["POST"])
def annotation_undo():
    data = request.json
    session_id = data.get("session_id", session.get("annotation_session_id"))

    if not session_id or session_id not in annotation_sessions:
        logger.error(f"Invalid annotation session ID: {session_id}")
        return jsonify({"error": "Invalid annotation session ID"}), 400

    session_data = annotation_sessions[session_id]
    game = session_data["game"]

    try:
        obs, info, success = game.undo()

        if not success:
            logger.warning(f"Annotation session {session_id}: No actions to undo")
            return jsonify({"error": "No actions to undo"}), 400

        # Update session data
        session_data["obs"] = obs
        session_data["info"] = info

        # Remove the last relation
        if session_data["relations"]:
            session_data["relations"].pop()

        logger.info(f"Annotation session {session_id}: Undo successful")

        has_incoherence = not game.pred_timeline.is_valid

        response_data = {
            "board": obs["board"],
            "endpoints": obs["endpoints"],
            "entities": obs["entities"],
            "has_incoherence": has_incoherence,
            "relations_count": len(session_data["relations"]),
            "n_annotated": info["n_annotated"],
            "undo_success": True,
        }

        return jsonify(response_data)

    except Exception as e:
        logger.error(
            f"Annotation session {session_id}: Error during undo: {str(e)}",
            exc_info=True,
        )
        return jsonify({"error": str(e)}), 400


@app.route("/api/get_annotation_results", methods=["POST"])
def get_annotation_results():
    data = request.json
    session_id = data.get("session_id", session.get("annotation_session_id"))

    if not session_id or session_id not in annotation_sessions:
        logger.error(f"Invalid annotation session ID: {session_id}")
        return jsonify({"error": "Invalid annotation session ID"}), 400

    session_data = annotation_sessions[session_id]

    return jsonify(
        {
            "text": session_data["text"],
            "entities": session_data["entities"],
            "dct": session_data["dct"],
            "relations": session_data["relations"],
            "board": session_data["obs"]["board"],
            "endpoints": session_data["obs"]["endpoints"],
            "total_relations": len(session_data["relations"]),
        }
    )


if __name__ == "__main__":
    logger.info("Starting Temporal Game server")
    app.run(debug=True)
