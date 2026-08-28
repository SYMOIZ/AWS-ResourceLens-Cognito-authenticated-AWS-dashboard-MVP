import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import type { InfrastructureInsight } from "../types/api";
import { formatTimestamp } from "../utils/format";

export function HistoryPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<InfrastructureInsight[]>([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [topic, setTopic] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .insights({
        q: q || undefined,
        category: category || undefined,
        topic: topic || undefined,
      })
      .then((result) => {
        if (!cancelled) {
          setItems(result.items);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load history");
      });
    return () => {
      cancelled = true;
    };
  }, [q, category, topic]);

  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.category))).sort(),
    [items],
  );
  const topics = useMemo(
    () => Array.from(new Set(items.map((item) => item.topic))).sort(),
    [items],
  );

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>History</h2>
          <p>Search and filter previously generated insights stored in SQLite.</p>
        </div>
      </div>
      {error ? <div className="error-banner">{error}</div> : null}
      <div className="toolbar">
        <label className="field">
          Search
          <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Title, topic, summary" />
        </label>
        <label className="field">
          Category
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">All</option>
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Topic
          <select value={topic} onChange={(event) => setTopic(event.target.value)}>
            <option value="">All</option>
            {topics.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="panel" style={{ padding: 0 }}>
        {items.length === 0 ? (
          <div className="empty">No insights match these filters.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Generated</th>
                <th>Title</th>
                <th>Topic</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  className="clickable"
                  key={item.id}
                  onClick={() => navigate(`/insights/${item.id}`)}
                >
                  <td className="muted">{formatTimestamp(item.generated_at)}</td>
                  <td>{item.title}</td>
                  <td className="muted">{item.topic}</td>
                  <td>{item.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
