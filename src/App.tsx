import { NavLink, Route, Routes } from "react-router-dom";
import { StatusBanner } from "./components/StatusBanner";
import { SetupPage } from "./pages/SetupPage";
import { SessionPage } from "./pages/SessionPage";
import { AgentPage } from "./pages/AgentPage";
import { SuggestPage } from "./pages/SuggestPage";
import { EvidencePage } from "./pages/EvidencePage";
import { useAppStore } from "./state/useAppStore";

function TopNav() {
  const sessionId = useAppStore((s) => s.sessionId);

  return (
    <header className="header">
      <div className="brand">
        <div className="brandTitle">Redteam‑AI‑Assist</div>
        <div className="brandSub">Student Web UI (Lab)</div>
      </div>

      <nav className="nav">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "navLink active" : "navLink")}>
          Setup
        </NavLink>
        <NavLink to="/session" className={({ isActive }) => (isActive ? "navLink active" : "navLink")}>
          Session
        </NavLink>
        <NavLink to="/agent" className={({ isActive }) => (isActive ? "navLink active" : "navLink")}>
          Agent
        </NavLink>
        <NavLink to="/suggest" className={({ isActive }) => (isActive ? "navLink active" : "navLink")}>
          Suggest
        </NavLink>
        <NavLink to="/evidence" className={({ isActive }) => (isActive ? "navLink active" : "navLink")}>
          Evidence
        </NavLink>
      </nav>

      <div className="sessionChip" title="Current session id">
        <span className="muted">SESSION:</span> <code>{sessionId || "—"}</code>
      </div>
    </header>
  );
}

export function App() {
  return (
    <div className="appShell">
      <TopNav />
      <StatusBanner />

      <main className="main">
        <Routes>
          <Route path="/" element={<SetupPage />} />
          <Route path="/session" element={<SessionPage />} />
          <Route path="/agent" element={<AgentPage />} />
          <Route path="/suggest" element={<SuggestPage />} />
          <Route path="/evidence" element={<EvidencePage />} />
        </Routes>
      </main>

      <footer className="footer muted">
        Lab-only UI. No authentication. Do not expose to public internet.
      </footer>
    </div>
  );
}
