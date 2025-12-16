export class Camera {
  x = 0
  private viewportWidth: number
  private levelWidth: number

  constructor(viewportWidth: number, levelWidth: number) {
    this.viewportWidth = viewportWidth
    this.levelWidth = levelWidth
  }

  follow(targetX: number, delta: number) {
    const center = this.viewportWidth / 2
    const desired = clamp(targetX - center, 0, Math.max(0, this.levelWidth - this.viewportWidth))
    const smoothing = clamp(delta * 6, 0, 1)
    this.x += (desired - this.x) * smoothing
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}
