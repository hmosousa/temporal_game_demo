'use client'

import { useState, useCallback, useEffect } from 'react'
import GameBoard from './GameBoard'

const AnnotationBoard = ({ 
  text, 
  entities, 
  dct, 
  onRelationsChange,
  mode = 'D', // 'D' for Default, 'R' for Random, 'G' for Guided
  onExport
}) => {
  const [sessionId, setSessionId] = useState(null)
  const [boardData, setBoardData] = useState(null)
  const [randomScores, setRandomScores] = useState(null)
  const [guidedScores, setGuidedScores] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasIncoherence, setHasIncoherence] = useState(false)
  const [nAnnotated, setNAnnotated] = useState(0)
  const [nRelations, setNRelations] = useState(0)
  const [currentHighestPair, setCurrentHighestPair] = useState(null)

  // Initialize annotation session when entities change
  useEffect(() => {
    if (entities && entities.length >= 2) {
      initializeAnnotationSession()
    }
  }, [entities, text, dct])

  // Expose export function to parent component
  useEffect(() => {
    window.exportAnnotationsRef = exportAnnotations
    return () => {
      window.exportAnnotationsRef = null
    }
  }, [sessionId])

  const initializeAnnotationSession = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/new_annotation_session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          entities: entities,
          dct: dct
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create annotation session')
      }

      const data = await response.json()
      setSessionId(data.session_id)
      setBoardData({
        board: data.board,
        endpoints: data.endpoints,
        entities: data.entities
      })
      setRandomScores(data.random_scores)
      setGuidedScores(data.guided_scores)
      setHasIncoherence(data.has_incoherence || false)
      setNAnnotated(0)
      setNRelations(data.n_relations || 0)

    } catch (err) {
      console.error('Error initializing annotation session:', err)
      setError(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleMove = async (position, relation) => {
    if (!sessionId) return

    try {
      setLoading(true)
      const response = await fetch('/api/annotation_step', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: sessionId,
          action: [position, relation]
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to make annotation')
      }

      const data = await response.json()
      setBoardData({
        board: data.board,
        endpoints: data.endpoints,
        entities: data.entities
      })
      setRandomScores(data.random_scores)
      setGuidedScores(data.guided_scores)
      setHasIncoherence(data.has_incoherence || false)
      setNAnnotated(data.n_annotated || 0)
      setNRelations(data.n_relations || 0)

      // Notify parent of relations change
      if (onRelationsChange) {
        onRelationsChange(data.n_annotated || 0)
      }

    } catch (err) {
      console.error('Error making annotation:', err)
      setError(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUndo = async () => {
    if (!sessionId) return

    try {
      setLoading(true)
      const response = await fetch('/api/annotation_undo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: sessionId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'No actions to undo')
      }

      const data = await response.json()
      setBoardData({
        board: data.board,
        endpoints: data.endpoints,
        entities: data.entities
      })
      setRandomScores(data.random_scores)
      setGuidedScores(data.guided_scores)
      setHasIncoherence(data.has_incoherence || false)
      setNAnnotated(data.n_annotated || 0)
      setNRelations(data.n_relations || 0)

      // Notify parent of relations change
      if (onRelationsChange) {
        onRelationsChange(data.n_annotated || 0)
      }

    } catch (err) {
      console.error('Error during undo:', err)
      setError(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const exportAnnotations = async () => {
    if (!sessionId) return

    try {
      const response = await fetch('/api/get_annotation_results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: sessionId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get annotation results')
      }

      const data = await response.json()
      
      // Transform relations to cleaner format
      const cleanRelations = data.relations.map(relation => ({
        source: boardData.endpoints[relation.position[0]],
        target: boardData.endpoints[relation.position[1]],
        relation: relation.relation,
      }))
      
      // Create export data with improved clarity
      const exportData = {
        text: text, // Use the processed text that includes DCT
        entities: entities, // Use the current entities which include IDs and DCT
        dct: dct,
        relations: cleanRelations
      }

      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `temporal_relations_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

    } catch (err) {
      console.error('Error exporting annotations:', err)
      setError(`Error: ${err.message}`)
    }
  }

  // Find the highest-scoring unannotated pair for random or guided mode
  const getHighestScoringPair = () => {
    if (!boardData || mode === 'D') return null
    
    const scores = mode === 'R' ? randomScores : mode === 'G' ? guidedScores : null
    if (!scores) return null

    const board = boardData.board
    let maxScore = -1
    let bestPair = null

    // Iterate through all possible pairs
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        // Check if this cell is unannotated (value is -1) and not masked (value is -2)
        if (board[i][j] === -1 && scores[i] && scores[i][j] > maxScore) {
          maxScore = scores[i][j]
          bestPair = { row: i, col: j, score: maxScore }
        }
      }
    }

    return bestPair
  }

  // Update current highest pair when board data changes and in random/guided mode
  useEffect(() => {
    if ((mode === 'R' || mode === 'G') && boardData && (mode === 'R' ? randomScores : guidedScores)) {
      const highestPair = getHighestScoringPair()
      setCurrentHighestPair(highestPair)
    } else {
      setCurrentHighestPair(null)
    }
  }, [boardData, randomScores, guidedScores, mode])

  // Create filtered board data for random/guided mode
  const getFilteredBoardData = () => {
    if ((mode !== 'R' && mode !== 'G') || !boardData || !currentHighestPair) {
      return boardData
    }

    // Create a masked version of the board showing only the current highest pair
    const filteredBoard = boardData.board.map((row, rowIdx) =>
      row.map((cell, colIdx) => {
        if (rowIdx === currentHighestPair.row && colIdx === currentHighestPair.col) {
          return cell // Keep the original cell value
        }
        return -2 // Mask all other cells
      })
    )

    return {
      ...boardData,
      board: filteredBoard
    }
  }

  if (loading && !boardData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Initializing Annotation Board</h3>
          <p className="text-gray-600">Preparing temporal relation grid...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded">
          {error}
        </div>
        <button 
          onClick={initializeAnnotationSession}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!boardData || !entities || entities.length < 2) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
        <div className="text-center">
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Ready for Annotation</h3>
          <p className="text-gray-600">
            You need at least two entities to start annotating temporal relations.<br/>
            Create more entities by selecting text above.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Random Mode Status */}
      {mode === 'R' && currentHighestPair && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-yellow-600 font-medium">🎯 Random Mode:</span>
              <span className="text-sm text-gray-700">
                Showing highest-scoring pair (score: {currentHighestPair.score.toFixed(3)})
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {boardData?.endpoints?.[currentHighestPair.row]} → {boardData?.endpoints?.[currentHighestPair.col]}
            </div>
          </div>
        </div>
      )}

      {/* Random Mode Completion Status */}
      {mode === 'R' && !currentHighestPair && boardData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-medium">✅ Random Mode Complete:</span>
            <span className="text-sm text-gray-700">
              All entity pairs have been annotated! Switch to Default mode to see the full board.
            </span>
          </div>
        </div>
      )}

      {/* Guided Mode Status */}
      {mode === 'G' && currentHighestPair && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-yellow-600 font-medium">🎯 Guided Mode:</span>
              <span className="text-sm text-gray-700">
                Showing highest-scoring pair (score: {currentHighestPair.score.toFixed(3)})
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {boardData?.endpoints?.[currentHighestPair.row]} → {boardData?.endpoints?.[currentHighestPair.col]}
            </div>
          </div>
        </div>
      )}

      {/* Guided Mode Completion Status */}
      {mode === 'G' && !currentHighestPair && boardData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-medium">✅ Guided Mode Complete:</span>
            <span className="text-sm text-gray-700">
              All entity pairs have been annotated! Switch to Default mode to see the full board.
            </span>
          </div>
        </div>
      )}

      {/* Simple Progress Bar */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">Temporal Relations</span>
          <span className="text-xs text-gray-600">{nAnnotated}/{nRelations} annotated</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div 
            className="bg-blue-600 h-1.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min((nAnnotated / Math.max(nRelations, 1)) * 100, 100)}%` }}
          ></div>
        </div>
        {hasIncoherence && (
          <div className="flex items-center gap-1 mt-2">
            <span className="text-amber-500 text-xs">⚠️</span>
            <span className="text-xs text-amber-600">Timeline contradictions detected</span>
          </div>
        )}
      </div>

      {/* Game Board */}
      <GameBoard
        board={getFilteredBoardData()?.board || boardData?.board}
        endpoints={boardData.endpoints}
        onMakeMove={handleMove}
        onUndo={handleUndo}
        disabled={loading}
        hasTemporalIncoherence={hasIncoherence}
        mode={mode}
        currentHighestPair={currentHighestPair}
      />
    </div>
  )
}

export default AnnotationBoard 