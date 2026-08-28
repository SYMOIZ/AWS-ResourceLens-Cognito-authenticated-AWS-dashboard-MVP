import { ALLOWED_REGIONS } from "../types";

export function RegionSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="stack">
      <span className="muted">Region</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label="AWS region">
        {ALLOWED_REGIONS.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
    </label>
  );
}
