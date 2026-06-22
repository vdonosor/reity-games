import { useState, useEffect, useCallback } from 'react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function useLeaderboard(authed) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!authed || !SUPABASE_URL || !SUPABASE_ANON_KEY) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/leaderboard?day=${today()}&limit=20`,
        { headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [authed]);

  useEffect(() => {
    if (!authed) return;
    refresh();
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [authed, refresh]);

  return { data, loading, error, refresh };
}

async function downloadLeads(password) {
  const res = await fetch(
    `${SUPABASE_URL}/functions/v1/export_leads?day=${today()}`,
    {
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'x-admin-password': password,
      },
    }
  );
  if (!res.ok) throw new Error(`Error ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `leads_${today()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminScreen() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  const { data, loading, error, refresh } = useLeaderboard(authed);

  function handleLogin(e) {
    e.preventDefault();
    if (!ADMIN_PASSWORD) {
      setAuthError('VITE_ADMIN_PASSWORD no configurado.');
      return;
    }
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
      setAuthError('');
    } else {
      setAuthError('Contraseña incorrecta.');
    }
  }

  async function handleDownload() {
    setDownloading(true);
    setDownloadError('');
    try {
      await downloadLeads(password || ADMIN_PASSWORD);
    } catch (e) {
      setDownloadError(e.message);
    } finally {
      setDownloading(false);
    }
  }

  if (!authed) {
    return (
      <div className="min-h-dvh bg-gray-950 flex items-center justify-center px-5">
        <form onSubmit={handleLogin} className="w-full max-w-xs space-y-4">
          <div className="text-center">
            <p className="text-green-400 text-xs font-semibold tracking-widest uppercase">Reity SpA</p>
            <h1 className="text-white text-2xl font-extrabold mt-1">Admin Panel</h1>
            <p className="text-gray-500 text-sm mt-1">Token Stack · {today()}</p>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña admin"
            className="w-full bg-gray-800 text-white border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500"
            autoFocus
          />
          {authError && <p className="text-red-400 text-sm">{authError}</p>}
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Entrar
          </button>
        </form>
      </div>
    );
  }

  const entries = data?.entries ?? [];
  return (
    <div className="min-h-dvh bg-gray-950 text-white px-4 py-6 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-green-400 text-xs font-semibold tracking-widest uppercase">Admin</p>
          <h1 className="text-white text-xl font-extrabold">Token Stack</h1>
          <p className="text-gray-500 text-xs">{today()}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refresh}
            disabled={loading}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? '...' : '↺'}
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="bg-green-700 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {downloading ? 'Descargando...' : 'CSV leads'}
          </button>
        </div>
      </div>

      {downloadError && (
        <p className="text-red-400 text-sm mb-4">{downloadError}</p>
      )}

      {/* Stats strip */}
      <div className="bg-gray-800 rounded-xl px-4 py-3 mb-6 flex gap-4">
        <div>
          <p className="text-gray-400 text-xs">Top jugador</p>
          <p className="text-white font-bold text-lg">
            {entries[0]?.score ?? '—'}
          </p>
        </div>
        <div className="border-l border-gray-700 pl-4">
          <p className="text-gray-400 text-xs">Jugadores rankeados</p>
          <p className="text-white font-bold text-lg">{entries.length}</p>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-gray-800 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-700">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
            Ranking del día (top {entries.length})
          </p>
        </div>

        {error && (
          <p className="text-red-400 text-sm p-4">{error}</p>
        )}
        {loading && entries.length === 0 && (
          <p className="text-gray-500 text-sm p-4 animate-pulse">Cargando...</p>
        )}
        {!loading && !error && entries.length === 0 && (
          <p className="text-gray-500 text-sm p-4">Sin partidas registradas hoy.</p>
        )}

        <ol>
          {entries.map((entry, i) => (
            <li
              key={i}
              className={`flex items-center justify-between px-4 py-3 ${
                i < entries.length - 1 ? 'border-b border-gray-700/50' : ''
              } ${i === 0 ? 'bg-gray-700/30' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold w-6 text-right ${i < 3 ? 'text-green-400' : 'text-gray-500'}`}>
                  #{entry.rank}
                </span>
                <span className="text-white text-sm">{entry.nombre}</span>
              </div>
              <span className="text-white font-black text-sm tabular-nums">{entry.score}</span>
            </li>
          ))}
        </ol>
      </div>

      <p className="text-gray-600 text-xs text-center mt-6">Actualiza automáticamente cada 30 s</p>
    </div>
  );
}
