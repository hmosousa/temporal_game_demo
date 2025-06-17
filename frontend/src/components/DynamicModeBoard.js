'use client'

import { useState, useCallback, useEffect } from 'react'
import GameBoard from './GameBoard'
import styles from './DynamicModeBoard.module.css'

const DynamicModeBoard = ({ 
  text, 
  entities, 
  dct, 
  mode = 'guided', // 'guided' or 'random'
  onRelationsChange,
  onComplete 
}) => {
  const [sessionId, setSessionId] = useState(null)
  const [boardData, setBoardData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasIncoherence, setHasIncoherence] = useState(false)
  const [currentPair, setCurrentPair] = useState(null)
  const [progress, setProgress] = useState({
    total_pairs: 0,
    completed_pairs: 0,
    current_pair: 0,
    progress_percent: 0,
    remaining_pairs: 0,
    is_complete: false
  })
  const [isComplete, setIsComplete] = useState(false)

  // Initialize dynamic session when entities change
  useEffect(() => {
    if (entities && entities.length >= 2) {
      initializeDynamicSession()
    }
  }, [entities, text, dct, mode])

  const initializeDynamicSession = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/new_dynamic_session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          entities: entities,
          dct: dct,
          mode: mode
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create dynamic session')
      }

      const data = await response.json()
      setSessionId(data.session_id)
      
      if (data.board && data.endpoints && data.entities) {
        setBoardData({
          board: data.board,
          endpoints: data.endpoints,
          entities: data.entities
        })
      }
      
      setCurrentPair(data.current_pair)
      setProgress(data.progress || {})
      setHasIncoherence(data.has_incoherence || false)
      setIsComplete(data.progress?.is_complete || false)

    } catch (err) {
      console.error('Error initializing dynamic session:', err)
      setError(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleMove = async (position, relation) => {
    if (!sessionId) return

    try {
      setLoading(true)
      const response = await fetch('/api/dynamic_step', {
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
      
      if (data.board && data.endpoints && data.entities) {
        setBoardData({
          board: data.board,
          endpoints: data.endpoints,
          entities: data.entities
        })
      }
      
      setCurrentPair(data.current_pair)
      setProgress(data.progress || {})
      setHasIncoherence(data.has_incoherence || false)
      setIsComplete(data.is_complete || false)

      // Notify parent of relations change
      if (onRelationsChange) {
        onRelationsChange(data.progress?.completed_pairs || 0)
      }

      // Notify completion
      if (data.is_complete && onComplete) {
        onComplete()
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
      const response = await fetch('/api/dynamic_undo', {
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
      
      if (data.board && data.endpoints && data.entities) {
        setBoardData({
          board: data.board,
          endpoints: data.endpoints,
          entities: data.entities
        })
      }
      
      setCurrentPair(data.current_pair)
      setProgress(data.progress || {})
      setHasIncoherence(data.has_incoherence || false)
      setIsComplete(false) // Reset completion status on undo

      // Notify parent of relations change
      if (onRelationsChange) {
        onRelationsChange(data.progress?.completed_pairs || 0)
      }

    } catch (err) {
      console.error('Error during undo:', err)
      setError(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = async () => {
    if (!sessionId) return

    try {
      setLoading(true)
      const response = await fetch('/api/dynamic_skip', {
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
        throw new Error(errorData.error || 'Failed to skip pair')
      }

      const data = await response.json()
      
      if (data.board && data.endpoints && data.entities) {
        setBoardData({
          board: data.board,
          endpoints: data.endpoints,
          entities: data.entities
        })
      }
      
      setCurrentPair(data.current_pair)
      setProgress(data.progress || {})
      setHasIncoherence(data.has_incoherence || false)
      setIsComplete(data.is_complete || false)

      // Notify parent of relations change
      if (onRelationsChange) {
        onRelationsChange(data.progress?.completed_pairs || 0)
      }

      // Notify completion
      if (data.is_complete && onComplete) {
        onComplete()
      }

    } catch (err) {
      console.error('Error skipping pair:', err)
      setError(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const exportAnnotations = async () => {
    if (!sessionId) return

    try {
      const response = await fetch('/api/dynamic_results', {
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
        throw new Error(errorData.error || 'Failed to get dynamic results')
      }

      const data = await response.json()
      
      // Create export data
      const exportData = {
        text: data.text,
        entities: data.entities,
        dct: data.dct,
        mode: data.mode,
        relations: data.relations,
        progress: data.progress,
        total_relations: data.total_relations,
        annotated_at: new Date().toISOString()
      }

      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `temporal_relations_dynamic_${mode}_${new Date().toISOString().split('T')[0]}.json`
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
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Initializing dynamic annotation session...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={initializeDynamicSession} className={styles.retryButton}>
          Retry
        </button>
      </div>
    )
  }

  if (!entities || entities.length < 2) {
    return (
      <div className={styles.messageContainer}>
        <p>Please add at least 2 entities to start dynamic annotation.</p>
      </div>
    )
  }

  if (isComplete) {
    return (
      <div className={styles.completedContainer}>
        <h3>🎉 Dynamic Annotation Complete!</h3>
        <p>You have successfully annotated all entity pairs using {mode} mode.</p>
        <div className={styles.statsContainer}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Total Pairs:</span>
            <span className={styles.statValue}>{progress.total_pairs}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Completed:</span>
            <span className={styles.statValue}>{progress.completed_pairs}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Progress:</span>
            <span className={styles.statValue}>{Math.round(progress.progress_percent)}%</span>
          </div>
        </div>
        <div className={styles.actionButtons}>
          <button onClick={exportAnnotations} className={styles.exportButton}>
            Export Results
          </button>
          <button onClick={initializeDynamicSession} className={styles.restartButton}>
            Start Over
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Progress Header */}
      <div className={styles.progressHeader}>
        <h2>Dynamic Mode Annotation ({mode})</h2>
        
        {currentPair && (
          <div className={styles.currentPairInfo}>
            <h3>Current Pair ({progress.current_pair} of {progress.total_pairs})</h3>
            <div className={styles.entityPair}>
              <span className={styles.entityLabel}>Entity 1:</span>
              <span className={styles.entityText}>{currentPair.entity1?.text}</span>
              <span className={styles.entityLabel}>Entity 2:</span>
              <span className={styles.entityText}>{currentPair.entity2?.text}</span>
            </div>
          </div>
        )}
        
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${progress.progress_percent}%` }}
          />
          <span className={styles.progressText}>
            {Math.round(progress.progress_percent)}% Complete
          </span>
        </div>
        
        <div className={styles.progressStats}>
          <span>Completed: {progress.completed_pairs}</span>
          <span>Remaining: {progress.remaining_pairs}</span>
        </div>
      </div>

      {/* Incoherence Warning */}
      {hasIncoherence && (
        <div className={styles.warningContainer}>
          <span className={styles.warningIcon}>⚠️</span>
          <span>Temporal incoherence detected. Please review your annotations.</span>
        </div>
      )}

      {/* Game Board */}
      {boardData && (
        <GameBoard
          board={boardData.board}
          endpoints={boardData.endpoints}
          onMakeMove={handleMove}
          onUndo={handleUndo}
          disabled={loading}
          hasTemporalIncoherence={hasIncoherence}
        />
      )}

      {/* Controls */}
      <div className={styles.controls}>
        <button 
          onClick={handleSkip} 
          disabled={loading}
          className={styles.skipButton}
          title="Skip this entity pair"
        >
          Skip Pair
        </button>
        <button 
          onClick={exportAnnotations} 
          disabled={loading}
          className={styles.exportButton}
        >
          Export Progress
        </button>
      </div>
    </div>
  )
}

export default DynamicModeBoard 