import { GameConfig } from '../game/config'

export class MultiCamera {
  x = 0
  scale = 1
  private viewportWidth: number
  private levelWidth: number

  constructor(viewportWidth: number, levelWidth: number) {
    this.viewportWidth = viewportWidth
    this.levelWidth = levelWidth
  }

  follow(targets: { x: number; width: number }[], delta: number) {
    if (targets.length === 0) return
    const minX = Math.min(...targets.map((t) => t.x))
    const maxX = Math.max(...targets.map((t) => t.x + t.width))
    const mid = (minX + maxX) / 2

    const desiredWidth = maxX - minX + GameConfig.cameraPadding * 2
    const scale = clamp(
      this.viewportWidth / desiredWidth,
      GameConfig.cameraMinScale,
      GameConfig.cameraMaxScale,
    )
    const desiredScale = scale
    this.scale += (desiredScale - this.scale) * clamp(delta * 6, 0, 1)

    const viewWidth = this.viewportWidth / this.scale
    const desiredX = clamp(
      mid - viewWidth / 2,
      0,
      Math.max(0, this.levelWidth - viewWidth),
    )
    this.x += (desiredX - this.x) * clamp(delta * 6, 0, 1)
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}
