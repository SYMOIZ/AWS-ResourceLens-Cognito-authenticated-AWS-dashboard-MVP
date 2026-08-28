import { useSearchParams, useParams } from "react-router-dom";
import { api } from "../api/client";
import { useAsync } from "../hooks/useApi";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";

export function ResourceDetailPage() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const service = params.get("service") ?? "";
  const region = params.get("region") ?? "us-east-1";
  const result = useAsync(() => api.resource(region, service, id), [region, service, id]);

  if (result.loading) return <LoadingState message="Loading resources..." />;
  if (result.error) return <ErrorState message={result.error} />;
  const resource = result.data?.resource;
  if (!resource) return <ErrorState message="Resource not found in the selected region." />;

  return (
    <div className="stack">
      <h2>{resource.name}</h2>
      <p className="mono muted">{resource.id}</p>
      <div className="card">
        <p>Type: {resource.type}</p>
        <p>Region: {resource.region}</p>
        <p>Status: {resource.status ?? "—"}</p>
        <p>Created: {resource.createdAt ?? "—"}</p>
      </div>
      <h3>Configuration</h3>
      <div className="card">
        {Object.entries(resource.metadata).map(([k, v]) => (
          <p key={k}><span className="muted">{k}:</span> <span className="mono">{String(v)}</span></p>
        ))}
      </div>
    </div>
  );
}
