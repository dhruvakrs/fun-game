type SignalMessage = {
  room: string
  from: string
  type: string
  data: unknown
}

type Store = Map<string, SignalMessage[]>

// In-memory, best-effort store. Suitable for demos on Vercel or local dev.
const getStore = (): Store => {
  const g = globalThis as unknown as { __signalStore?: Store }
  if (!g.__signalStore) {
    g.__signalStore = new Map()
  }
  return g.__signalStore
}

export default async function handler(req: Request): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  }

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  const url = new URL(req.url)
  const room = url.searchParams.get('room') ?? ''
  const peer = url.searchParams.get('peer') ?? ''

  if (!room) {
    return new Response(JSON.stringify({ error: 'missing room' }), {
      status: 400,
      headers: corsHeaders,
    })
  }

  if (req.method === 'POST') {
    const body = (await req.json()) as Partial<SignalMessage>
    if (!body.type || !body.from) {
      return new Response(JSON.stringify({ error: 'invalid body' }), {
        status: 400,
        headers: corsHeaders,
      })
    }
    const store = getStore()
    const existing = store.get(room) ?? []
    existing.push({
      room,
      from: body.from,
      type: body.type,
      data: body.data,
    })
    store.set(room, existing.slice(-64)) // keep last 64 messages
    return new Response(JSON.stringify({ ok: true }), {
      headers: corsHeaders,
    })
  }

  if (req.method === 'GET') {
    const store = getStore()
    const all = store.get(room) ?? []
    const messages = all.filter((m) => m.from !== peer)
    store.set(
      room,
      all.filter((m) => m.from === peer),
    )
    return new Response(JSON.stringify({ messages }), {
      headers: corsHeaders,
    })
  }

  return new Response('Method Not Allowed', {
    status: 405,
    headers: corsHeaders,
  })
}

export const config = {
  runtime: 'nodejs',
  regions: ['iad1'],
}
