import './style.css'
import { intersects } from './engine/collision'
import { GameLoop } from './engine/gameLoop'
import { MultiCamera } from './engine/multiCamera'
import { Input, type ControlScheme, type InputProfile } from './engine/input'
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
import { updateBoulders, updateFireBars } from './game/entities/obstacles'
import { updateEnemies } from './game/entities/enemies'
import { LEVELS } from './game/levels'
import { UIManager } from './game/ui/uiManager'
import type { NetworkState, SessionMode } from './online/types'
import { NetSession } from './online/netSession'

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
overlay.innerText =
  '1/Enter: Local · 2/H: Host Online · 3/J: Join Online · R: restart · Arrows/A/D move · Space jump'
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
const PLAYER_COUNT = 2
const controlSchemes: ControlScheme[] = [
  {
    left: ['KeyA', 'ArrowLeft'],
    right: ['KeyD', 'ArrowRight'],
    jump: ['Space', 'ArrowUp', 'KeyW'],
  },
  {
    left: ['Numpad4', 'KeyJ'],
    right: ['Numpad6', 'KeyL'],
    jump: ['Numpad8', 'Numpad5', 'KeyI'],
  },
]

type PlayerSlot = {
  entity: Player
  input: InputProfile
  reachedGoal: boolean
}

let players: PlayerSlot[] = []
let camera = new MultiCamera(canvas.width, level.width)
const state = new GameState()
const sound = new SoundFX()
const ui = new UIManager()
let elapsed = 0
let sessionMode: SessionMode = 'local'
let netSession: NetSession | null = null
let remoteState: NetworkState | null = null
let connectionInfo = 'Local co-op'
const peerId =
  (typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10)).slice(0, 8)
const guestInputProfile = input.registerProfile(controlSchemes[0])

setupPlayers()

const loop = new GameLoop({
  update: (delta) => {
    elapsed += delta
    ui.update(delta)
    tickBouncePads(level.bouncePads, delta)

    const pressedStart =
      input.consumeKey('Enter') || input.consumeKey('NumpadEnter')
    const pressedRestart = input.consumeKey('KeyR')
    const chooseLocal = pressedStart || input.consumeKey('Digit1')
    const chooseHost = input.consumeKey('KeyH') || input.consumeKey('Digit2')
    const chooseJoin = input.consumeKey('KeyJ') || input.consumeKey('Digit3')

    if (pressedRestart) {
      switchLevel(currentLevelIndex, true)
      return
    }

    if (state.status === 'start') {
      if (chooseLocal) {
        startLocal()
      } else if (chooseHost) {
        startOnlineHost()
      } else if (chooseJoin) {
        const code = window.prompt('Enter room code from host:')
        if (code) {
          startOnlineGuest(code.trim())
        }
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

    players.forEach((slot, index) => {
      if (!slot.entity.active || state.livesLeft(index) <= 0) {
        slot.entity.active = false
        return
      }

      slot.entity.update(delta, slot.input, level.solids)

      const bouncePad = level.bouncePads.find(
        (pad) =>
          pad.cooldown <= 0 &&
          intersects(slot.entity.body, pad) &&
          slot.entity.body.y + slot.entity.body.height <=
            pad.y + pad.height + 4,
      )
      if (bouncePad) {
        const strength =
          GameConfig.bounceStrength *
          (bouncePad.squash > 0 ? GameConfig.bounceDamping : 1)
        slot.entity.applyBounce(strength)
        bouncePad.squash = 1
        bouncePad.cooldown = 0.12
        sound.bounce()
      }
    })

    updateBoulders(level.boulders, delta)
    updateFireBars(level.fireBars, delta)
    updateEnemies(level.enemies, delta)

    players.forEach((slot, index) => {
      if (!slot.entity.active || state.livesLeft(index) <= 0) return

      const spike = level.hazards.some((hazard) =>
        intersects(slot.entity.body, hazard),
      )
      const boulderHit = level.boulders.some((boulder) =>
        intersects(slot.entity.body, boulder),
      )
      const fireHit = level.hitsFireBar(slot.entity.body)
      const enemyHit = level.enemies.some((enemy) =>
        intersects(slot.entity.body, enemy.body),
      )
      const fell = slot.entity.body.y > level.height + 200
      if (spike || boulderHit || fireHit || enemyHit || fell) {
        handleHazard(index)
      }

      level.coins.forEach((coin) => {
        if (coin.collected) return
        if (intersects(slot.entity.body, coin)) {
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

      if (level.goal && intersects(slot.entity.body, level.goal)) {
        slot.reachedGoal = true
      }
    })

    if (state.status !== 'playing') {
      return
    }

    const activePlayers = players.filter(
      (_slot, idx) => state.livesLeft(idx) > 0 && _slot.entity.active,
    )
    camera.follow(
      activePlayers.map((slot) => slot.entity.body),
      delta,
    )

    const allReached =
      activePlayers.length > 0 &&
      activePlayers.every((slot) => slot.reachedGoal)
    if (state.status === 'playing' && allReached) {
      state.completeLevel()
      sound.win()
    }

  },
  render: () => {
    ctx.fillStyle = '#060a18'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.save()
    ctx.scale(camera.scale, camera.scale)
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
    players.forEach((slot) => {
      if (slot.entity.active && state.status !== 'game-over') {
        drawPlayer(ctx, slot.entity, elapsed)
      }
    })

    ctx.restore()

    ui.renderScorePops(ctx, camera.x)
    ui.renderHud(
      ctx,
      state,
      elapsed,
      `Level ${state.level}: ${level.name}`,
    )
    ui.renderScreens(ctx, state, elapsed, level.name, getNextLevelName())
  },
})

loop.start()

function setupPlayers() {
  const spawns = level.getSpawnPoints()
  players = spawns.slice(0, PLAYER_COUNT).map((spawn, idx) => ({
    entity: new Player(idx + 1, spawn),
    input: input.registerProfile(controlSchemes[idx]),
    reachedGoal: false,
  }))
}

function beginRun(resetStats: boolean) {
  if (resetStats) {
    state.startRun(currentLevelIndex, PLAYER_COUNT)
  } else {
    state.continueRun(currentLevelIndex, PLAYER_COUNT)
  }
  level.resetRunState()
  players.forEach((slot, idx) => {
    slot.entity.reset(level.getSpawnPoints()[idx] ?? level.spawnPoint)
    slot.entity.active = true
    slot.reachedGoal = false
  })
  camera = new MultiCamera(canvas.width, level.width)
}

function switchLevel(index: number, resetStats: boolean) {
  currentLevelIndex = index
  level = new Level(levelDefs[currentLevelIndex])
  setupPlayers()
  beginRun(resetStats)
}

function handleHazard(playerIndex: number) {
  sound.hit()
  state.loseLife(playerIndex)
  level.resetDynamics()
  const livesLeft = state.livesLeft(playerIndex)
  const slot = players[playerIndex]
  slot.reachedGoal = false
  if (livesLeft > 0) {
    slot.entity.reset(level.getSpawnPoints()[playerIndex] ?? level.spawnPoint)
    slot.entity.active = true
  } else {
    slot.entity.active = false
  }
}

function getNextLevelName() {
  if (currentLevelIndex < levelDefs.length - 1) {
    return levelDefs[currentLevelIndex + 1].name
  }
  return undefined
}
