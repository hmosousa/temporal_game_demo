'use client'

import styles from './GameOver.module.css'

export default function GameOver({ score, onRestart }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <h2>Game Over</h2>
        <p>Your final score: {score}</p>
        <button
          className={styles.restartBtn}
          onClick={onRestart}
        >
          Start New Game
        </button>
      </div>
    </div>
  )
}
