import { NavLink, Outlet } from "react-router-dom";
import { useStatus } from "../hooks/useStatus";
import { formatClock, formatTimestamp, schedulerLabel } from "../utils/format";

const links = [
  { to: "/", label: "Dashboard", hint: "01" },
  { to: "/today", label: "Today's Insight", hint: "02" },
  { to: "/history", label: "History", hint: "03" },
  { to: "/topics", label: "Topics", hint: "04" },
  { to: "/settings", label: "Settings", hint: "05" },
];

export function AppShell() {
  const { status, error } = useStatus();
  const sched = status?.scheduler;
  const label = sched ? schedulerLabel(sched) : "unknown";
  const dotClass = label === "degraded" ? "bad" : label === "active" ? "" : "idle";

  return (
    <div className="app-shell">
      <div className="ticker" role="status">
        <span className={`dot ${dotClass}`} />
        <span>
          AGENT <strong>INFRAPULSE</strong>
        </span>
        <span className="sep">/</span>
        <span>
          SCHEDULER <strong>{label.toUpperCase()}</strong>
        </span>
        <span className="sep">/</span>
        <span>
          NEXT {formatClock(sched?.next_run_at ?? null)}
        </span>
        <span className="sep">/</span>
        <span>
          LAST OK {formatTimestamp(status?.last_successful_generation)}
        </span>
        <span className="sep">/</span>
        <span>
          PROVIDER <strong>{(status?.ai_provider ?? "demo").toUpperCase()}</strong>
        </span>
        {error ? (
          <>
            <span className="sep">/</span>
            <span>API {error}</span>
          </>
        ) : null}
      </div>
      <aside className="rail">
        <div className="brand">
          <div className="brand-mark">Always-on agent</div>
          <h1>InfraPulse</h1>
          <p>Daily infrastructure insight. Local MVP, AWS-ready.</p>
        </div>
        <nav className="nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) => (isActive ? "active" : undefined)}
            >
              {link.label}
              <span className="hint">{link.hint}</span>
            </NavLink>
          ))}
        </nav>
        <div className="rail-foot">
          <span>Telemetry</span>
          {status ? `${status.total_insights} insights stored · ${status.environment}` : "Connecting to API…"}
        </div>
      </aside>
      <main className="workspace">
        <Outlet />
      </main>
    </div>
  );
}
