import {
  type Boulder,
  type BouncePad,
  type Coin,
  type Enemy,
  type FireBar,
  type Goal,
  type Hazard,
  type Rect,
} from './entities/types'
import {
  fireBarHits,
  spawnBoulder,
  spawnFireBar,
} from './entities/obstacles'
import { resetEnemies } from './entities/enemies'
import type { CoinTrail, LevelDefinition } from './levels'

type SolidTile = Rect & { kind: 'ground' | 'platform' }

const TILE_SIZE = 32
const LEVEL_WIDTH = 64

export class Level {
  readonly width: number
  readonly height: number
  readonly terrain: SolidTile[] = []
  readonly solids: Rect[] = []
  readonly coins: Coin[] = []
  readonly hazards: Hazard[] = []
  readonly bouncePads: BouncePad[] = []
  readonly name: string
  boulders: Boulder[] = []
  fireBars: FireBar[] = []
  enemies: Enemy[] = []
  goal: Goal | null = null
  spawnPoint = { x: TILE_SIZE * 2, y: TILE_SIZE * 10 }
  spawnPointP2: { x: number; y: number } | null = null
  private definition: LevelDefinition

  private rows: string[]

  constructor(definition: LevelDefinition) {
    this.definition = definition
    this.name = definition.name
    this.rows = definition.rows.map((row, index) => {
      if (row.length > LEVEL_WIDTH) {
        throw new Error(`Row ${index} exceeds level width of ${LEVEL_WIDTH}`)
      }
      return row.padEnd(LEVEL_WIDTH, '.')
    })

    this.width = LEVEL_WIDTH * TILE_SIZE
    this.height = this.rows.length * TILE_SIZE

    this.rows.forEach((row, y) => {
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
        } else if (symbol === '2') {
          this.spawnPointP2 = { x: worldX, y: worldY - 8 }
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

    this.addCoinTrails(definition.coinTrails ?? [])
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
    this.boulders = (this.definition.boulders ?? []).map((def) =>
      spawnBoulder(def),
    )
    this.fireBars = (this.definition.fireBars ?? []).map((def) =>
      spawnFireBar(def),
    )
    resetEnemies(this.enemies, this.definition.enemies ?? [])
  }

  resetRunState() {
    this.resetCoins()
    this.resetBouncePads()
    this.resetDynamics()
  }

  getSpawnPoints() {
    if (this.spawnPointP2) {
      return [this.spawnPoint, this.spawnPointP2]
    }
    const offset = { x: this.spawnPoint.x + TILE_SIZE, y: this.spawnPoint.y }
    return [this.spawnPoint, offset]
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

  hitsFireBar(rect: Rect) {
    return this.fireBars.some((bar) => fireBarHits(bar, rect))
  }

  private addCoinTrails(trails: CoinTrail[]) {
    trails.forEach((trail) => {
      const count = trail.count ?? 5
      const padding = 8
      const coinSize = TILE_SIZE - padding
      for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0.5 : i / (count - 1)
        const tileX = lerp(trail.from[0], trail.to[0], t)
        const tileY = lerp(trail.from[1], trail.to[1], t)
        const arcOffset = Math.sin(Math.PI * t) * 0.6
        const worldX = tileX * TILE_SIZE + padding / 2
        const worldY = (tileY - arcOffset) * TILE_SIZE
        this.coins.push({
          x: worldX,
          y: worldY,
          width: coinSize,
          height: coinSize,
          collected: false,
        })
      }
    })
  }
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}
