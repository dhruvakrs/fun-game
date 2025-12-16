import {
  type Boulder,
  type BoulderDef,
  type BouncePad,
  type Coin,
  type Enemy,
  type EnemyDef,
  type FireBar,
  type FireBarDef,
  type Goal,
  type Hazard,
  type Rect,
} from './entities/types'
import { spawnBoulder, spawnFireBar } from './entities/obstacles'
import { resetEnemies } from './entities/enemies'

type SolidTile = Rect & { kind: 'ground' | 'platform' }

const TILE_SIZE = 32
const LEVEL_WIDTH = 64

const rawRows = [
  '................................................................',
  '................................................................',
  '...............==..C.....................==....................',
  '..........................==.........................C.........',
  '............==........C.........==.............................',
  '....................==....C..........==........................',
  '................................................................',
  '.............====........C............===..................C...',
  '..............................==...............................',
  '....===.................................==..........C...........',
  '...................###.................###......................',
  '...................###.................###......................',
  '..........###...............................###.................',
  '..........###............C..................###.................',
  'P..................==..............C....B........S.....G.......',
  '.............S..............==...........S.....................',
  '################################################################',
  '################################################################',
]

const BOULDER_DEFS: BoulderDef[] = [
  {
    x: TILE_SIZE * 18,
    y: TILE_SIZE * 16 - 28,
    size: 28,
    speed: 80,
    range: [TILE_SIZE * 18, TILE_SIZE * 28],
  },
]

const FIREBAR_DEFS: FireBarDef[] = [
  {
    x: TILE_SIZE * 30,
    y: TILE_SIZE * 8,
    length: 88,
    speed: 2.6,
    radius: 10,
  },
]

const ENEMY_DEFS: EnemyDef[] = [
  {
    type: 'turtle',
    x: TILE_SIZE * 6,
    y: TILE_SIZE * 16 - 20,
    range: [TILE_SIZE * 4, TILE_SIZE * 12],
    speed: 55,
  },
  {
    type: 'slime',
    x: TILE_SIZE * 20,
    y: TILE_SIZE * 13 - 18,
    range: [TILE_SIZE * 18, TILE_SIZE * 23],
    speed: 40,
    hopInterval: 1.1,
  },
  {
    type: 'bird',
    x: TILE_SIZE * 30,
    y: TILE_SIZE * 7,
    range: [TILE_SIZE * 25, TILE_SIZE * 34],
    speed: 70,
  },
]

const rows = rawRows.map((row, index) => {
  if (row.length > LEVEL_WIDTH) {
    throw new Error(`Row ${index} exceeds level width of ${LEVEL_WIDTH}`)
  }
  return row.padEnd(LEVEL_WIDTH, '.')
})

export class Level {
  readonly width = LEVEL_WIDTH * TILE_SIZE
  readonly height = rows.length * TILE_SIZE
  readonly terrain: SolidTile[] = []
  readonly solids: Rect[] = []
  readonly coins: Coin[] = []
  readonly hazards: Hazard[] = []
  readonly bouncePads: BouncePad[] = []
  boulders: Boulder[] = []
  fireBars: FireBar[] = []
  enemies: Enemy[] = []
  goal: Goal | null = null
  spawnPoint = { x: TILE_SIZE * 2, y: TILE_SIZE * 10 }

  constructor() {
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const symbol = row[x]
        const worldX = x * TILE_SIZE
        const worldY = y * TILE_SIZE
        if (symbol === '#' || symbol === '=') {
          const kind: SolidTile['kind'] = symbol === '#' ? 'ground' : 'platform'
          const tile: SolidTile = {
            kind,
            x: worldX,
            y: worldY,
            width: TILE_SIZE,
            height: TILE_SIZE,
          }
          this.terrain.push(tile)
          this.solids.push(tile)
        } else if (symbol === 'P') {
          this.spawnPoint = { x: worldX, y: worldY - 8 }
        } else if (symbol === 'C') {
          const padding = 8
          this.coins.push({
            x: worldX + padding / 2,
            y: worldY + padding / 2,
            width: TILE_SIZE - padding,
            height: TILE_SIZE - padding,
            collected: false,
          })
        } else if (symbol === 'S') {
          this.hazards.push({
            x: worldX,
            y: worldY,
            width: TILE_SIZE,
            height: TILE_SIZE,
          })
        } else if (symbol === 'B') {
          const padHeight = 18
          const pad: BouncePad = {
            x: worldX,
            y: worldY + TILE_SIZE - padHeight,
            width: TILE_SIZE,
            height: padHeight,
            squash: 0,
            cooldown: 0,
          }
          this.bouncePads.push(pad)
          this.solids.push(pad)
        } else if (symbol === 'G') {
          this.goal = {
            x: worldX + 8,
            y: worldY - 12,
            width: TILE_SIZE - 12,
            height: TILE_SIZE * 2,
          }
        }
      }
    })

    this.resetDynamics()
  }

  resetCoins() {
    this.coins.forEach((coin) => {
      coin.collected = false
    })
  }

  resetBouncePads() {
    this.bouncePads.forEach((pad) => {
      pad.squash = 0
      pad.cooldown = 0
    })
  }

  resetDynamics() {
    this.boulders = BOULDER_DEFS.map((def) => spawnBoulder(def))
    this.fireBars = FIREBAR_DEFS.map((def) => spawnFireBar(def))
    resetEnemies(this.enemies, ENEMY_DEFS)
  }

  resetRunState() {
    this.resetCoins()
    this.resetBouncePads()
    this.resetDynamics()
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#0e1936'
    ctx.fillRect(0, 0, this.width, this.height)

    this.terrain.forEach((solid) => {
      ctx.fillStyle = solid.kind === 'ground' ? '#22335a' : '#30467a'
      ctx.fillRect(solid.x, solid.y, solid.width, solid.height)
      ctx.fillStyle = '#11182b'
      ctx.fillRect(solid.x, solid.y + solid.height - 6, solid.width, 6)
    })

    this.hazards.forEach((hazard) => {
      ctx.fillStyle = '#ff5c8d'
      ctx.beginPath()
      ctx.moveTo(hazard.x, hazard.y + hazard.height)
      ctx.lineTo(hazard.x + hazard.width / 2, hazard.y)
      ctx.lineTo(hazard.x + hazard.width, hazard.y + hazard.height)
      ctx.closePath()
      ctx.fill()
    })

    if (this.goal) {
      ctx.fillStyle = '#65d6ff'
      ctx.fillRect(this.goal.x, this.goal.y, 4, this.goal.height)
      ctx.fillStyle = '#9efcff'
      ctx.beginPath()
      ctx.moveTo(this.goal.x + 4, this.goal.y + 8)
      ctx.lineTo(this.goal.x + this.goal.width, this.goal.y + 16)
      ctx.lineTo(this.goal.x + 4, this.goal.y + 24)
      ctx.closePath()
      ctx.fill()
    }
  }
}
