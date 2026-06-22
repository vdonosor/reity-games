import { Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import RPGProfiling from "./games/rpg-profiling/index.jsx";
import TokenStack from "./games/token-stack/index.jsx";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/rpg-profiling" element={<RPGProfiling />} />
      <Route path="/token-stack" element={<TokenStack />} />
      <Route path="/token-stack/admin" element={<TokenStack />} />
    </Routes>
  );
}
