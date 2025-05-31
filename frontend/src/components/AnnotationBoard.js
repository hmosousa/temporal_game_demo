'use client'

import { useState, useCallback, useEffect } from 'react'
import GameBoard from './GameBoard'

const AnnotationBoard = ({ 
  text, 
  entities, 
  dct, 
  onRelationsChange 
}) => {
  const [sessionId, setSessionId] = useState(null)
  const [boardData, setBoardData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasIncoherence, setHasIncoherence] = useState(false)
  const [nAnnotated, setNAnnotated] = useState(0)
  const [nRelations, setNRelations] = useState(0)

  // Initialize annotation session when entities change
  useEffect(() => {
    if (entities && entities.length >= 2) {
      initializeAnnotationSession()
    }
  }, [entities, text, dct])

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
      
      // Create export data
      const exportData = {
        text: data.text,
        entities: data.entities,
        dct: data.dct,
        relations: data.relations,
        total_relations: data.total_relations,
        annotated_at: new Date().toISOString()
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
        board={boardData.board}
        endpoints={boardData.endpoints}
        onMakeMove={handleMove}
        onUndo={handleUndo}
        disabled={loading}
        hasTemporalIncoherence={hasIncoherence}
      />
    </div>
  )
}

export default AnnotationBoard 