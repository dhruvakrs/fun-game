import type { Coin, Goal, Hazard, Rect } from './entities/types'

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
  'P..................==..............C.............S.....G.......',
  '.............S..............==...........S.....................',
  '################################################################',
  '################################################################',
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
  readonly solids: SolidTile[] = []
  readonly coins: Coin[] = []
  readonly hazards: Hazard[] = []
  goal: Goal | null = null
  spawnPoint = { x: TILE_SIZE * 2, y: TILE_SIZE * 10 }

  constructor() {
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const symbol = row[x]
        const worldX = x * TILE_SIZE
        const worldY = y * TILE_SIZE
        if (symbol === '#' || symbol === '=') {
          this.solids.push({
            kind: symbol === '#' ? 'ground' : 'platform',
            x: worldX,
            y: worldY,
            width: TILE_SIZE,
            height: TILE_SIZE,
          })
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
  }

  resetCoins() {
    this.coins.forEach((coin) => {
      coin.collected = false
    })
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#0e1936'
    ctx.fillRect(0, 0, this.width, this.height)

    this.solids.forEach((solid) => {
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

    this.coins.forEach((coin) => {
      if (coin.collected) return
      const radius = coin.width / 2
      ctx.fillStyle = '#ffd166'
      ctx.beginPath()
      ctx.arc(coin.x + radius, coin.y + radius, radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#ffef9f'
      ctx.lineWidth = 2
      ctx.stroke()
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
