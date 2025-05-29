'use client'

import styles from './GameOver.module.css'
import ComparisonBoard from './ComparisonBoard'

export default function GameOver({ score, onRestart, userBoard, trueBoard, endpoints }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <h2>Game Over</h2>
        <p>Final score: {score}</p>
        
        {userBoard && trueBoard && endpoints && (
          <div className={styles.comparisonContainer}>
            <h3>Timeline Comparison</h3>
            <div className={styles.legend}>
              <div className={styles.legendItem}>
                <span className={styles.centerSymbol}>&lt;</span>
                <span>Prediction</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.bottomRightSymbol}>&lt;</span>
                <span>Annotated</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.mismatchBox}></span>
                <span>Mismatch</span>
              </div>
            </div>
            <div className={styles.boardWrapper}>
              <ComparisonBoard
                userBoard={userBoard}
                trueBoard={trueBoard}
                endpoints={endpoints}
              />
            </div>
          </div>
        )}
        
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
