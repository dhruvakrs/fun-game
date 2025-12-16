import type { DynamicBody, Rect } from '../game/entities'

export function intersects(a: Rect, b: Rect) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
}

export function moveWithCollisions(
  body: DynamicBody,
  solids: Rect[],
  delta: number,
) {
  let grounded = false

  body.x += body.vx * delta
  for (const solid of solids) {
    if (!intersects(body, solid)) continue
    if (body.vx > 0) {
      body.x = solid.x - body.width
    } else if (body.vx < 0) {
      body.x = solid.x + solid.width
    }
    body.vx = 0
  }

  body.y += body.vy * delta
  for (const solid of solids) {
    if (!intersects(body, solid)) continue
    if (body.vy > 0) {
      body.y = solid.y - body.height
      grounded = true
    } else if (body.vy < 0) {
      body.y = solid.y + solid.height
    }
    body.vy = 0
  }

  return { grounded }
}
