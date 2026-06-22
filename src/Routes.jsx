import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import App from "./App.jsx";

const RPGProfiling = lazy(() => import("./games/rpg-profiling/index.jsx"));
const TokenStack = lazy(() => import("./games/token-stack/index.jsx"));

function GameLoader() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-950">
      <div className="text-green-400 text-sm font-medium animate-pulse">Cargando...</div>
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<GameLoader />}>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/rpg-profiling" element={<RPGProfiling />} />
        <Route path="/token-stack" element={<TokenStack />} />
        <Route path="/token-stack/admin" element={<TokenStack />} />
      </Routes>
    </Suspense>
  );
}
