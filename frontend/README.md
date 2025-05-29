# Temporal Game Frontend

This is a Next.js frontend for the TemporalGame web demo. It provides a modern, responsive user interface for interacting with the Temporal Game.

## Features

- Modern React-based UI built with Next.js
- Interactive text display with highlighted temporal entities
- Lower triangular grid for temporal relation annotation
- Real-time updates and game state tracking

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- The Flask backend server running on port 5000

### Installation

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Play

1. The main screen displays a text with temporal entities and a grid.
2. The grid represents the possible relations between the start and end points of each entity.
3. Click on a cell in the grid to select it.
4. Choose one of the four relation types: Before (<), After (>), Equal (=), or Unknown (-).
5. The game will update based on your selection and show your current reward.
6. Continue until the game ends or start a new game at any time.

## Build for Production

To build the application for production:

```bash
npm run build
npm run start
```

## Notes

- The frontend communicates with the Flask backend API running on port 5000.
- Make sure the backend is running before starting the frontend.
