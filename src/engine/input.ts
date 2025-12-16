export type Action = 'left' | 'right' | 'jump' | 'start' | 'restart' | 'action'

export type ControlScheme = {
  left: string[]
  right: string[]
  jump: string[]
  action?: string[]
}

export type InputProfile = {
  isHeld: (action: Action) => boolean
  consumePress: (action: Action) => boolean
}

export class Input {
  private heldKeys = new Set<string>()
  private pressedKeys = new Set<string>()

  registerProfile(scheme: ControlScheme): InputProfile {
    return {
      isHeld: (action) => this.isActionHeld(action, scheme),
      consumePress: (action) => this.consumeActionPress(action, scheme),
    }
  }

  constructor() {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
  }

  isHeld(action: Action) {
    return this.heldKeys.has(action)
  }

  consumePress(action: Action) {
    if (this.pressedKeys.has(action)) {
      this.pressedKeys.delete(action)
      return true
    }
    return false
  }

  private isActionHeld(action: Action, scheme: ControlScheme) {
    const keys = this.keysForAction(action, scheme)
    return keys.some((key) => this.heldKeys.has(key))
  }

  private consumeActionPress(action: Action, scheme: ControlScheme) {
    const keys = this.keysForAction(action, scheme)
    const hit = keys.some((key) => this.pressedKeys.has(key))
    if (hit) {
      keys.forEach((key) => this.pressedKeys.delete(key))
    }
    return hit
  }

  private keysForAction(action: Action, scheme: ControlScheme) {
    if (action === 'left') return scheme.left
    if (action === 'right') return scheme.right
    if (action === 'jump') return scheme.jump
    if (action === 'action') return scheme.action ?? []
    return []
  }

  private onKeyDown = (event: KeyboardEvent) => {
    this.heldKeys.add(event.code)
    this.pressedKeys.add(event.code)
  }

  private onKeyUp = (event: KeyboardEvent) => {
    this.heldKeys.delete(event.code)
  }

  consumeKey(code: string) {
    if (this.pressedKeys.has(code)) {
      this.pressedKeys.delete(code)
      return true
    }
    return false
  }

  isKeyHeld(code: string) {
    return this.heldKeys.has(code)
  }
}
