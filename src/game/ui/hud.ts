import { GameConfig } from '../config'
import type { GameState } from '../gameState'

const PANEL_HEIGHT = 58
const PANEL_RADIUS = 12

export function drawHud(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  time: number,
) {
  const width = ctx.canvas.width - 28
  const x = (ctx.canvas.width - width) / 2
  const y = 10

  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = 14
  ctx.shadowOffsetY = 6

  const gradient = ctx.createLinearGradient(0, y, 0, y + PANEL_HEIGHT)
  gradient.addColorStop(0, '#1a2242')
  gradient.addColorStop(1, '#0c1228')

  drawRoundedRect(ctx, x, y, width, PANEL_HEIGHT, PANEL_RADIUS)
  ctx.fillStyle = gradient
  ctx.fill()

  ctx.strokeStyle = '#3fd2ff'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.restore()

  const padding = 18
  const panelWidth = (width - padding * 2) / 3
  const baseY = y + PANEL_HEIGHT / 2 + 6

  drawStat(ctx, 'Score', state.score.toString(), x + padding, baseY)
  drawCoinPanel(ctx, state, x + padding + panelWidth, baseY, panelWidth, time)
  drawStat(
    ctx,
    'Lives',
    `${state.lives}`,
    x + padding + panelWidth * 2,
    baseY,
  )
}

function drawStat(
  ctx: CanvasRenderingContext2D,
  label: string,
  value: string,
  x: number,
  baseY: number,
) {
  ctx.save()
  ctx.fillStyle = '#7fa6ff'
  ctx.font = '14px "Segoe UI", sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(label.toUpperCase(), x, baseY - 16)

  ctx.fillStyle = '#f6f7ff'
  ctx.font = '22px "Segoe UI Semibold", sans-serif'
  ctx.fillText(value, x, baseY + 6)
  ctx.restore()
}

function drawCoinPanel(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  x: number,
  baseY: number,
  width: number,
  time: number,
) {
  drawStat(ctx, 'Coins', `${state.coins}`, x, baseY)
  const coinX = x + width - 36
  const coinY = baseY - 8
  drawCoinIcon(ctx, coinX, coinY, time)

  ctx.save()
  ctx.fillStyle = '#7fa6ff'
  ctx.font = '12px "Segoe UI", sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(`+${GameConfig.coinValue}`, coinX + 12, coinY + 22)
  ctx.restore()
}

function drawCoinIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
) {
  const pulse = 1 + Math.sin(time * 6) * 0.08
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(pulse, pulse)

  ctx.fillStyle = '#1b102c'
  ctx.beginPath()
  ctx.ellipse(0, 12, 12, 7, 0, 0, Math.PI * 2)
  ctx.fill()

  const rim = ctx.createRadialGradient(-4, -2, 4, 0, 0, 16)
  rim.addColorStop(0, '#ffdf7e')
  rim.addColorStop(1, '#f1b94f')
  ctx.fillStyle = rim
  ctx.beginPath()
  ctx.roundRect(-12, -18, 24, 24, 6)
  ctx.fill()

  ctx.fillStyle = '#fdf2c5'
  ctx.beginPath()
  ctx.roundRect(-8, -14, 16, 16, 4)
  ctx.fill()

  ctx.fillStyle = '#f1b94f'
  ctx.fillRect(-2, -10, 4, 12)
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.fillRect(-8, -14, 6, 3)
  ctx.fillRect(2, -6, 6, 2)

  ctx.restore()
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius,
    y + height,
  )
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}
