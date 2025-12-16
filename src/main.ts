import './style.css'
import { Camera } from './engine/camera'
import { intersects } from './engine/collision'
import { GameLoop } from './engine/gameLoop'
import { Input } from './engine/input'
import { GameState } from './game/gameState'
import { Level } from './game/level'
import { Player } from './game/entities/player'
import { GameConfig } from './game/config'
import { drawPlayer } from './game/render/playerSprite'
import { UIManager } from './game/ui/uiManager'

class SoundFX {
  private ctx: AudioContext | null = null

  private ensureContext() {
    if (typeof AudioContext === 'undefined') return null
    if (!this.ctx) {
      this.ctx = new AudioContext()
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume()
    }
    return this.ctx
  }

  play(frequency: number, duration = 0.18, type: OscillatorType = 'sine') {
    const ctx = this.ensureContext()
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = frequency
    gain.gain.value = 0.12
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)
    osc.stop(ctx.currentTime + duration)
  }

  coin() {
    this.play(880, 0.12, 'square')
  }

  hit() {
    this.play(200, 0.25, 'sawtooth')
  }

  win() {
    this.play(660, 0.35, 'triangle')
  }
}

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
overlay.innerText = 'Enter: start · R: restart · Arrows/A/D: move · Space: jump'
app.appendChild(overlay)

const context = canvas.getContext('2d')

if (!context) {
  throw new Error('Canvas not supported')
}

const ctx = context

const input = new Input()
const level = new Level()
const player = new Player(level.spawnPoint)
const camera = new Camera(canvas.width, level.width)
const state = new GameState()
const sound = new SoundFX()
const ui = new UIManager()
let elapsed = 0

const loop = new GameLoop({
  update: (delta) => {
    elapsed += delta
    ui.update(delta)

    const pressedStart = input.consumePress('start')
    const pressedRestart = input.consumePress('restart')

    if (state.status === 'start') {
      if (pressedStart || pressedRestart) {
        beginRun()
      }
      return
    }

    if (pressedRestart) {
      beginRun()
      return
    }

    if (state.status !== 'playing') {
      return
    }

    player.update(delta, input, level.solids)

    const spike = level.hazards.some((hazard) => intersects(player.body, hazard))
    const fell = player.body.y > level.height + 200
    if (spike || fell) {
      handleHazard()
    }

    level.coins.forEach((coin) => {
      if (coin.collected) return
      if (intersects(player.body, coin)) {
        coin.collected = true
        state.addCoin()
        ui.addScorePop(
          coin.x + coin.width / 2,
          coin.y,
          GameConfig.coinValue,
        )
        sound.coin()
      }
    })

    if (level.goal && intersects(player.body, level.goal)) {
      state.completeLevel()
      sound.win()
    }

    camera.follow(player.body.x + player.body.width / 2, delta)
  },
  render: () => {
    ctx.fillStyle = '#060a18'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.save()
    ctx.translate(-camera.x, 0)

    level.draw(ctx)
    drawPlayer(ctx, player, elapsed)

    ctx.restore()

    ui.renderScorePops(ctx, camera.x)
    ui.renderHud(ctx, state, elapsed)
    ui.renderScreens(ctx, state, elapsed)
  },
})

loop.start()

function beginRun() {
  state.startRun()
  level.resetCoins()
  player.reset(level.spawnPoint)
  snapCamera()
}

function handleHazard() {
  sound.hit()
  state.hitHazard()
  player.reset()
  snapCamera()
}

function snapCamera() {
  const centerX = player.body.x + player.body.width / 2
  const clamped = Math.max(
    0,
    Math.min(level.width - canvas.width, centerX - canvas.width / 2),
  )
  camera.x = clamped
}
