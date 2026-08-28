export function logInfo(message: string, extra?: Record<string, unknown>): void {
  console.log(JSON.stringify({ level: "INFO", message, ...extra, ts: new Date().toISOString() }));
}

export function logError(message: string, extra?: Record<string, unknown>): void {
  console.error(JSON.stringify({ level: "ERROR", message, ...extra, ts: new Date().toISOString() }));
}

export function logWarn(message: string, extra?: Record<string, unknown>): void {
  console.warn(JSON.stringify({ level: "WARN", message, ...extra, ts: new Date().toISOString() }));
}
