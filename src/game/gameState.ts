export type GameStatus = 'start' | 'playing' | 'game-over' | 'complete'

export class GameState {
  status: GameStatus = 'start'
  score = 0
  coins = 0
  lives: number[] = [GameConfig.startingLives, GameConfig.startingLives]
  level = 1

  startRun(levelIndex = 0, playerCount = 1) {
    this.status = 'playing'
    this.score = 0
    this.coins = 0
    this.lives = Array.from({ length: playerCount }, () => GameConfig.startingLives)
    this.level = levelIndex + 1
  }

  continueRun(levelIndex: number, playerCount: number) {
    this.status = 'playing'
    this.level = levelIndex + 1
    if (this.lives.length < playerCount) {
      this.lives = Array.from({ length: playerCount }, () => GameConfig.startingLives)
    }
  }

  addCoin() {
    this.coins += 1
    this.score += GameConfig.coinValue
  }

  hitHazard() {
    if (this.status !== 'playing') return
  }

  loseLife(playerIndex: number) {
    if (this.status !== 'playing') return
    if (this.lives[playerIndex] > 0) {
      this.lives[playerIndex] -= 1
    }
    if (this.lives.every((life) => life <= 0)) {
      this.status = 'game-over'
    }
  }

  completeLevel() {
    if (this.status !== 'playing') return
    this.status = 'complete'
    this.score += GameConfig.goalBonus
  }

  livesLeft(playerIndex: number) {
    return this.lives[playerIndex] ?? 0
  }
}
import { GameConfig } from './config'
