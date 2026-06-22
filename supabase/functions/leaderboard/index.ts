// Edge Function: leaderboard
// Devuelve el top 20 del día (o del día especificado como query param).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: CORS })
  }

  const url = new URL(req.url)
  const today = new Date().toISOString().slice(0, 10)
  const day = url.searchParams.get('day') ?? today
  const limit = Math.min(Number(url.searchParams.get('limit') ?? '20'), 50)

  // Validar formato de fecha para evitar injection
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return json({ error: 'Invalid day format. Use YYYY-MM-DD.' }, 400)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: sessions, error } = await supabase
    .from('game_sessions')
    .select('id, server_score, ended_at, lead_id')
    .eq('valid', true)
    .not('ended_at', 'is', null)
    .eq('event_day', day)
    .order('server_score', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('leaderboard query:', error)
    return json({ error: 'Query failed' }, 500)
  }

  if (!sessions || sessions.length === 0) {
    return json({ day, entries: [] })
  }

  const leadIds = sessions.map((s: { lead_id: string }) => s.lead_id)
  const { data: leads } = await supabase
    .from('leads')
    .select('id, nombre')
    .in('id', leadIds)

  const leadMap: Record<string, string> = {}
  for (const l of leads ?? []) {
    leadMap[l.id] = l.nombre
  }

  const entries = sessions.map((s: { id: string; server_score: number; ended_at: string; lead_id: string }, i: number) => ({
    rank: i + 1,
    nombre: leadMap[s.lead_id] ?? '?',
    score: s.server_score,
    ended_at: s.ended_at,
  }))

  return json({ day, entries })
})

// deno-lint-ignore no-explicit-any
function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
