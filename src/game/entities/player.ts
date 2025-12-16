import { moveWithCollisions } from '../../engine/collision'
import type { Input } from '../../engine/input'
import { GameConfig } from '../config'
import type { DynamicBody, Rect } from './types'

export class Player {
  body: DynamicBody
  onGround = false
  facing: 1 | -1 = 1
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

    this.body.vx = direction * GameConfig.moveSpeed
    if (direction !== 0) {
      this.facing = direction > 0 ? 1 : -1
    }

    if (this.onGround && input.consumePress('jump')) {
      this.body.vy = -GameConfig.jumpVelocity
      this.onGround = false
    }

    this.body.vy += GameConfig.gravity * delta
    const result = moveWithCollisions(this.body, solids, delta)
    this.onGround = result.grounded
  }
}
