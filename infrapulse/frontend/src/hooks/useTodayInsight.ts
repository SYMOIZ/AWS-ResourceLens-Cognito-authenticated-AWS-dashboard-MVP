import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";
import type { InfrastructureInsight } from "../types/api";

export function useTodayInsight() {
  const [insight, setInsight] = useState<InfrastructureInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await api.today();
      setInsight(next);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load today's insight");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { insight, loading, error, refresh, setInsight };
}
