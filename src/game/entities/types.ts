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

export interface Boulder extends DynamicBody {
  range: { min: number; max: number }
  speed: number
  rotation: number
}

export interface FireBar {
  x: number
  y: number
  length: number
  radius: number
  angle: number
  speed: number
}

export type EnemyType = 'turtle' | 'slime' | 'bird'

export interface Enemy {
  type: EnemyType
  body: DynamicBody
  dir: 1 | -1
  speed: number
  range: { min: number; max: number }
  baseY: number
  animTimer: number
  hopTimer?: number
}

export type BoulderDef = {
  x: number
  y: number
  size: number
  speed: number
  range: [number, number]
}

export type FireBarDef = {
  x: number
  y: number
  length: number
  speed: number
  radius?: number
}

export type EnemyDef = {
  type: EnemyType
  x: number
  y: number
  range: [number, number]
  speed: number
  hopInterval?: number
}
