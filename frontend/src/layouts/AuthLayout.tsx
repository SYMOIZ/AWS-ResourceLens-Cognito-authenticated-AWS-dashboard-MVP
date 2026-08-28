import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function AuthLayout() {
  const { session, loading } = useAuth();
  if (loading) return <p className="loading">Loading...</p>;
  if (session) return <Navigate to="/" replace />;
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="brand">
          <div className="lens-mark" aria-hidden />
          <div>
            <h1>AWS ResourceLens</h1>
            <p>Analyze, Estimate & Manage AWS Resources</p>
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
