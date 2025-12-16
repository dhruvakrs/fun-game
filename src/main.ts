import './style.css'
import { intersects } from './engine/collision'
import { GameLoop } from './engine/gameLoop'
import { MultiCamera } from './engine/multiCamera'
import { Input, type ControlScheme, type InputProfile } from './engine/input'
import { GameState, type GameStatus } from './game/gameState'
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

const overlayBaseText =
  '1/Enter: Local · 2/H: Host Online · 3/J: Join Online · R: restart · Arrows/A/D move · Space jump'
const overlay = document.createElement('div')
overlay.className = 'overlay'
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
let remoteInputProfile: InputProfile | null = null
let activeRoomCode: string | null = null
let waitingForHost = false
const peerId =
  (typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10)).slice(0, 8)
const guestInputProfile = input.registerProfile(controlSchemes[0])
let connectionInfo = 'Local co-op'

function setConnectionInfo(text: string) {
  connectionInfo = text
  overlay.innerText = `${overlayBaseText}\n${connectionInfo}`
}

setConnectionInfo(connectionInfo)

setupPlayers()

const loop = new GameLoop({
  update: (delta) => {
    elapsed += delta
    ui.update(delta)
    const isGuest = sessionMode === 'online-guest'
    if (!isGuest) {
      tickBouncePads(level.bouncePads, delta)
    }

    const pressedStart =
      input.consumeKey('Enter') || input.consumeKey('NumpadEnter')
    const pressedRestart = input.consumeKey('KeyR')
    const pressedCancel = input.consumeKey('Escape')
    const chooseLocal = pressedStart || input.consumeKey('Digit1')
    const chooseHost = input.consumeKey('KeyH') || input.consumeKey('Digit2')
    const chooseJoin = input.consumeKey('KeyJ') || input.consumeKey('Digit3')
    const waitingGuest = sessionMode === 'online-guest' && waitingForHost

    if (pressedRestart && !isGuest) {
      switchLevel(currentLevelIndex, true)
      pushHostState(delta)
      return
    }

    if (state.status === 'start') {
      if (sessionMode === 'online-guest' && (pressedRestart || pressedCancel)) {
        startLocal()
        return
      }
      if (waitingGuest) {
        // Keep waiting for host snapshot; allow cancel via Esc/R above.
        return
      }
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
      if (pressedStart && !isGuest) {
        const hasNext = currentLevelIndex < levelDefs.length - 1
        const nextIndex = hasNext ? currentLevelIndex + 1 : 0
        switchLevel(nextIndex, !hasNext)
      }
      pushHostState(delta)
      return
    }

    if (state.status !== 'playing') {
      pushHostState(delta)
      return
    }

    if (isGuest) {
      if (pressedRestart || pressedCancel) {
        startLocal()
        return
      }
      sendGuestInput()
      followCamera(delta)
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
      pushHostState(delta)
      return
    }

    const activePlayers = players.filter(
      (_slot, idx) => state.livesLeft(idx) > 0 && _slot.entity.active,
    )
    followCamera(delta, activePlayers)

    const allReached =
      activePlayers.length > 0 &&
      activePlayers.every((slot) => slot.reachedGoal)
    if (state.status === 'playing' && allReached) {
      state.completeLevel()
      sound.win()
    }

    pushHostState(delta)
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
    ui.renderScreens(
      ctx,
      state,
      elapsed,
      level.name,
      getNextLevelName(),
      connectionInfo,
    )
  },
})

loop.start()

function startLocal() {
  sessionMode = 'local'
  setConnectionInfo('Local co-op')
  waitingForHost = false
  remoteInputProfile = null
  activeRoomCode = null
  netSession = null
  setupPlayers()
  beginRun(true)
}

function startOnlineHost() {
  sessionMode = 'online-host'
  activeRoomCode = createRoomCode()
  setConnectionInfo(`Hosting room ${activeRoomCode}`)
  waitingForHost = false
  netSession = new NetSession(activeRoomCode, peerId, sessionMode, {
    onConnected: () =>
      setConnectionInfo(`Guest connected · room ${activeRoomCode}`),
    onState: (snapshot) => applyRemoteState(snapshot),
    onError: (err) =>
      setConnectionInfo(`Connection error: ${err.message ?? 'unknown'}`),
  })
  remoteInputProfile = netSession.remoteInput.toProfile()
  setupPlayers(getPlayerTwoProfile())
  beginRun(true)
  if (activeRoomCode) {
    window.alert(`Room code: ${activeRoomCode}\nShare this with your guest.`)
  }
  void netSession
    .startHost()
    .catch(
      (err) =>
        setConnectionInfo(
          `Signal error: ${err instanceof Error ? err.message : String(err)}`,
        ),
    )
}

function startOnlineGuest(roomCode: string) {
  sessionMode = 'online-guest'
  activeRoomCode = roomCode
  waitingForHost = true
  setConnectionInfo(`Joining room ${roomCode}... (Esc to cancel)`)
  netSession = new NetSession(roomCode, peerId, sessionMode, {
    onConnected: () =>
      setConnectionInfo(`Connected · waiting for host state (${roomCode})`),
    onState: (snapshot) => applyRemoteState(snapshot),
    onError: (err) =>
      handleJoinError(err instanceof Error ? err.message : 'unknown error'),
  })
  setupPlayers()
  level.resetRunState()
  state.status = 'start'
  state.level = currentLevelIndex + 1
  void netSession
    .startGuest()
    .catch(
      (err) =>
        handleJoinError(
          err instanceof Error ? err.message : String(err),
        ),
    )
}

