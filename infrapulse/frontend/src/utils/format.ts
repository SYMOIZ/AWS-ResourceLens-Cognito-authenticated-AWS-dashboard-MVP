export function formatTimestamp(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date) + " UTC";
}

export function formatClock(value: string | null | undefined): string {
  if (!value) return "not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "not scheduled";
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
    hour12: false,
  }).format(date) + " UTC";
}

export function schedulerLabel(status: {
  enabled: boolean;
  running: boolean;
  last_run_status: string | null;
}): string {
  if (!status.enabled) return "disabled";
  if (!status.running) return "idle";
  if (status.last_run_status === "failed") return "degraded";
  return "active";
}
