import { useState } from "react";
import { api } from "../services/api";
import type { InfrastructureInsight } from "../types/api";

interface Props {
  onGenerated?: (insight: InfrastructureInsight) => void;
}

export function GenerateButton({ onGenerated }: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  async function onClick() {
    setBusy(true);
    setFailed(false);
    setMessage("Generating...");
    try {
      const result = await api.generate();
      setMessage(result.message);
      onGenerated?.(result.insight);
    } catch (err) {
      setFailed(true);
      setMessage(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button className="btn primary" type="button" onClick={() => void onClick()} disabled={busy}>
        {busy ? "Generating..." : "Generate Now"}
      </button>
      {message ? <div className={`flash ${failed ? "bad" : ""}`}>{message}</div> : null}
    </div>
  );
}
