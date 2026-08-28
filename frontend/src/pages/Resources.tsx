import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../api/client";
import { useAsync } from "../hooks/useApi";
import { ServiceSelector } from "../components/ServiceSelector";
import { ResourceTable } from "../components/ResourceTable";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { EmptyState } from "../components/EmptyState";

export function ResourcesPage() {
  const { region } = useOutletContext<{ region: string }>();
  const [service, setService] = useState("");
  const [q, setQ] = useState("");
  const result = useAsync(() => api.resources(region, service || undefined, q || undefined), [region, service, q]);

  return (
    <div>
      <h2>Resource explorer</h2>
      <div className="toolbar">
        <ServiceSelector value={service} onChange={setService} />
        <label className="stack">
          Search
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or ID" />
        </label>
      </div>
      {result.loading ? <LoadingState message="Loading resources..." /> : null}
      {result.error ? <ErrorState message={result.error} /> : null}
      {!result.loading && result.data?.resources.length === 0 ? (
        <EmptyState message={service ? `No ${service.toUpperCase()} resources found in this region.` : "No resources found in this region."} />
      ) : null}
      {result.data?.resources.length ? <ResourceTable resources={result.data.resources} region={region} /> : null}
    </div>
  );
}
