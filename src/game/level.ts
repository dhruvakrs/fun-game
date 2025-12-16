import type { Rect } from './entities'

type SolidTile = Rect & { kind: 'ground' | 'platform' }

const TILE_SIZE = 32
const LEVEL_WIDTH = 64

const rawRows = [
  '................................................................',
  '................................................................',
  '...............==.........................==...................',
  '..........................==....................................',
  '............==....................==............................',
  '....................==.................==.......................',
  '................................................................',
  '.............====.......................===.....................',
  '..............................==...............................',
  '....===.........................................==..............',
  '...................###.................###......................',
  '...................###.................###......................',
  '..........###..............................###..............',
  '..........###..................................###..............',
  'P..................==...........................................',
  '.........................==.....................................',
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
        }
      }
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
  }
}
