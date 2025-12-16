import { moveWithCollisions } from '../engine/collision'
import type { Input } from '../engine/input'
import type { DynamicBody, Rect } from './entities'

const MOVE_SPEED = 260
const JUMP_SPEED = 620
const GRAVITY = 1700

export class Player {
  body: DynamicBody
  onGround = false
  private spawn: { x: number; y: number }

  constructor(spawn: { x: number; y: number }) {
    this.spawn = { ...spawn }
    this.body = {
      x: spawn.x,
      y: spawn.y,
      width: 26,
      height: 30,
      vx: 0,
      vy: 0,
    }
  }

  reset(position = this.spawn) {
    this.body.x = position.x
    this.body.y = position.y
    this.body.vx = 0
    this.body.vy = 0
    this.onGround = false
  }

  update(delta: number, input: Input, solids: Rect[]) {
    const direction =
      (input.isHeld('left') ? -1 : 0) + (input.isHeld('right') ? 1 : 0)

    this.body.vx = direction * MOVE_SPEED

    if (this.onGround && input.consumePress('jump')) {
      this.body.vy = -JUMP_SPEED
      this.onGround = false
    }

    this.body.vy += GRAVITY * delta
    const result = moveWithCollisions(this.body, solids, delta)
    this.onGround = result.grounded
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#ffde59'
    ctx.fillRect(this.body.x, this.body.y, this.body.width, this.body.height)

    ctx.fillStyle = '#2e2a47'
    ctx.fillRect(this.body.x + 6, this.body.y + 8, 4, 4)
    ctx.fillRect(
      this.body.x + this.body.width - 10,
      this.body.y + 8,
      4,
      4,
    )

    ctx.fillStyle = '#f87272'
    ctx.fillRect(
      this.body.x + this.body.width / 2 - 6,
      this.body.y + this.body.height - 8,
      12,
      6,
    )
  }
}
