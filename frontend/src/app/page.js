'use client'

import { useState, useEffect } from 'react'
import GameBoard from '../components/GameBoard'
import TextDisplay from '../components/TextDisplay'
import GameOver from '../components/GameOver'
import './globals.css'

export default function Home() {
  const [gameData, setGameData] = useState(null)
  const [gameId, setGameId] = useState(null)
  const [gameOver, setGameOver] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    startNewGame()
  }, [])

  const startNewGame = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/new_game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to start a new game')
      }

      const data = await response.json()
      setGameData(data)
      setGameId(data.game_id)
      setGameOver(false)
    } catch (err) {
      console.error('Error starting a new game:', err)
      setError('Error starting a new game. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleMove = async (source, target, relation) => {
    if (!gameId) return

    try {
      setLoading(true)
      const response = await fetch('/api/step', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          game_id: gameId,
          source,
          target,
          relation
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to make a move')
      }

      const data = await response.json()
      setGameData(data)

      if (data.terminated) {
        setGameOver(true)
      }
    } catch (err) {
      console.error('Error making a move:', err)
      setError(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !gameData) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Loading Game...</h2>
          <p>Please wait while we set up your temporal adventure</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">{error}</div>
        <button onClick={() => {
          setError(null)
          startNewGame()
        }}>
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="container">
      <h1>Temporal Game</h1>

      <div className="game-status">
        <div className="reward-box">
          <h3>Reward: {gameData?.reward || 0}</h3>
        </div>
        <button onClick={startNewGame}>New Game</button>
      </div>

      {gameOver && (
        <GameOver
          score={gameData?.reward || 0}
          onRestart={startNewGame}
        />
      )}

      <div className="game-container">
        <TextDisplay
          text={gameData?.text || ""}
          entities={gameData?.entities || []}
        />

        <GameBoard
          candidates={gameData?.candidates || []}
          timeline={gameData?.timeline || []}
          entities={gameData?.entities || []}
          onMakeMove={handleMove}
        />
      </div>
    </div>
  )
}
