import './style.css'
import { Camera } from './engine/camera'
import { moveWithCollisions } from './engine/collision'
import { GameLoop } from './engine/gameLoop'
import { Input } from './engine/input'
import type { Rect } from './game/entities'

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
overlay.innerText = 'Use arrows/A/D to move, Space to jump'
app.appendChild(overlay)

const ctx = canvas.getContext('2d')

if (!ctx) {
  throw new Error('Canvas not supported')
}

const input = new Input()
const gravity = 1600
const moveSpeed = 240
const jumpSpeed = 620

const solids: Rect[] = [
  { x: -200, y: 500, width: 2400, height: 60 },
  { x: 300, y: 420, width: 180, height: 20 },
  { x: 760, y: 360, width: 220, height: 20 },
  { x: 1300, y: 320, width: 140, height: 20 },
]

const testBody = { x: 80, y: 80, width: 32, height: 32, vx: 0, vy: 0 }
let grounded = false

const camera = new Camera(canvas.width, 2000)

const loop = new GameLoop({
  update: (delta) => {
    const direction =
      (input.isHeld('left') ? -1 : 0) + (input.isHeld('right') ? 1 : 0)
    testBody.vx = direction * moveSpeed

    if (grounded && input.consumePress('jump')) {
      testBody.vy = -jumpSpeed
      grounded = false
    }

    testBody.vy += gravity * delta
    const result = moveWithCollisions(testBody, solids, delta)
    grounded = result.grounded

    camera.follow(testBody.x + testBody.width / 2, delta)
  },
  render: () => {
    ctx.fillStyle = '#0a0e1f'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.save()
    ctx.translate(-camera.x, 0)

    ctx.fillStyle = '#152041'
    ctx.fillRect(-200, canvas.height - 60, 2400, 60)

    ctx.fillStyle = '#3fd2ff'
    solids.forEach((solid) => {
      ctx.fillRect(solid.x, solid.y, solid.width, solid.height)
    })

    ctx.fillStyle = grounded ? '#7fffd4' : '#ffbf69'
    ctx.fillRect(testBody.x, testBody.y, testBody.width, testBody.height)

    ctx.restore()

    ctx.fillStyle = '#9fb7ff'
    ctx.font = '16px "Segoe UI", sans-serif'
    ctx.fillText('Core loop demo — camera follows horizontally', 16, 24)
  },
})

loop.start()
