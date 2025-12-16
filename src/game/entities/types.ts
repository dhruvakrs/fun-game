export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface DynamicBody extends Rect {
  vx: number
  vy: number
}

export interface Coin extends Rect {
  collected: boolean
}

export interface Hazard extends Rect {}

export interface Goal extends Rect {}

export interface BouncePad extends Rect {
  squash: number
  cooldown: number
}
