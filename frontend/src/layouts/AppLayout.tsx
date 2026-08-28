import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useRegion } from "../hooks/useRegion";
import { RegionSelector } from "../components/RegionSelector";

const links = [
  ["/", "Overview"],
  ["/resources", "Resources"],
  ["/estimator", "Cost Estimator"],
  ["/costs", "Cost Overview"],
  ["/create", "Create Resource"],
  ["/advisor", "AI Advisor"],
  ["/reports", "Reports"],
] as const;

export function AppLayout() {
  const { email, signOut } = useAuth();
  const { region, setRegion } = useRegion();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="lens-mark" aria-hidden />
          <div>
            <h1>ResourceLens</h1>
            <p>AWS inventory & cost</p>
          </div>
        </div>
        <nav className="nav">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === "/"}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div style={{ marginTop: "auto" }} className="stack">
          <RegionSelector value={region} onChange={setRegion} />
          <p className="muted">{email}</p>
          <button className="btn secondary" type="button" onClick={signOut}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="main">
        <div className="horizon" />
        <Outlet context={{ region }} />
      </main>
    </div>
  );
}
