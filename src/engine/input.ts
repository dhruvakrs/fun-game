type Action = 'left' | 'right' | 'jump' | 'start' | 'restart'

const keyBindings: Record<string, Action> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  a: 'left',
  d: 'right',
  A: 'left',
  D: 'right',
  ' ': 'jump',
  Spacebar: 'jump',
  Enter: 'start',
  e: 'start',
  E: 'start',
  r: 'restart',
  R: 'restart',
}

export class Input {
  private held = new Set<Action>()
  private pressed = new Set<Action>()

  constructor() {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
  }

  isHeld(action: Action) {
    return this.held.has(action)
  }

  consumePress(action: Action) {
    if (this.pressed.has(action)) {
      this.pressed.delete(action)
      return true
    }
    return false
  }

  private onKeyDown = (event: KeyboardEvent) => {
    const action = keyBindings[event.key]
    if (!action) return
    this.held.add(action)
    this.pressed.add(action)
    if (['ArrowLeft', 'ArrowRight', ' ', 'Spacebar'].includes(event.key)) {
      event.preventDefault()
    }
  }

  private onKeyUp = (event: KeyboardEvent) => {
    const action = keyBindings[event.key]
    if (!action) return
    this.held.delete(action)
  }
}