function sendGuestInput() {
  if (!netSession) return
  const payload = {
    held: {
      left: guestInputProfile.isHeld('left'),
      right: guestInputProfile.isHeld('right'),
      jump: guestInputProfile.isHeld('jump'),
    },
    pressedJump: guestInputProfile.consumePress('jump'),
  }
  netSession.sendInput(payload)
}

function followCamera(delta: number, activePlayers?: PlayerSlot[]) {
  const targets =
    activePlayers ??
    players.filter(
      (slot, idx) => state.livesLeft(idx) > 0 && slot.entity.active,
    )
  camera.follow(
    targets.map((slot) => slot.entity.body),
    delta,
  )
}

function pushHostState(delta: number) {
  if (sessionMode !== 'online-host' || !netSession) return
  netSession.tickHost(delta, collectNetworkState)
}

function collectNetworkState(): NetworkState {
  return {
    players: players.map((slot, idx) => ({
      x: slot.entity.body.x,
      y: slot.entity.body.y,
      vx: slot.entity.body.vx,
      vy: slot.entity.body.vy,
      onGround: slot.entity.onGround,
      facing: slot.entity.facing,
      lives: state.livesLeft(idx),
      reachedGoal: slot.reachedGoal,
    })),
    coins: level.coins.map((coin) => coin.collected),
    bouncePads: level.bouncePads.map((pad) => pad.squash),
    boulders: level.boulders.map((boulder) => ({
      x: boulder.x,
      y: boulder.y,
      rotation: boulder.rotation,
    })),
    fireBars: level.fireBars.map((bar) => ({ angle: bar.angle })),
    enemies: level.enemies.map((enemy) => ({
      x: enemy.body.x,
      y: enemy.body.y,
      type: enemy.type,
      dir: enemy.dir,
    })),
    score: state.score,
    coinsCount: state.coins,
    levelIndex: currentLevelIndex,
    status: state.status,
  }
}

function applyRemoteState(snapshot: NetworkState) {
  const levelChanged = snapshot.levelIndex !== currentLevelIndex
  if (levelChanged) {
    adoptRemoteLevel(snapshot.levelIndex)
  }
  waitingForHost = false
  state.status = snapshot.status as GameStatus
  state.level = snapshot.levelIndex + 1
  state.score = snapshot.score
  state.coins = snapshot.coinsCount
  state.lives = snapshot.players.map((p) => p.lives)

  if (players.length !== snapshot.players.length) {
    setupPlayers()
  }

  snapshot.players.forEach((remote, idx) => {
    const slot = players[idx]
    if (!slot) return
    slot.entity.body.x = remote.x
    slot.entity.body.y = remote.y
    slot.entity.body.vx = remote.vx
    slot.entity.body.vy = remote.vy
    slot.entity.onGround = remote.onGround
    slot.entity.facing = remote.facing
    slot.entity.active = remote.lives > 0
    slot.reachedGoal = remote.reachedGoal
  })

  level.coins.forEach((coin, idx) => {
    coin.collected = snapshot.coins[idx] ?? coin.collected
  })
  level.bouncePads.forEach((pad, idx) => {
    pad.squash = snapshot.bouncePads[idx] ?? pad.squash
  })
  level.boulders.forEach((boulder, idx) => {
    const remote = snapshot.boulders[idx]
    if (remote) {
      boulder.x = remote.x
      boulder.y = remote.y
      boulder.rotation = remote.rotation
    }
  })
  level.fireBars.forEach((bar, idx) => {
    const remote = snapshot.fireBars[idx]
    if (remote) {
      bar.angle = remote.angle
    }
  })
  level.enemies.forEach((enemy, idx) => {
    const remote = snapshot.enemies[idx]
    if (remote) {
      enemy.body.x = remote.x
      enemy.body.y = remote.y
      enemy.dir = remote.dir
    }
  })
  setConnectionInfo(
    snapshot.status === 'complete'
      ? 'Level complete (host)'
      : `Online with host${activeRoomCode ? ` · room ${activeRoomCode}` : ''}`,
  )
}

function adoptRemoteLevel(index: number) {
  currentLevelIndex = index
  level = new Level(levelDefs[currentLevelIndex])
  setupPlayers()
  camera = new MultiCamera(canvas.width, level.width)
  waitingForHost = false
}

function getPlayerTwoProfile() {
  if (sessionMode === 'online-host' && netSession) {
    remoteInputProfile = netSession.remoteInput.toProfile()
    return remoteInputProfile
  }
  return remoteInputProfile ?? input.registerProfile(controlSchemes[1])
}

function createRoomCode() {
  return Math.random().toString(36).slice(2, 6).toUpperCase()
}

function handleJoinError(message: string) {
  waitingForHost = false
  sessionMode = 'local'
  netSession = null
  activeRoomCode = null
  state.status = 'start'
  setConnectionInfo(`Join failed: ${message}. Back to local start.`)
}

function setupPlayers(p2Input?: InputProfile) {
  const spawns = level.getSpawnPoints()
  const profiles: InputProfile[] = [
    input.registerProfile(controlSchemes[0]),
    p2Input ?? input.registerProfile(controlSchemes[1]),
  ]
  players = spawns.slice(0, PLAYER_COUNT).map((spawn, idx) => ({
    entity: new Player(idx + 1, spawn),
    input: profiles[idx],
    reachedGoal: false,
  }))
}

function beginRun(resetStats: boolean) {
  const playerCount = players.length || PLAYER_COUNT
  if (resetStats) {
    state.startRun(currentLevelIndex, playerCount)
  } else {
    state.continueRun(currentLevelIndex, playerCount)
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
  setupPlayers(getPlayerTwoProfile())
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
