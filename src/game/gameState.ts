export type GameStatus = 'start' | 'playing' | 'game-over' | 'complete'

export class GameState {
  status: GameStatus = 'start'
  score = 0
  coins = 0
  lives = GameConfig.startingLives
  level = 1

  startRun(levelIndex = 0) {
    this.status = 'playing'
    this.score = 0
    this.coins = 0
    this.lives = GameConfig.startingLives
    this.level = levelIndex + 1
  }

  continueRun(levelIndex: number) {
    this.status = 'playing'
    this.level = levelIndex + 1
  }

  addCoin() {
    this.coins += 1
    this.score += GameConfig.coinValue
  }

  hitHazard() {
    if (this.status !== 'playing') return
    if (this.lives > 0) {
      this.lives -= 1
    }
    if (this.lives <= 0) {
      this.status = 'game-over'
    }
  }

  completeLevel() {
    if (this.status !== 'playing') return
    this.status = 'complete'
    this.score += GameConfig.goalBonus
  }
}
import { GameConfig } from './config'
