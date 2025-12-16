export type GameStatus = 'start' | 'playing' | 'game-over' | 'complete'

export class GameState {
  status: GameStatus = 'start'
  score = 0
  coins = 0
  lives = 3

  startRun() {
    this.status = 'playing'
    this.score = 0
    this.coins = 0
    this.lives = 3
  }

  addCoin() {
    this.coins += 1
    this.score += 100
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
    this.score += 500
  }
}
