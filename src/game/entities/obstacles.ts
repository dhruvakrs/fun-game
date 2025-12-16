import type {
  Boulder,
  BoulderDef,
  FireBar,
  FireBarDef,
  Rect,
} from './types'

export function spawnBoulder(def: BoulderDef): Boulder {
  return {
    x: def.x,
    y: def.y,
    width: def.size,
    height: def.size,
    vx: def.speed,
    vy: 0,
    range: { min: def.range[0], max: def.range[1] },
    speed: def.speed,
    rotation: 0,
  }
}

export function updateBoulders(boulders: Boulder[], delta: number) {
  boulders.forEach((boulder) => {
    boulder.x += boulder.vx * delta
    if (boulder.x < boulder.range.min) {
      boulder.x = boulder.range.min
      boulder.vx = boulder.speed
    } else if (boulder.x + boulder.width > boulder.range.max) {
      boulder.x = boulder.range.max - boulder.width
      boulder.vx = -boulder.speed
    }
    const spinDir = boulder.vx >= 0 ? 1 : -1
    boulder.rotation += spinDir * delta * 5
  })
}

export function spawnFireBar(def: FireBarDef): FireBar {
  return {
    x: def.x,
    y: def.y,
    length: def.length,
    radius: def.radius ?? 10,
    angle: 0,
    speed: def.speed,
  }
}

export function updateFireBars(fireBars: FireBar[], delta: number) {
  fireBars.forEach((bar) => {
    bar.angle += bar.speed * delta
  })
}

export function fireBarHits(bar: FireBar, rect: Rect) {
  const segments = 5
  for (let i = 1; i <= segments; i++) {
    const distance = (bar.length / segments) * i
    if (
      circleIntersectsRect(
        bar.x + Math.cos(bar.angle) * distance,
        bar.y + Math.sin(bar.angle) * distance,
        bar.radius,
        rect,
      )
    ) {
      return true
    }
    if (
      circleIntersectsRect(
        bar.x - Math.cos(bar.angle) * distance,
        bar.y - Math.sin(bar.angle) * distance,
        bar.radius,
        rect,
      )
    ) {
      return true
    }
  }
  return false
}

function circleIntersectsRect(
  cx: number,
  cy: number,
  radius: number,
  rect: Rect,
) {
  const closestX = clamp(cx, rect.x, rect.x + rect.width)
  const closestY = clamp(cy, rect.y, rect.y + rect.height)
  const dx = cx - closestX
  const dy = cy - closestY
  return dx * dx + dy * dy < radius * radius
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}
