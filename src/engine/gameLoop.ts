export type LoopCallbacks = {
  update: (delta: number) => void
  render: () => void
}

export class GameLoop {
  private lastTime = 0
  private rafId: number | null = null
  private callbacks: LoopCallbacks

  constructor(callbacks: LoopCallbacks) {
    this.callbacks = callbacks
  }

  start() {
    this.lastTime = performance.now()
    const tick = (time: number) => {
      const delta = Math.min((time - this.lastTime) / 1000, 1 / 15)
      this.lastTime = time
      this.callbacks.update(delta)
      this.callbacks.render()
      this.rafId = requestAnimationFrame(tick)
    }

    this.rafId = requestAnimationFrame(tick)
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
    }
  }
}
