# Temporal Game Demo

This is a demo of the Temporal Game, a game that teaches temporal relations.

## Running the server

```bash
pip install -r requirements.txt
gunicorn -b 0.0.0.0:5000 app:app
```
