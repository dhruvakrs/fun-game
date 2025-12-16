import type { GameState } from '../gameState'

export function drawScreens(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  time: number,
  levelName: string,
  nextLevelName?: string,
) {
  if (state.status === 'playing') return

  drawPattern(ctx, time)
  drawOverlay(ctx)

  const { title, subtitle, prompt } = getCopy(state, levelName, nextLevelName)
  const centerX = ctx.canvas.width / 2
  const centerY = ctx.canvas.height / 2

  ctx.save()
  ctx.textAlign = 'center'
  ctx.strokeStyle = 'rgba(50, 214, 255, 0.6)'
  ctx.lineWidth = 5
  ctx.fillStyle = '#e6edff'
  ctx.font = '36px "Segoe UI Semibold", sans-serif'
  ctx.strokeText(title, centerX, centerY - 24)
  ctx.fillText(title, centerX, centerY - 24)

  ctx.fillStyle = '#9fb7ff'
  ctx.font = '18px "Segoe UI", sans-serif'
  ctx.fillText(subtitle, centerX, centerY + 6)

  const pulse = 0.6 + Math.sin(time * 3) * 0.4
  ctx.globalAlpha = pulse
  ctx.fillStyle = '#f8f0ff'
  ctx.font = '20px "Segoe UI", sans-serif'
  ctx.fillText(prompt, centerX, centerY + 42)
  ctx.restore()
}

function drawOverlay(ctx: CanvasRenderingContext2D) {
  const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height)
  gradient.addColorStop(0, 'rgba(10, 14, 26, 0.75)')
  gradient.addColorStop(1, 'rgba(6, 8, 18, 0.9)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
}

function drawPattern(ctx: CanvasRenderingContext2D, time: number) {
  ctx.save()
  ctx.fillStyle = '#0a0f1f'
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  const stripeHeight = 36
  const offset = (time * 60) % stripeHeight
  for (let y = -stripeHeight; y < ctx.canvas.height + stripeHeight; y += stripeHeight) {
    const rowY = y + offset
    ctx.fillStyle = 'rgba(63, 210, 255, 0.05)'
    ctx.fillRect(0, rowY, ctx.canvas.width, stripeHeight / 2)
    ctx.fillStyle = 'rgba(255, 122, 162, 0.04)'
    ctx.fillRect(0, rowY + stripeHeight / 2, ctx.canvas.width, stripeHeight / 2)
  }

  // Floating orbs parallax
  const orbs = 14
  for (let i = 0; i < orbs; i++) {
    const t = (time * 0.6 + i * 0.11) % 1
    const x = (i * 83 + time * 60) % (ctx.canvas.width + 80) - 40
    const y = t * ctx.canvas.height
    const r = 6 + (i % 3) * 2
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

function getCopy(
  state: GameState,
  levelName: string,
  nextLevelName?: string,
) {
  if (state.status === 'start') {
    return {
      title: 'Princess Plumber',
      subtitle: `Level ${state.level}: ${levelName}`,
      prompt: 'Press Enter to Start',
    }
  }
  if (state.status === 'complete') {
    const prompt = nextLevelName
      ? `Press Enter for ${nextLevelName}`
      : 'Press Enter to Restart'
    return {
      title: 'Level Complete!',
      subtitle: nextLevelName
        ? `Next: ${nextLevelName}`
        : 'Nice run — grab more coins next time',
      prompt,
    }
  }

  return {
    title: 'Game Over',
    subtitle: 'Watch out for spikes and falls',
    prompt: 'Press R to Try Again',
  }
}
