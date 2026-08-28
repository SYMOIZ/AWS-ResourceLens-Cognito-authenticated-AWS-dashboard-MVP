import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { InsightDocument } from "../components/InsightDocument";
import { api } from "../services/api";
import type { InfrastructureInsight } from "../types/api";
import { formatTimestamp } from "../utils/format";

export function InsightDetailPage() {
  const { id } = useParams();
  const [insight, setInsight] = useState<InfrastructureInsight | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .insight(Number(id))
      .then(setInsight)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Not found"));
  }, [id]);

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>{insight?.title ?? "Insight"}</h2>
          <p>{insight ? formatTimestamp(insight.generated_at) : "Loading stored insight."}</p>
        </div>
      </div>
      {error ? <div className="error-banner">{error}</div> : null}
      {insight ? <InsightDocument insight={insight} /> : null}
    </div>
  );
}
