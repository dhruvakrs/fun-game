import { Redis } from '@upstash/redis'

type SignalMessage = {
  room: string
  from: string
  type: string
  data: unknown
}

const ROOM_TTL_SECONDS = 60 * 30 // 30 minutes
const MAX_MESSAGES = 128
const redis = createRedisClient()

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

  const url = new URL(req.url, 'http://localhost')
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

    const message: SignalMessage = {
      room,
      from: body.from,
      type: body.type,
      data: body.data,
    }

    // Append to the room list and keep it capped
    await redis.rpush(roomKey(room), JSON.stringify(message))
    await redis.ltrim(roomKey(room), -MAX_MESSAGES, -1)
    await redis.expire(roomKey(room), ROOM_TTL_SECONDS)

    return new Response(JSON.stringify({ ok: true }), {
      headers: corsHeaders,
    })
  }

  if (req.method === 'GET') {
    const rawList =
      ((await redis.lrange<string | SignalMessage>(roomKey(room), 0, -1)) ??
        []) as Array<string | SignalMessage>
    const parsed = rawList
      .map((item) => {
        if (typeof item === 'string') {
          try {
            return JSON.parse(item) as SignalMessage
          } catch {
            return null
          }
        }
        return item as SignalMessage
      })
      .filter((m): m is SignalMessage => Boolean(m))

    // Deliver messages not sent by this peer; keep only messages from this peer
    const messages = parsed.filter((m) => m.from !== peer)
    const remaining = parsed.filter((m) => m.from === peer)

    if (messages.length > 0 || remaining.length !== parsed.length) {
      await redis.del(roomKey(room))
      if (remaining.length > 0) {
        await redis.rpush(
          roomKey(room),
          ...remaining.map((m) => JSON.stringify(m)),
        )
        await redis.ltrim(roomKey(room), -MAX_MESSAGES, -1)
        await redis.expire(roomKey(room), ROOM_TTL_SECONDS)
      }
    }

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
  runtime: 'edge',
  regions: ['iad1'],
}

function roomKey(room: string) {
  return `signal:room:${room}`
}

function createRedisClient() {
  const url = (process.env.UPSTASH_REDIS_REST_URL ?? '').trim()
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN ?? '').trim()
  if (!url || !token) {
    throw new Error('Missing Upstash Redis configuration')
  }
  return new Redis({ url, token })
}
