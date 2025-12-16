import type { BouncePad } from '../entities/types'

export function drawBouncePad(
  ctx: CanvasRenderingContext2D,
  pad: BouncePad,
  time: number,
) {
  const squish = 1 - Math.min(0.35, pad.squash * 0.4)
  const wobble = Math.sin(time * 12 + pad.x * 0.08) * pad.squash * 2

  ctx.save()
  ctx.translate(pad.x + pad.width / 2, pad.y + pad.height)
  ctx.scale(1, squish)
  ctx.translate(0, wobble)

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.beginPath()
  ctx.ellipse(0, 6, pad.width / 2, 6, 0, 0, Math.PI * 2)
  ctx.fill()

  // Springs
  ctx.strokeStyle = '#c6e2ff'
  ctx.lineWidth = 3
  const springTop = -pad.height + 6
  ctx.beginPath()
  ctx.moveTo(-8, 0)
  ctx.lineTo(-4, springTop)
  ctx.lineTo(0, 0)
  ctx.lineTo(4, springTop)
  ctx.lineTo(8, 0)
  ctx.stroke()

  // Base
  ctx.fillStyle = '#102039'
  ctx.fillRect(-pad.width / 2, -4, pad.width, 10)
  ctx.fillStyle = '#1e3355'
  ctx.fillRect(-pad.width / 2 + 2, -2, pad.width - 4, 6)

  // Top plate
  const plateHeight = 10
  ctx.fillStyle = '#4be0c1'
  ctx.fillRect(-pad.width / 2, springTop - plateHeight, pad.width, plateHeight)
  ctx.fillStyle = '#69ffe2'
  ctx.fillRect(-pad.width / 2, springTop - plateHeight, pad.width, 3)

  ctx.restore()
}
