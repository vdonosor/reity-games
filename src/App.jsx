import { useState } from "react";
import { Link } from "react-router-dom";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";

function App() {
  const [count, setCount] = useState(0);

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="max-w-xl w-full space-y-6">
        <div className="flex items-center gap-4">
          <a href="https://vite.dev" target="_blank" rel="noreferrer">
            <img src={viteLogo} className="h-10 w-10" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank" rel="noreferrer">
            <img src={reactLogo} className="h-10 w-10" alt="React logo" />
          </a>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight">Vite + React</h1>
        <div className="rounded-xl bg-card text-card-foreground shadow border border-border p-6 space-y-4">
          <button
            className="inline-flex items-center justify-center rounded-lg bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 font-medium shadow-sm transition-colors"
            onClick={() => setCount((count) => count + 1)}
          >
            count is {count}
          </button>
          <p className="text-sm text-muted-foreground">
            Edit <code className="font-mono">src/App.jsx</code> and save to test
            HMR
          </p>
          <div className="flex gap-2">
            <span className="inline-block h-6 w-6 rounded bg-secondary-500" />
            <span className="inline-block h-6 w-6 rounded bg-accent-500" />
            <span className="inline-block h-6 w-6 rounded bg-primary-500" />
          </div>
          <div>
            <Link
              to="/rpg-profiling"
              className="inline-flex items-center justify-center rounded-lg bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 font-medium shadow-sm"
            >
              Jugar Aventura Inmobiliaria
            </Link>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Click on the Vite and React logos to learn more
        </p>
      </div>
    </main>
  );
}

export default App;
