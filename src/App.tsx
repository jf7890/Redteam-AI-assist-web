import React from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { useAppStore } from "./state/useAppStore";
import { SetupPage } from "./pages/SetupPage";
import { SessionPage } from "./pages/SessionPage";
import { AgentPage } from "./pages/AgentPage";
import { SuggestPage } from "./pages/SuggestPage";
import { EvidencePage } from "./pages/EvidencePage";

function Topbar() {
  const sessionId = useAppStore((s) => s.sessionId);
  return (
    <div className="topbar">
      <div className="brand">Redteam AI Assist · Student UI</div>
      <div className="nav" style={{ flex: 1 }}>
        <NavLink to="/setup" className={({ isActive }) => (isActive ? "active" : "")}>
          Setup
        </NavLink>
        <NavLink to="/session" className={({ isActive }) => (isActive ? "active" : "")}>
          Session
        </NavLink>
        <NavLink to="/agent" className={({ isActive }) => (isActive ? "active" : "")}>
          Agent
        </NavLink>
        <NavLink to="/suggest" className={({ isActive }) => (isActive ? "active" : "")}>
          Suggest
        </NavLink>
        <NavLink to="/evidence" className={({ isActive }) => (isActive ? "active" : "")}>
          Evidence
        </NavLink>
      </div>
      <div className="muted" style={{ textAlign: "right" }}>
        <div style={{ fontSize: 12 }}>SESSION</div>
        <div className="mono" style={{ fontSize: 12 }}>{sessionId || "—"}</div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <Topbar />
      <div className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/setup" replace />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/session" element={<SessionPage />} />
          <Route path="/agent" element={<AgentPage />} />
          <Route path="/suggest" element={<SuggestPage />} />
          <Route path="/evidence" element={<EvidencePage />} />
          <Route path="*" element={<Navigate to="/setup" replace />} />
        </Routes>
      </div>
    </div>
  );
}
