import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { AppLayout } from "./layouts/AppLayout";
import { AuthLayout } from "./layouts/AuthLayout";
import { LoginPage } from "./pages/Login";
import { SignUpPage } from "./pages/SignUp";
import { ForgotPasswordPage } from "./pages/ForgotPassword";
import { DashboardPage } from "./pages/Dashboard";
import { ResourcesPage } from "./pages/Resources";
import { ResourceDetailPage } from "./pages/ResourceDetail";
import { CostEstimatorPage } from "./pages/CostEstimator";
import { CostOverviewPage } from "./pages/CostOverview";
import { CreateResourcePage } from "./pages/CreateResource";
import { AdvisorPage } from "./pages/Advisor";
import { ReportsPage } from "./pages/Reports";

function Guard({ children }: { children: ReactNode }) {
  const { loading, session } = useAuth();
  if (loading) return <p className="loading">Restoring session...</p>;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>
      <Route
        element={
          <Guard>
            <AppLayout />
          </Guard>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/resources/:id" element={<ResourceDetailPage />} />
        <Route path="/estimator" element={<CostEstimatorPage />} />
        <Route path="/costs" element={<CostOverviewPage />} />
        <Route path="/create" element={<CreateResourcePage />} />
        <Route path="/advisor" element={<AdvisorPage />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
