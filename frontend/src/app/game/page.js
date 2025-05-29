'use client'

import { useState, useEffect } from 'react'
import GameBoard from '../../components/GameBoard'
import TextDisplay from '../../components/TextDisplay'
import GameOver from '../../components/GameOver'
import Footer from '../../components/Footer'
import Link from 'next/link'

export default function Game() {
  const [gameData, setGameData] = useState(null)
  const [gameId, setGameId] = useState(null)
  const [gameOver, setGameOver] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedLevel, setSelectedLevel] = useState(2)

  useEffect(() => {
    startNewGame()
  }, [])

  const startNewGame = async (levelOverride = null) => {
    try {
      setLoading(true)
      
      // Ensure levelOverride is a valid number or null
      const validLevelOverride = (typeof levelOverride === 'number') ? levelOverride : null
      const levelToUse = validLevelOverride !== null ? validLevelOverride : selectedLevel
      
      // Ensure levelToUse is a valid number
      if (typeof levelToUse !== 'number' || levelToUse < 2 || levelToUse > 5) {
        throw new Error(`Invalid level: ${levelToUse}`)
      }
      
      const response = await fetch('/api/new_game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          level: levelToUse
        })
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

  const handleMove = async (position, relation) => {
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
          action: [position, relation]
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

  const handleLevelChange = (newLevel) => {
    // Ensure newLevel is a valid number
    if (typeof newLevel !== 'number' || newLevel < 2 || newLevel > 5) {
      console.error('Invalid level:', newLevel)
      return
    }
    
    setSelectedLevel(newLevel)
    // Auto-start new game with new level, passing it directly to avoid race condition
    setTimeout(() => startNewGame(newLevel), 100)
  }

  if (loading && !gameData) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-dark mb-4">Loading Game...</h2>
            <p className="text-gray-600">Please wait while we set up your temporal adventure</p>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex-1">
          <div className="max-w-6xl mx-auto p-8">
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
              {error}
            </div>
            <button 
              onClick={() => {
                setError(null)
                startNewGame()
              }}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1">
        <div className="max-w-6xl mx-auto p-8">
          <div className="flex items-center mb-8 gap-4">
            <Link 
              href="/" 
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
            >
              ← Home
            </Link>
            <h1 className="text-3xl font-semibold text-dark text-center flex-1 pb-4 border-b border-gray-200">
              Temporal Game
            </h1>
          </div>

          <div className="flex justify-between items-center mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-6">
              <div className="text-xl font-semibold text-dark">
                Reward: {gameData?.reward || 0}
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">
                  # Entities:
                </label>
                <div className="flex gap-2">
                  {[2, 3, 4, 5].map(level => (
                    <button
                      key={level}
                      onClick={() => handleLevelChange(level)}
                      disabled={loading}
                      className={`btn-primary text-sm py-2 px-4 ${
                        selectedLevel === level
                          ? 'bg-[#007aa3] shadow-lg -translate-y-0.5'
                          : ''
                      } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button 
              onClick={() => startNewGame()}
              className="btn-primary"
              disabled={loading}
            >
              New Game
            </button>
          </div>

          {gameOver && (
            <GameOver
              score={gameData?.reward || 0}
              onRestart={startNewGame}
            />
          )}

          <div className="flex flex-col gap-6">
            <TextDisplay
              text={gameData?.text || ""}
              contextWithTags={gameData?.text || ""}
            />

            <GameBoard
              board={gameData?.board || []}
              endpoints={gameData?.endpoints || []}
              onMakeMove={handleMove}
            />
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
} 