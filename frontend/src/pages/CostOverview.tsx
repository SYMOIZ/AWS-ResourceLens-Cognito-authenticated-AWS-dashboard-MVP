import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../api/client";
import { useAsync } from "../hooks/useApi";
import { CostEstimatorForm } from "../components/CostEstimator";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import type { CostEstimate, EstimateInput } from "../types";

export function CostOverviewPage() {
  const { region } = useOutletContext<{ region: string }>();
  const billing = useAsync(() => api.billing(region), [region]);
  const [planned, setPlanned] = useState<CostEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const current = billing.data?.billing.available ? billing.data.billing.amountUsd ?? null : null;
  const plannedMonthly = planned?.source === "aws-pricing-api" ? planned.monthly : null;
  const spend = billing.data?.billing;

  return (
    <div className="stack">
      <h2>Cost Overview</h2>
      {billing.loading ? <LoadingState message="Loading billing information..." /> : null}
      {billing.error ? <ErrorState message={billing.error} /> : null}
      <div className="grid-3">
        <article className="card metric">
          <div className="label">Current AWS spend (MTD)</div>
          <div className="value">{current == null ? "Unavailable" : `$${current.toFixed(2)}`}</div>
          {!spend?.available ? (
            <p>Billing data is unavailable. Please verify Cost Explorer/IAM permissions.</p>
          ) : (
            <p className="muted">{spend.message}</p>
          )}
        </article>
        <article className="card metric">
          <div className="label">Planned resource</div>
          <div className="value">{plannedMonthly == null ? "—" : `$${plannedMonthly.toFixed(2)}/month`}</div>
          <span className="badge">ESTIMATE</span>
        </article>
        <article className="card metric">
          <div className="label">Projected spend</div>
          <div className="value">
            {current == null || plannedMonthly == null ? "—" : `$${(current + plannedMonthly).toFixed(2)}/month`}
          </div>
          <p className="muted">Projected spending is an estimate, not a forecasted AWS bill.</p>
        </article>
      </div>
      {spend?.available && spend.daily && spend.daily.length > 0 ? (
        <article className="card">
          <h3>Daily history</h3>
          <table>
            <thead>
              <tr><th>Date</th><th>Cost</th></tr>
            </thead>
            <tbody>
              {spend.daily.map((d) => (
                <tr key={d.date}>
                  <td className="mono">{d.date}</td>
                  <td>${d.amountUsd.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      ) : null}
      {error ? <ErrorState message={error} /> : null}
      <h3>Add a planned EC2 estimate</h3>
      <CostEstimatorForm
        initial={{ region }}
        submitLabel="Use this estimate"
        onSubmit={async (input: EstimateInput) => {
          try {
            setError(null);
            const res = await api.estimate(input);
            setPlanned(res.estimate);
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      />
    </div>
  );
}
