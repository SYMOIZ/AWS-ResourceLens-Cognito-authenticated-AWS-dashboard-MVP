import { GenerateButton } from "../components/GenerateButton";
import { InsightDocument } from "../components/InsightDocument";
import { useTodayInsight } from "../hooks/useTodayInsight";
import { formatTimestamp } from "../utils/format";

export function TodayPage() {
  const { insight, loading, error, setInsight } = useTodayInsight();

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Today’s Insight</h2>
          <p>
            {insight
              ? `Generated ${formatTimestamp(insight.generated_at)} · ${insight.generation_source}`
              : "The complete structured insight for the current local day."}
          </p>
        </div>
        <GenerateButton onGenerated={setInsight} />
      </div>
      {error ? <div className="error-banner">{error}</div> : null}
      {loading ? <p className="muted">Loading…</p> : null}
      {!loading && !insight ? (
        <div className="panel empty">Nothing generated today. Run Generate Now to create the first insight.</div>
      ) : null}
      {insight ? <InsightDocument insight={insight} /> : null}
    </div>
  );
}
