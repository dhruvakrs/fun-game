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
