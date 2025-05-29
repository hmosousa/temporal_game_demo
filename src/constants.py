import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

HF_USERNAME = os.getenv("HF_USERNAME")
HF_TOKEN = os.getenv("HF_TOKEN")

ROOT_DIR = Path(__file__).parent.parent
RESULTS_DIR = ROOT_DIR / "results"
ASSETS_DIR = ROOT_DIR / "assets"
IMGS_DIR = ROOT_DIR / "imgs"
IMGS_GAME_DIR = IMGS_DIR / "game"
MODELS_DIR = ROOT_DIR / "models"
HF_DIR = ROOT_DIR / "data" / "hf"
