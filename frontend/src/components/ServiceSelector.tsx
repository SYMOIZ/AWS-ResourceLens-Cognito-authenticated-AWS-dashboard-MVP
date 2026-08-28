import { IMPLEMENTED_SERVICES, type AwsService } from "../types";

export function ServiceSelector({
  value,
  onChange,
  allowAll = true,
}: {
  value: string;
  onChange: (v: string) => void;
  allowAll?: boolean;
}) {
  return (
    <label className="stack">
      <span className="muted">Service</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label="AWS service">
        {allowAll ? <option value="">All implemented</option> : null}
        {IMPLEMENTED_SERVICES.map((s: AwsService) => (
          <option key={s} value={s}>{s.toUpperCase()}</option>
        ))}
      </select>
    </label>
  );
}
