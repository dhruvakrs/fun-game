import './style.css'
import { Camera } from './engine/camera'
import { GameLoop } from './engine/gameLoop'
import { Input } from './engine/input'
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

const loop = new GameLoop({
  update: (delta) => {
    player.update(delta, input, level.solids)

    if (player.body.y > level.height + 200) {
      player.reset()
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
  },
})

loop.start()
