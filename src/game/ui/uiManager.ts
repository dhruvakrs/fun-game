import type { GameState } from '../gameState'
import { drawHud } from './hud'
import { createScorePop, drawScorePops, updateScorePops } from './scorePop'
import type { ScorePop } from './types'
import { drawScreens } from './screens'

export class UIManager {
  private pops: ScorePop[] = []

  addScorePop(x: number, y: number, value: number) {
    this.pops.push(createScorePop(x, y, value))
  }

  update(delta: number) {
    this.pops = updateScorePops(this.pops, delta)
  }

  renderHud(
    ctx: CanvasRenderingContext2D,
    state: GameState,
    time: number,
    levelLabel: string,
  ) {
    drawHud(ctx, state, time, levelLabel)
  }

  renderScorePops(ctx: CanvasRenderingContext2D, cameraX: number) {
    drawScorePops(ctx, this.pops, cameraX)
  }

  renderScreens(
    ctx: CanvasRenderingContext2D,
    state: GameState,
    time: number,
    levelName: string,
    nextLevelName?: string,
  ) {
    drawScreens(ctx, state, time, levelName, nextLevelName)
  }
}
