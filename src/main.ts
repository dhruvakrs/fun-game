import './style.css'
import { Camera } from './engine/camera'
import { intersects } from './engine/collision'
import { GameLoop } from './engine/gameLoop'
import { Input } from './engine/input'
import { GameState } from './game/gameState'
import { Level } from './game/level'
import { Player } from './game/player'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('Missing app container')
}

const canvas = document.createElement('canvas')
canvas.width = 960
canvas.height = 540
canvas.className = 'game-canvas'
app.appendChild(canvas)

const overlay = document.createElement('div')
overlay.className = 'overlay'
overlay.innerText = 'Move with Arrow Keys or A/D, jump with Space'
app.appendChild(overlay)

const ctx = canvas.getContext('2d')

if (!ctx) {
  throw new Error('Canvas not supported')
}

const input = new Input()
const level = new Level()
const player = new Player(level.spawnPoint)
const camera = new Camera(canvas.width, level.width)
const state = new GameState()

const loop = new GameLoop({
  update: (delta) => {
    if (state.status !== 'playing') return

    player.update(delta, input, level.solids)

    if (player.body.y > level.height + 200) {
      handleHazard()
    }

    const spike = level.hazards.some((hazard) => intersects(player.body, hazard))
    if (spike) {
      handleHazard()
    }

    level.coins.forEach((coin) => {
      if (coin.collected) return
      if (intersects(player.body, coin)) {
        coin.collected = true
        state.addCoin()
      }
    })

    if (level.goal && intersects(player.body, level.goal)) {
      state.completeLevel()
    }

    camera.follow(player.body.x + player.body.width / 2, delta)
  },
  render: () => {
    ctx.fillStyle = '#0a0e1f'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.save()
    ctx.translate(-camera.x, 0)

    ctx.fillStyle = '#0f162d'
    ctx.fillRect(0, 0, level.width, level.height)

    level.draw(ctx)
    player.draw(ctx)

    ctx.restore()

    ctx.fillStyle = '#9fb7ff'
    ctx.font = '16px "Segoe UI", sans-serif'
    ctx.fillText('Platformer core movement active', 16, 24)

    overlay.innerText = `Score: ${state.score} | Coins: ${state.coins} | Lives: ${state.lives}`
  },
})

loop.start()

function handleHazard() {
  state.hitHazard()
  player.reset()
}
