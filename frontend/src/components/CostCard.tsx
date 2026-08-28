import type { CostEstimate } from "../types";

export function CostCard({ estimate, title }: { estimate: CostEstimate; title?: string }) {
  if (estimate.source === "unavailable") {
    return (
      <article className="card">
        <span className="badge">ESTIMATE</span>
        <p className="error">{estimate.disclaimer}</p>
        <p className="muted">No dollar amount is shown because AWS Price List did not return a real On-Demand rate.</p>
      </article>
    );
  }
  return (
    <article className="card">
      {title ? <h3>{title}</h3> : null}
      <span className="badge">AWS Price List · ESTIMATE</span>
      <div className="grid-3" style={{ marginTop: 12 }}>
        <div className="metric"><div className="label">Hourly</div><div className="value">${estimate.hourly.toFixed(4)}</div></div>
        <div className="metric"><div className="label">Monthly</div><div className="value">${estimate.monthly.toFixed(2)}</div></div>
        <div className="metric"><div className="label">Yearly</div><div className="value">${estimate.yearly.toFixed(2)}</div></div>
      </div>
      <ul>
        {estimate.breakdown.map((b) => (
          <li key={b.component}>{b.component}: ${b.monthlyUsd.toFixed(2)} / month</li>
        ))}
      </ul>
      <p className="muted">{estimate.disclaimer}</p>
    </article>
  );
}
