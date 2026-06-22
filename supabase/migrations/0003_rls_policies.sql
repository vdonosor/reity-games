-- Row Level Security para Token Stack

-- Habilitar RLS en todas las tablas sensibles
ALTER TABLE leads        ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_events   ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- leads: solo service_role puede leer/escribir
-- (los leads contienen RUT y email — nunca exponer al cliente)

DROP POLICY IF EXISTS "leads_service_role_only" ON leads;
CREATE POLICY "leads_service_role_only" ON leads
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ----------------------------------------------------------------
-- game_events: solo service_role
DROP POLICY IF EXISTS "game_events_service_role_only" ON game_events;
CREATE POLICY "game_events_service_role_only" ON game_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ----------------------------------------------------------------
-- game_sessions: service_role puede todo; anon puede leer columnas no sensibles
DROP POLICY IF EXISTS "game_sessions_service_role_all"  ON game_sessions;
DROP POLICY IF EXISTS "game_sessions_anon_read_public"  ON game_sessions;

CREATE POLICY "game_sessions_service_role_all" ON game_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Anon solo puede leer id y server_score de sesiones válidas
-- (usado indirectamente vía la vista materializada)
CREATE POLICY "game_sessions_anon_read_public" ON game_sessions
  FOR SELECT
  TO anon
  USING (valid = true AND ended_at IS NOT NULL);

-- ----------------------------------------------------------------
-- daily_leaderboard (vista materializada): lectura pública
-- La vista ya no expone RUT ni email
GRANT SELECT ON daily_leaderboard TO anon;
GRANT SELECT ON daily_leaderboard TO authenticated;
