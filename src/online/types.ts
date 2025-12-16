export type SessionMode = 'local' | 'online-host' | 'online-guest'

export type SignalMessage =
  | { type: 'offer'; sdp: RTCSessionDescriptionInit }
  | { type: 'answer'; sdp: RTCSessionDescriptionInit }
  | { type: 'candidate'; candidate: RTCIceCandidateInit }

export type NetworkState = {
  players: Array<{
    x: number
    y: number
    vx: number
    vy: number
    onGround: boolean
    facing: 1 | -1
    lives: number
    reachedGoal: boolean
  }>
  coins: boolean[]
  bouncePads: number[]
  boulders: Array<{ x: number; y: number; rotation: number }>
  fireBars: Array<{ angle: number }>
  enemies: Array<{ x: number; y: number; type: string; dir: 1 | -1 }>
  score: number
  coinsCount: number
  levelIndex: number
  status: string
}

export type RemoteInputPayload = {
  held: { left: boolean; right: boolean; jump: boolean }
  pressedJump: boolean
}
