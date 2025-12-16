import type { ScorePop } from './types'

export function createScorePop(
  x: number,
  y: number,
  value: number,
): ScorePop {
  return { x, y, value, age: 0, lifetime: 0.8 }
}

export function updateScorePops(pops: ScorePop[], delta: number) {
  return pops
    .map((pop) => ({ ...pop, age: pop.age + delta }))
    .filter((pop) => pop.age < pop.lifetime)
}

export function drawScorePops(
  ctx: CanvasRenderingContext2D,
  pops: ScorePop[],
  cameraX: number,
) {
  pops.forEach((pop) => {
    const t = pop.age / pop.lifetime
    const yOffset = -t * 22
    const alpha = 1 - t
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = '#ffe9f3'
    ctx.strokeStyle = '#1b102c'
    ctx.lineWidth = 3
    ctx.font = '18px "Segoe UI", sans-serif'
    ctx.textAlign = 'center'
    const screenX = pop.x - cameraX
    const screenY = pop.y + yOffset
    ctx.strokeText(`+${pop.value}`, screenX, screenY)
    ctx.fillText(`+${pop.value}`, screenX, screenY)
    ctx.restore()
  })
}
