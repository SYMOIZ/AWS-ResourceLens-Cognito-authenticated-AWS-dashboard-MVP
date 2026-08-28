export function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <article className="card metric">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {hint ? <p className="muted">{hint}</p> : null}
    </article>
  );
}
