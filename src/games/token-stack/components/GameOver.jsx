export function GameOver({ score, serverScore, valid, rankToday, top5, onRestart, loading }) {
  const displayScore = valid ? serverScore : score;

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/95 px-5 z-10"
      data-testid="game-over"
    >
      <div className="w-full max-w-sm text-center space-y-6">
        <div>
          <p className="text-green-400 text-xs font-semibold tracking-widest uppercase">Reity SpA</p>
          <h2 className="text-white text-4xl font-extrabold mt-1">Game Over</h2>
        </div>

        <div className="bg-gray-800 rounded-2xl p-6">
          <p className="text-gray-400 text-sm">Tu puntaje</p>
          <p
            className="text-green-400 text-6xl font-black leading-none mt-1"
            data-testid="final-score"
          >
            {displayScore}
          </p>
          <span
            data-testid="score-valid"
            data-valid={valid ? 'true' : 'false'}
            className="sr-only"
          >
            {valid ? 'válido' : 'inválido'}
          </span>

          {!valid && (
            <p className="text-yellow-400 text-xs mt-2">Récord personal (no entró al ranking)</p>
          )}
          {valid && rankToday != null && (
            <p className="text-gray-400 text-sm mt-2">
              Posición #{rankToday} del día
            </p>
          )}
        </div>

        {top5 && top5.length > 0 && (
          <div className="bg-gray-800 rounded-2xl p-4 text-left">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Top del día</p>
            <ol className="space-y-2">
              {top5.map((entry, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">
                    <span className="text-green-400 font-bold mr-2">#{i + 1}</span>
                    {entry.nombre}
                  </span>
                  <span className="text-white font-bold text-sm">{entry.score}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <button
          onClick={onRestart}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl text-lg transition-colors"
        >
          {loading ? 'Guardando...' : 'Volver a jugar'}
        </button>
      </div>
    </div>
  );
}
