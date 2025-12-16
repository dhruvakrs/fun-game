import type { Boulder, FireBar } from '../entities/types'

export function drawBoulder(
  ctx: CanvasRenderingContext2D,
  boulder: Boulder,
) {
  const centerX = boulder.x + boulder.width / 2
  const centerY = boulder.y + boulder.height / 2
  ctx.save()
  ctx.translate(centerX, centerY)

  ctx.fillStyle = 'rgba(0,0,0,0.2)'
  ctx.beginPath()
  ctx.ellipse(0, boulder.height / 2, boulder.width / 2, 6, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.rotate(boulder.rotation)
  const radius = boulder.width / 2
  ctx.fillStyle = '#4a3f3d'
  ctx.beginPath()
  ctx.ellipse(0, 0, radius, radius, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#7a6d69'
  ctx.beginPath()
  ctx.ellipse(0, 0, radius - 4, radius - 4, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = '#3b302e'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(-radius + 6, 0)
  ctx.lineTo(radius - 6, 0)
  ctx.moveTo(0, -radius + 6)
  ctx.lineTo(0, radius - 6)
  ctx.stroke()

  ctx.restore()
}

export function drawFireBar(ctx: CanvasRenderingContext2D, bar: FireBar) {
  ctx.save()
  ctx.translate(bar.x, bar.y)
  ctx.rotate(bar.angle)

  ctx.fillStyle = '#24344f'
  ctx.beginPath()
  ctx.arc(0, 0, 8, 0, Math.PI * 2)
  ctx.fill()

  const segments = 5
  for (let i = 1; i <= segments; i++) {
    const offset = (bar.length / segments) * i
    drawFlame(ctx, offset, bar.radius)
    drawFlame(ctx, -offset, bar.radius)
  }

  ctx.restore()
}

function drawFlame(ctx: CanvasRenderingContext2D, offset: number, radius: number) {
  const gradient = ctx.createRadialGradient(offset, 0, 2, offset, 0, radius)
  gradient.addColorStop(0, '#fff1c6')
  gradient.addColorStop(0.5, '#ffac5f')
  gradient.addColorStop(1, '#ff5c5c')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(offset, 0, radius, 0, Math.PI * 2)
  ctx.fill()
}
