type SignalPostBody = {
  room: string
  from: string
  type: string
  data: unknown
}

export class SignalClient {
  private room: string
  private peerId: string
  private baseUrl: string

  constructor(room: string, peerId: string, baseUrl = '/api/signal') {
    this.room = room
    this.peerId = peerId
    this.baseUrl = baseUrl
  }

  async post(message: SignalPostBody) {
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(message),
    })
    if (!res.ok) {
      throw new Error(`Signal post failed: ${res.status}`)
    }
  }

  async fetchMessages() {
    const res = await fetch(
      `${this.baseUrl}?room=${encodeURIComponent(this.room)}&peer=${encodeURIComponent(this.peerId)}`,
    )
    if (!res.ok) {
      throw new Error(`Signal fetch failed: ${res.status}`)
    }
    const json = (await res.json()) as { messages: SignalPostBody[] }
    return json.messages
  }
}
