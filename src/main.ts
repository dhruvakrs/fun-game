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
import { drawCoin } from './game/render/coinSprite'
import { drawBouncePad } from './game/render/bouncePad'
import { tickBouncePads } from './game/entities/bouncePad'
import { drawBoulder, drawFireBar } from './game/render/obstacles'
import { drawEnemy } from './game/render/enemies'
import {
  updateBoulders,
  updateFireBars,
} from './game/entities/obstacles'
import { updateEnemies } from './game/entities/enemies'
import { LEVELS } from './game/levels'
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

  bounce() {
    this.play(520, 0.24, 'triangle')
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
overlay.innerText = 'Enter: start/next · R: restart · Arrows/A/D: move · Space: jump'
app.appendChild(overlay)

const context = canvas.getContext('2d')

if (!context) {
  throw new Error('Canvas not supported')
}

const ctx = context

const input = new Input()
const levelDefs = LEVELS
let currentLevelIndex = 0
let level = new Level(levelDefs[currentLevelIndex])
let player = new Player(level.spawnPoint)
let camera = new Camera(canvas.width, level.width)
const state = new GameState()
const sound = new SoundFX()
const ui = new UIManager()
let elapsed = 0

const loop = new GameLoop({
  update: (delta) => {
    elapsed += delta
    ui.update(delta)
    tickBouncePads(level.bouncePads, delta)

    const pressedStart = input.consumePress('start')
    const pressedRestart = input.consumePress('restart')

    if (pressedRestart) {
      switchLevel(currentLevelIndex, true)
      return
    }

    if (state.status === 'start') {
      if (pressedStart) {
        switchLevel(currentLevelIndex, true)
      }
      return
    }

    if (state.status === 'complete') {
      if (pressedStart) {
        const hasNext = currentLevelIndex < levelDefs.length - 1
        const nextIndex = hasNext ? currentLevelIndex + 1 : 0
        switchLevel(nextIndex, !hasNext)
      }
      return
    }

    if (state.status !== 'playing') {
      return
    }

    player.update(delta, input, level.solids)

    const bouncePad = level.bouncePads.find(
      (pad) =>
        pad.cooldown <= 0 &&
        intersects(player.body, pad) &&
        player.body.y + player.body.height <= pad.y + pad.height + 4,
    )
    if (bouncePad) {
      const strength =
        GameConfig.bounceStrength *
        (bouncePad.squash > 0 ? GameConfig.bounceDamping : 1)
      player.applyBounce(strength)
      bouncePad.squash = 1
      bouncePad.cooldown = 0.12
      sound.bounce()
    }

    updateBoulders(level.boulders, delta)
    updateFireBars(level.fireBars, delta)
    updateEnemies(level.enemies, delta)

    const spike = level.hazards.some((hazard) => intersects(player.body, hazard))
    const boulderHit = level.boulders.some((boulder) =>
      intersects(player.body, boulder),
    )
    const fireHit = level.hitsFireBar(player.body)
    const enemyHit = level.enemies.some((enemy) =>
      intersects(player.body, enemy.body),
    )
    const fell = player.body.y > level.height + 200
    if (spike || boulderHit || fireHit || enemyHit || fell) {
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
    level.bouncePads.forEach((pad) => drawBouncePad(ctx, pad, elapsed))
    level.boulders.forEach((boulder) => drawBoulder(ctx, boulder))
    level.fireBars.forEach((bar) => drawFireBar(ctx, bar))
    level.coins.forEach((coin) => {
      if (coin.collected) return
      drawCoin(ctx, coin, elapsed)
    })
    level.enemies.forEach((enemy) => drawEnemy(ctx, enemy))
    drawPlayer(ctx, player, elapsed)

    ctx.restore()

    ui.renderScorePops(ctx, camera.x)
    ui.renderHud(ctx, state, elapsed, `Level ${state.level}: ${level.name}`)
    ui.renderScreens(ctx, state, elapsed, level.name, getNextLevelName())
  },
})

loop.start()

function beginRun(resetStats: boolean) {
  if (resetStats) {
    state.startRun(currentLevelIndex)
  } else {
    state.continueRun(currentLevelIndex)
  }
  level.resetRunState()
  player.reset(level.spawnPoint)
  snapCamera()
}

function switchLevel(index: number, resetStats: boolean) {
  currentLevelIndex = index
  level = new Level(levelDefs[currentLevelIndex])
  player = new Player(level.spawnPoint)
  camera = new Camera(canvas.width, level.width)
  beginRun(resetStats)
}

function handleHazard() {
  sound.hit()
  state.hitHazard()
  level.resetDynamics()
  level.resetBouncePads()
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

function getNextLevelName() {
  if (currentLevelIndex < levelDefs.length - 1) {
    return levelDefs[currentLevelIndex + 1].name
  }
  return undefined
}
