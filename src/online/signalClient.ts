type SignalPostBody = {
  room: string
  from: string
  type: string
  data: unknown
}

export class SignalClient {
  constructor(
    private room: string,
    private peerId: string,
    private baseUrl = '/api/signal',
  ) {}

  async post(message: SignalPostBody) {
    await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(message),
    })
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
