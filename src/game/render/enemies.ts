import type { Enemy } from '../entities/types'

export function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy) {
  if (enemy.type === 'turtle') {
    drawTurtle(ctx, enemy)
  } else if (enemy.type === 'slime') {
    drawSlime(ctx, enemy)
  } else {
    drawBird(ctx, enemy)
  }
}

function drawTurtle(ctx: CanvasRenderingContext2D, enemy: Enemy) {
  const { body } = enemy
  const cycle = Math.sin(enemy.animTimer * 6)
  ctx.save()
  ctx.translate(body.x + body.width / 2, body.y + body.height)
  ctx.scale(enemy.dir, 1)

  ctx.fillStyle = 'rgba(0,0,0,0.2)'
  ctx.beginPath()
  ctx.ellipse(0, 2, body.width / 2, 5, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#32513b'
  ctx.fillRect(-body.width / 2, -10, body.width, 10)
  ctx.fillStyle = '#547d4f'
  ctx.fillRect(-body.width / 2 + 2, -16, body.width - 4, 12)
  ctx.fillStyle = '#6ebf73'
  ctx.fillRect(-body.width / 2 + 2, -12, body.width - 4, 6)

  ctx.fillStyle = '#b7dba4'
  ctx.fillRect(body.width / 2 - 4, -18 + cycle * 1.5, 6, 8)
  ctx.fillStyle = '#4f2c2c'
  ctx.fillRect(body.width / 2 - 2, -16 + cycle * 1.5, 3, 3)

  ctx.restore()
}

function drawSlime(ctx: CanvasRenderingContext2D, enemy: Enemy) {
  const { body } = enemy
  const squish =
    Math.max(0.7, 1 - Math.abs(enemy.body.vy || 0) * 0.002) +
    Math.sin(enemy.animTimer * 8) * 0.03
  ctx.save()
  ctx.translate(body.x + body.width / 2, body.y + body.height)
  ctx.scale(1, squish)

  const radiusX = body.width / 2
  const radiusY = body.height / 1.6
  ctx.fillStyle = '#6de2d3'
  ctx.beginPath()
  ctx.ellipse(0, -radiusY, radiusX, radiusY, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#aef5ec'
  ctx.beginPath()
  ctx.ellipse(0, -radiusY - 4, radiusX - 6, radiusY - 6, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#1a1d2f'
  ctx.fillRect(-6, -radiusY - 2, 4, 3)
  ctx.fillRect(2, -radiusY - 2, 4, 3)
  ctx.restore()
}

function drawBird(ctx: CanvasRenderingContext2D, enemy: Enemy) {
  const { body } = enemy
  const flap = Math.sin(enemy.animTimer * 10) * 6
  ctx.save()
  ctx.translate(body.x + body.width / 2, body.y + body.height / 2)
  ctx.scale(enemy.dir, 1)

  ctx.fillStyle = '#1b375a'
  ctx.beginPath()
  ctx.ellipse(0, 0, body.width / 2, body.height / 2, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#274c7a'
  ctx.beginPath()
  ctx.moveTo(-body.width / 2, 0)
  ctx.lineTo(-body.width, -flap)
  ctx.lineTo(-body.width / 2, flap)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#f7e9c0'
  ctx.fillRect(body.width / 4, -2, 6, 4)
  ctx.fillStyle = '#fcd7a7'
  ctx.fillRect(body.width / 4 + 2, -1, 4, 3)

  ctx.fillStyle = '#e9f4ff'
  ctx.fillRect(2, -3, 3, 2)
  ctx.fillRect(6, -3, 3, 2)
  ctx.restore()
}
