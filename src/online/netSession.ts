import type { InputProfile } from '../engine/input'
import { SignalClient } from './signalClient'
import type { NetworkState, RemoteInputPayload, SessionMode } from './types'

type SessionEvents = {
  onConnected?: () => void
  onState?: (state: NetworkState) => void
  onError?: (err: Error) => void
}

export class RemoteInputAdapter {
  held = { left: false, right: false, jump: false }
  pressedJump = false

  setPayload(payload: RemoteInputPayload) {
    this.held = payload.held
    if (payload.pressedJump) {
      this.pressedJump = true
    }
  }

  isHeld(action: 'left' | 'right' | 'jump') {
    return this.held[action]
  }

  consumePress(action: 'jump') {
    if (action !== 'jump') return false
    if (this.pressedJump) {
      this.pressedJump = false
      return true
    }
    return false
  }

  toProfile(): InputProfile {
    return {
      isHeld: (action) =>
        action === 'left'
          ? this.held.left
          : action === 'right'
            ? this.held.right
            : action === 'jump'
              ? this.held.jump
              : false,
      consumePress: (action) => (action === 'jump' ? this.consumePress('jump') : false),
    }
  }
}

const CONNECTION_TIMEOUT_MS = 30000 // 30 seconds for guests
const POLLING_INTERVAL_MS = 700
const STATE_SEND_INTERVAL_S = 0.1

export class NetSession {
  private pc: RTCPeerConnection | null = null
  private dc: RTCDataChannel | null = null
  private signal: SignalClient
  private polling = false
  private events: SessionEvents
  private mode: SessionMode
  private peerId: string
  private stateSendTimer = 0

  remoteInput = new RemoteInputAdapter()
  connected = false
  roomCode: string

  constructor(
    roomCode: string,
    peerId: string,
    mode: SessionMode,
    events: SessionEvents,
  ) {
    this.roomCode = roomCode
    this.peerId = peerId
    this.mode = mode
    this.signal = new SignalClient(roomCode, peerId)
    this.events = events
  }

  async startHost() {
    this.pc = this.createPeer()
    this.dc = this.pc.createDataChannel('game')
    this.attachChannel(this.dc)
    const offer = await this.pc.createOffer()
    await this.pc.setLocalDescription(offer)
    await this.signal.post({
      room: this.roomCode,
      from: this.peerId,
      type: 'offer',
      data: offer,
    })
    this.startPolling()
  }

  async startGuest() {
    this.pc = this.createPeer()
    this.startPolling()
  }

  tickHost(delta: number, stateFactory: () => NetworkState) {
    if (!this.connected || !this.dc || this.dc.readyState !== 'open') return
    this.stateSendTimer += delta
    if (this.stateSendTimer > STATE_SEND_INTERVAL_S) {
      this.stateSendTimer = 0
      this.send({ type: 'state', payload: stateFactory() })
    }
  }

  sendInput(payload: RemoteInputPayload) {
    this.send({ type: 'input', payload })
  }

  private send(message: unknown) {
    if (!this.dc || this.dc.readyState !== 'open') return
    this.dc.send(JSON.stringify(message))
  }

  private async startPolling() {
    if (this.polling) return
    this.polling = true
    const startTime = Date.now()
    while (this.polling) {
      try {
        const messages = await this.signal.fetchMessages()
        for (const msg of messages) {
          await this.handleSignal(msg)
        }
      } catch (err) {
        this.events.onError?.(
          err instanceof Error ? err : new Error('Signal error'),
        )
      }
      if (
        !this.connected &&
        this.mode === 'online-guest' &&
        Date.now() - startTime > CONNECTION_TIMEOUT_MS
      ) {
        this.events.onError?.(new Error('Connection timeout'))
        this.polling = false
        break
      }
      await wait(POLLING_INTERVAL_MS)
    }
  }

  private async handleSignal(msg: { type: string; data: any; from: string }) {
    if (!this.pc) return
    if (msg.type === 'offer' && this.mode === 'online-guest') {
      await this.pc.setRemoteDescription(new RTCSessionDescription(msg.data))
      const answer = await this.pc.createAnswer()
      await this.pc.setLocalDescription(answer)
      await this.signal.post({
        room: this.roomCode,
        from: this.peerId,
        type: 'answer',
        data: answer,
      })
    } else if (msg.type === 'answer' && this.mode === 'online-host') {
      if (!this.pc.currentRemoteDescription) {
        await this.pc.setRemoteDescription(
          new RTCSessionDescription(msg.data),
        )
      }
    } else if (msg.type === 'candidate') {
      await this.pc.addIceCandidate(new RTCIceCandidate(msg.data))
    }
  }

  private attachChannel(channel: RTCDataChannel) {
    channel.onopen = () => {
      this.connected = true
      this.events.onConnected?.()
    }
    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'state') {
          this.events.onState?.(data.payload as NetworkState)
        } else if (data.type === 'input' && this.mode === 'online-host') {
          this.remoteInput.setPayload(data.payload as RemoteInputPayload)
        }
      } catch (err) {
        this.events.onError?.(
          err instanceof Error ? err : new Error('Channel parse error'),
        )
      }
    }
    channel.onerror = (event) => {
      this.events.onError?.(
        event instanceof ErrorEvent
          ? new Error(event.message)
          : new Error('Data channel error'),
      )
    }
  }

  private createPeer() {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    })
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        await this.signal.post({
          room: this.roomCode,
          from: this.peerId,
          type: 'candidate',
          data: event.candidate,
        })
      }
    }
    pc.ondatachannel = (event) => {
      this.dc = event.channel
      this.attachChannel(this.dc)
    }
    return pc
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
