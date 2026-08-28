import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../api/client";
import { useAsync } from "../hooks/useApi";
import { CostEstimatorForm } from "../components/CostEstimator";
import { CostCard } from "../components/CostCard";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import type { CostEstimate, EstimateInput } from "../types";

export function CostEstimatorPage() {
  const { region } = useOutletContext<{ region: string }>();
  const billing = useAsync(() => api.billing(region), [region]);
  const [estimate, setEstimate] = useState<CostEstimate | null>(null);
  const [cheaper, setCheaper] = useState<CostEstimate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const spend = billing.data?.billing;

  return (
    <div className="stack">
      <h2>Cost Estimator</h2>
      <p className="muted">
        Planned resource cost comes from the live AWS Price List API. Account spend comes from Cost Explorer when it is enabled — never from sample data.
      </p>

      {billing.loading ? <LoadingState message="Loading billing information..." /> : null}
      {billing.error ? <ErrorState message={billing.error} /> : null}

      <div className="grid-3">
        <article className="card metric">
          <div className="label">Latest Cost Explorer day</div>
          <div className="value">
            {spend?.available && spend.todayUsd != null ? `$${spend.todayUsd.toFixed(2)}` : "Unavailable"}
          </div>
          <p className="muted">{spend?.todayDate ? `Date ${spend.todayDate}` : spend?.message}</p>
        </article>
        <article className="card metric">
          <div className="label">Month-to-date spend</div>
          <div className="value">
            {spend?.available && spend.amountUsd != null ? `$${spend.amountUsd.toFixed(2)}` : "Unavailable"}
          </div>
          <p className="muted">{spend?.periodStart && spend.periodEnd ? `${spend.periodStart} → ${spend.periodEnd}` : null}</p>
        </article>
        <article className="card metric">
          <div className="label">Planned resource</div>
          <div className="value">
            {estimate?.source === "aws-pricing-api" ? `$${estimate.monthly.toFixed(2)}/mo` : "Calculate below"}
          </div>
          <span className="badge">ESTIMATE</span>
        </article>
      </div>

      {spend?.available && spend.daily && spend.daily.length > 0 ? (
        <article className="card">
          <h3>Spend history (Cost Explorer)</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Unblended cost</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {spend.daily.map((d) => (
                <tr key={d.date}>
                  <td className="mono">{d.date}</td>
                  <td>${d.amountUsd.toFixed(2)}</td>
                  <td>{d.estimated ? "estimated by AWS" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted">{spend.message}</p>
        </article>
      ) : null}

      {busy ? <p className="loading">Calculating estimate from AWS Price List...</p> : null}
      {error ? <ErrorState message={error} /> : null}
      <CostEstimatorForm
        initial={{ region }}
        submitLabel="Calculate live AWS estimate"
        onSubmit={async (input: EstimateInput) => {
          setBusy(true);
          setError(null);
          try {
            const res = await api.estimate(input);
            setEstimate(res.estimate);
            setCheaper(res.cheaperOptions ?? []);
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      />
      {estimate ? <CostCard estimate={estimate} title="Selected configuration" /> : null}
      {cheaper.length > 0 ? (
        <article className="card">
          <h3>Cheaper On-Demand options (same hours and storage)</h3>
          <table>
            <thead>
              <tr>
                <th>Instance</th>
                <th>Monthly ESTIMATE</th>
                <th>Hourly</th>
              </tr>
            </thead>
            <tbody>
              {cheaper.map((c) => (
                <tr key={c.breakdown[0]?.component}>
                  <td className="mono">{c.breakdown[0]?.component}</td>
                  <td>${c.monthly.toFixed(2)}</td>
                  <td>${c.hourly.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      ) : null}
    </div>
  );
}
