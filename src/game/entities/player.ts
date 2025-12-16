import { moveWithCollisions } from '../../engine/collision'
import type { Input } from '../../engine/input'
import { GameConfig } from '../config'
import type { DynamicBody, Rect } from './types'

export class Player {
  body: DynamicBody
  onGround = false
  facing: 1 | -1 = 1
  private spawn: { x: number; y: number }
  private coyoteTimer = 0
  private jumpBufferTimer = 0
  private jumpHoldTimer = 0

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
    this.coyoteTimer = 0
    this.jumpBufferTimer = 0
    this.jumpHoldTimer = 0
  }

  update(delta: number, input: Input, solids: Rect[]) {
    this.coyoteTimer = Math.max(0, this.coyoteTimer - delta)
    this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - delta)

    const direction =
      (input.isHeld('left') ? -1 : 0) + (input.isHeld('right') ? 1 : 0)

    this.body.vx = direction * GameConfig.moveSpeed
    if (direction !== 0) {
      this.facing = direction > 0 ? 1 : -1
    }

    if (input.consumePress('jump')) {
      this.jumpBufferTimer = GameConfig.jumpBufferTime
    }

    const canJump = (this.onGround || this.coyoteTimer > 0) && this.jumpBufferTimer > 0
    if (canJump) {
      this.body.vy = -GameConfig.jumpVelocity
      this.onGround = false
      this.coyoteTimer = 0
      this.jumpBufferTimer = 0
      this.jumpHoldTimer = GameConfig.jumpHoldDuration
    }

    if (
      this.jumpHoldTimer > 0 &&
      input.isHeld('jump') &&
      this.body.vy < 0
    ) {
      this.body.vy -= GameConfig.jumpHoldBoost * delta
      this.jumpHoldTimer -= delta
    } else {
      this.jumpHoldTimer = 0
    }

    this.body.vy += GameConfig.gravity * delta
    const result = moveWithCollisions(this.body, solids, delta)
    this.onGround = result.grounded

    if (this.onGround) {
      this.coyoteTimer = GameConfig.coyoteTime
      this.jumpHoldTimer = 0
    }
  }

  applyBounce(strength: number) {
    this.body.vy = -strength
    this.onGround = false
    this.coyoteTimer = 0
    this.jumpHoldTimer = GameConfig.jumpHoldDuration * 0.6
  }
}
