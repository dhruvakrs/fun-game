import { GameConfig } from '../config'
import type { Coin } from '../entities/types'

export function drawCoin(
  ctx: CanvasRenderingContext2D,
  coin: Coin,
  time: number,
) {
  const centerX = coin.x + coin.width / 2
  const centerY = coin.y + coin.height / 2
  const pulse = 1 + Math.sin(time * GameConfig.coinFlashSpeed + centerX * 0.02) * 0.12
  const wobble = Math.sin(time * 2 + centerX * 0.05) * 1.8
  const glint = ((time * 1.4 + centerX * 0.01) % 1) * coin.width - coin.width / 2

  ctx.save()
  ctx.translate(centerX, centerY + wobble)
  ctx.scale(pulse, pulse)

  const radius = coin.width / 2
  drawThickness(ctx, radius)

  const rimGradient = ctx.createRadialGradient(-4, -4, 6, 0, 0, radius + 2)
  rimGradient.addColorStop(0, '#ffe9a3')
  rimGradient.addColorStop(1, '#f3b84f')
  ctx.fillStyle = rimGradient
  ctx.beginPath()
  ctx.ellipse(0, 0, radius, radius * 0.9, 0, 0, Math.PI * 2)
  ctx.fill()

  const faceGradient = ctx.createLinearGradient(-radius, -radius, radius, radius)
  faceGradient.addColorStop(0, '#fff6c5')
  faceGradient.addColorStop(1, '#f7c45e')
  ctx.fillStyle = faceGradient
  ctx.beginPath()
  ctx.ellipse(0, 0, radius - 4, radius * 0.75, 0, 0, Math.PI * 2)
  ctx.fill()

  // Embossed star
  ctx.fillStyle = '#f1b94f'
  ctx.beginPath()
  const starSize = 4
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5 - Math.PI / 2
    const x = Math.cos(angle) * starSize
    const y = Math.sin(angle) * starSize * 0.9
    ctx.lineTo(x, y)
    const innerAngle = angle + Math.PI / 5
    ctx.lineTo(Math.cos(innerAngle) * (starSize / 2), Math.sin(innerAngle) * (starSize / 2))
  }
  ctx.closePath()
  ctx.fill()

  // Glint sweep
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(glint - 6, -radius * 0.8)
  ctx.lineTo(glint + 6, radius * 0.8)
  ctx.stroke()

  ctx.restore()
}

function drawThickness(ctx: CanvasRenderingContext2D, radius: number) {
  ctx.fillStyle = '#d9a542'
  ctx.beginPath()
  ctx.ellipse(3, 3, radius - 1, radius * 0.86, 0, 0, Math.PI * 2)
  ctx.fill()
}
