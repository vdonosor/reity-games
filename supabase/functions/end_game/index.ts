// Edge Function: end_game
// Recibe lead + eventos del cliente, recalcula el score server-side y guarda todo.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Replica del motor del cliente para anti-cheat básico.
// Con el sistema de 3 vidas: los miss no terminan el juego hasta el 3er fallo.
function recalculateScore(events: Array<{ type: string; result?: string }>): number {
  let score = 0
  let lives = 3
  for (const e of events) {
    if (e.type !== 'place_block') continue
    if (e.result === 'miss') {
      lives--
      if (lives <= 0) break  // 3er miss = game over
      continue
    }
    score += e.result === 'perfect' ? 5 : 1
  }
  return score
}

// RUT sintético derivado del email (determinista, evita colisiones con RUTs reales)
function syntheticRut(email: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < email.length; i++) {
    h = Math.imul(h ^ email.charCodeAt(i), 0x01000193) >>> 0
  }
  return `em_${h.toString(16)}`
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: CORS })
  }

  // deno-lint-ignore no-explicit-any
  let body: any
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const { lead, client_score, events = [], seed, client_ts } = body

  if (!lead?.nombre || !lead?.email) {
    return json({ error: 'Missing lead data' }, 400)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Si no viene RUT (form simplificado), generamos uno sintético del email.
  const rut = lead.rut || syntheticRut(lead.email)

  // 1. Upsert lead — evita duplicados por RUT.
  const { data: leadRow, error: leadErr } = await supabase
    .from('leads')
    .upsert(
      { rut, nombre: lead.nombre, email: lead.email, consent: true },
      { onConflict: 'rut' }
    )
    .select('id')
    .single()

  if (leadErr || !leadRow) {
    console.error('lead upsert:', leadErr)
    return json({ error: 'Failed to save lead' }, 500)
  }

  // 2. Recalcular score server-side y comparar con lo que reportó el cliente.
  const server_score = recalculateScore(events)
  const valid = server_score === client_score

  // 3. Insertar sesión de juego.
  const { data: sessionRow, error: sessionErr } = await supabase
    .from('game_sessions')
    .insert({
      lead_id: leadRow.id,
      client_score,
      server_score,
      valid,
      seed: seed ?? `ts-${client_ts ?? Date.now()}`,
      ended_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (sessionErr || !sessionRow) {
    console.error('session insert:', sessionErr)
    return json({ error: 'Failed to save session' }, 500)
  }

  // 4. Insertar eventos (best-effort — no falla la respuesta si falla esto).
  if (events.length > 0) {
    const rows = events.map((e: { ts?: number }, i: number) => ({
      session_id: sessionRow.id,
      seq: i,
      event_type: 'place_block',
      payload: e,
      client_ts: typeof e.ts === 'number' ? e.ts : 0,
    }))
    await supabase.from('game_events').insert(rows)
  }

  // 5. Top 5 del día (query sobre tablas base, sin depender de la vista materializada).
  const today = new Date().toISOString().slice(0, 10)

  const { data: topSessions } = await supabase
    .from('game_sessions')
    .select('server_score, lead_id')
    .eq('valid', true)
    .not('ended_at', 'is', null)
    .eq('event_day', today)
    .order('server_score', { ascending: false })
    .limit(5)

  // Resolver nombres de los leads del top 5.
  let top5: Array<{ nombre: string; score: number }> = []
  if (topSessions && topSessions.length > 0) {
    const leadIds = topSessions.map((s: { lead_id: string }) => s.lead_id)
    const { data: topLeads } = await supabase
      .from('leads')
      .select('id, nombre')
      .in('id', leadIds)

    const leadMap: Record<string, string> = {}
    for (const l of topLeads ?? []) {
      leadMap[l.id] = l.nombre
    }
    top5 = topSessions.map((s: { server_score: number; lead_id: string }) => ({
      nombre: leadMap[s.lead_id] ?? '?',
      score: s.server_score,
    }))
  }

  // 6. Rank del jugador actual hoy (solo si la partida es válida).
  let rank_today: number | null = null
  if (valid) {
    const { count } = await supabase
      .from('game_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('valid', true)
      .not('ended_at', 'is', null)
      .eq('event_day', today)
      .gt('server_score', server_score)

    rank_today = (count ?? 0) + 1
  }

  return json({ server_score, valid, rank_today, top5 })
})

// deno-lint-ignore no-explicit-any
function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
