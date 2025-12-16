import type { BouncePad } from './types'

export function tickBouncePads(pads: BouncePad[], delta: number) {
  pads.forEach((pad) => {
    pad.squash = Math.max(0, pad.squash - delta * 4)
    pad.cooldown = Math.max(0, pad.cooldown - delta)
  })
}
