import { useOutletContext } from "react-router-dom";
import { api } from "../api/client";
import { useAsync } from "../hooks/useApi";
import { MetricCard } from "../components/MetricCard";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";

export function DashboardPage() {
  const { region } = useOutletContext<{ region: string }>();
  const summary = useAsync(() => api.summary(region), [region]);
  const billing = useAsync(() => api.billing(region), [region]);

  if (summary.loading) return <LoadingState message="Loading resources..." />;
  if (summary.error) return <ErrorState message={summary.error} />;

  const total = summary.data?.summaries.reduce((n, s) => n + (s.count ?? 0), 0) ?? 0;
  const spend = billing.data?.billing;

  return (
    <div>
      <h2>Overview</h2>
      <p className="muted">Live inventory for {region}. Missing permissions show messages, not fake numbers.</p>
      <div className="grid-4">
        <MetricCard label="Total resources" value={String(total)} />
        <MetricCard
          label="Current AWS spend"
          value={spend?.available && spend.amountUsd != null ? `$${spend.amountUsd.toFixed(2)}` : "Unavailable"}
          hint={spend?.available ? `${spend.periodStart} – ${spend.periodEnd}` : spend?.message}
        />
        <MetricCard label="Estimated monthly cost" value="See Estimator" hint="Labeled ESTIMATE only" />
        <MetricCard
          label="Optimization opportunities"
          value="Open Advisor"
          hint="Generated on the AI Advisor page from live inventory"
        />
      </div>
      <h3>Service counts</h3>
      <div className="grid-3">
        {summary.data?.summaries.map((s) => (
          <article className="card" key={s.service}>
            <strong>{s.service.toUpperCase()}</strong>
            <p className="value">{s.count ?? "—"}</p>
            {s.status !== "ok" ? <p className="error">{s.message}</p> : null}
          </article>
        ))}
      </div>
    </div>
  );
}
