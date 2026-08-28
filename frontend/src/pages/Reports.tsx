import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../api/client";
import { ErrorState } from "../components/ErrorState";

export function ReportsPage() {
  const { region } = useOutletContext<{ region: string }>();
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="stack">
      <h2>Generate Report</h2>
      <p className="muted">Creates an HTML snapshot in a private S3 bucket and returns a time-limited signed URL.</p>
      {error ? <ErrorState message={error} /> : null}
      <button
        className="btn"
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            const res = await api.report(region);
            setUrl(res.report.downloadUrl);
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Generating report..." : "Generate report"}
      </button>
      {url ? (
        <p>
          <a href={url} target="_blank" rel="noreferrer">Download report</a>
          <span className="muted"> (signed URL expires in 15 minutes)</span>
        </p>
      ) : null}
    </div>
  );
}
