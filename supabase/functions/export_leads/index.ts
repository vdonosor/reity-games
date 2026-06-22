// Edge Function: export_leads
// Descarga un CSV con todos los leads del día (o rango). Solo admin.
// Protegido con VITE_ADMIN_PASSWORD vía header X-Admin-Password.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-password',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: CORS })
  }

  // Verificar contraseña admin
  const adminPassword = Deno.env.get('ADMIN_PASSWORD')
  const requestPassword = req.headers.get('x-admin-password')

  if (!adminPassword || requestPassword !== adminPassword) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const url = new URL(req.url)
  const today = new Date().toISOString().slice(0, 10)
  const day = url.searchParams.get('day') ?? today

  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return new Response(JSON.stringify({ error: 'Invalid day format. Use YYYY-MM-DD.' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Obtener leads del día con su mejor puntaje
  const { data, error } = await supabase
    .from('leads')
    .select(`
      nombre,
      rut,
      email,
      created_at,
      game_sessions (
        server_score,
        valid,
        ended_at
      )
    `)
    .eq('event_day', day)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('export_leads query:', error)
    return new Response(JSON.stringify({ error: 'Query failed' }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  // Construir CSV
  const rows: string[][] = []
  rows.push(['Nombre', 'RUT', 'Email', 'Mejor Puntaje', 'Partidas', 'Registrado'])

  for (const lead of data ?? []) {
    const sessions = (lead.game_sessions as Array<{ server_score: number; valid: boolean }>) ?? []
    const validSessions = sessions.filter((s) => s.valid)
    const bestScore = validSessions.length > 0
      ? Math.max(...validSessions.map((s) => s.server_score))
      : 0
    const totalGames = sessions.length
    const registeredAt = new Date(lead.created_at).toLocaleString('es-CL', { timeZone: 'America/Santiago' })

    rows.push([
      csvEscape(lead.nombre),
      csvEscape(lead.rut),
      csvEscape(lead.email),
      String(bestScore),
      String(totalGames),
      registeredAt,
    ])
  }

  const csv = rows.map((r) => r.join(',')).join('\r\n')
  const filename = `leads_${day}.csv`

  return new Response(csv, {
    status: 200,
    headers: {
      ...CORS,
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
})

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
