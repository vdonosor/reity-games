import { Routes, Route, Navigate } from "react-router-dom";
import App from "./App.jsx";
import RPGProfiling from "./games/rpg-profiling/index.jsx";

export function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/rpg-profiling" element={<RPGProfiling />} />
      </Routes>
    </>
  );
}
