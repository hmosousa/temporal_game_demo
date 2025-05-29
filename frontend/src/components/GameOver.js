'use client'

import styles from './GameOver.module.css'
import GameBoard from './GameBoard'

export default function GameOver({ score, onRestart, userBoard, trueBoard, endpoints }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <h2>Game Over</h2>
        <p>Your final score: {score}</p>
        
        {userBoard && trueBoard && endpoints && (
          <div className={styles.boardsContainer}>
            <div className={styles.boardSection}>
              <h3>Your Timeline</h3>
              <div className={styles.boardWrapper}>
                <GameBoard
                  board={userBoard}
                  endpoints={endpoints}
                  onMakeMove={() => {}} // Disabled for game over
                  disabled={true}
                />
              </div>
            </div>
            
            <div className={styles.boardSection}>
              <h3>Annotated Timeline</h3>
              <div className={styles.boardWrapper}>
                <GameBoard
                  board={trueBoard}
                  endpoints={endpoints}
                  onMakeMove={() => {}} // Disabled for game over
                  disabled={true}
                />
              </div>
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
