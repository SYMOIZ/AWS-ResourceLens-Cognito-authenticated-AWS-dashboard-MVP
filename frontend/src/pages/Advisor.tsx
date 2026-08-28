import { useOutletContext } from "react-router-dom";
import { api } from "../api/client";
import { useAsync } from "../hooks/useApi";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";

export function AdvisorPage() {
  const { region } = useOutletContext<{ region: string }>();
  const result = useAsync(() => api.advisor(region), [region]);

  if (result.loading) return <LoadingState message="Generating recommendations..." />;
  if (result.error) return <ErrorState message={result.error} />;
  const advisor = result.data?.advisor;

  return (
    <div className="stack">
      <h2>AI Infrastructure Advisor</h2>
      <p className="muted">Amazon Bedrock suggestions only. The advisor never deletes or modifies resources.</p>
      <p><strong>AI recommendations are suggestions. Review AWS configuration and pricing before making infrastructure changes.</strong></p>
      {!advisor?.available ? <ErrorState message={advisor?.message || "Bedrock is unavailable."} /> : null}
      <div className="grid-2">
        <article className="card">
          <h3>Recommendations</h3>
          <ul>{advisor?.recommendations.map((r) => <li key={r}>{r}</li>)}</ul>
        </article>
        <article className="card">
          <h3>Observations</h3>
          <ul>{advisor?.observations.map((r) => <li key={r}>{r}</li>)}</ul>
        </article>
      </div>
    </div>
  );
}
