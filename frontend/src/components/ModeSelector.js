'use client'

import { useState } from 'react'
import styles from './ModeSelector.module.css'

const ModeSelector = ({ currentMode, onModeChange, disabled = false }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const modes = [
    {
      id: 'standard',
      title: 'Standard Annotation',
      description: 'Annotate all entity pairs at once using the full temporal board',
      icon: '🎯',
      features: [
        'See all entities simultaneously',
        'Full temporal board view', 
        'Traditional annotation interface'
      ]
    },
    {
      id: 'dynamic-guided',
      title: 'Dynamic Mode (Guided)',
      description: 'Annotate pairs one at a time, ordered by model confidence',
      icon: '🎯',
      features: [
        'AI-guided pair selection',
        'Confidence-based ordering',
        'Focus on two entities at a time',
        'Reduced cognitive load'
      ]
    },
    {
      id: 'dynamic-random',
      title: 'Dynamic Mode (Random)',
      description: 'Annotate pairs one at a time in random order',
      icon: '🎲',
      features: [
        'Random pair selection',
        'Focus on two entities at a time',
        'Unbiased annotation order',
        'Reduced cognitive load'
      ]
    }
  ]

  const handleModeSelect = (modeId) => {
    if (disabled) return
    onModeChange(modeId)
    setIsExpanded(false)
  }

  const currentModeData = modes.find(mode => mode.id === currentMode) || modes[0]

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Annotation Mode</h3>
        <button 
          className={styles.expandButton}
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={disabled}
          aria-label={isExpanded ? 'Collapse mode options' : 'Expand mode options'}
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      <div className={`${styles.currentMode} ${disabled ? styles.disabled : ''}`}>
        <div className={styles.modeIcon}>{currentModeData.icon}</div>
        <div className={styles.modeInfo}>
          <h4>{currentModeData.title}</h4>
          <p>{currentModeData.description}</p>
        </div>
      </div>

      {isExpanded && (
        <div className={styles.modeList}>
          {modes.map(mode => (
            <div 
              key={mode.id}
              className={`${styles.modeOption} ${
                mode.id === currentMode ? styles.selected : ''
              } ${disabled ? styles.disabled : ''}`}
              onClick={() => handleModeSelect(mode.id)}
            >
              <div className={styles.modeHeader}>
                <span className={styles.modeIcon}>{mode.icon}</span>
                <h4>{mode.title}</h4>
                {mode.id === currentMode && (
                  <span className={styles.selectedIndicator}>✓</span>
                )}
              </div>
              <p className={styles.modeDescription}>{mode.description}</p>
              <ul className={styles.featureList}>
                {mode.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {disabled && (
        <div className={styles.disabledMessage}>
          Mode selection is disabled during active annotation session
        </div>
      )}
    </div>
  )
}

export default ModeSelector 