import { useState } from "react";
import { INSTANCE_TYPES, type EstimateInput } from "../types";
import { RegionSelector } from "./RegionSelector";

export function CostEstimatorForm({
  initial,
  onSubmit,
  submitLabel,
}: {
  initial?: Partial<EstimateInput>;
  onSubmit: (input: EstimateInput) => void;
  submitLabel: string;
}) {
  const [form, setForm] = useState<EstimateInput>({
    service: "ec2",
    region: initial?.region ?? "us-east-1",
    instanceType: initial?.instanceType ?? "t3.micro",
    operatingSystem: initial?.operatingSystem ?? "Linux",
    hoursPerMonth: initial?.hoursPerMonth ?? 730,
    volumeType: initial?.volumeType ?? "gp3",
    volumeSizeGiB: initial?.volumeSizeGiB ?? 30,
  });

  return (
    <form
      className="card stack"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
    >
      <RegionSelector value={form.region} onChange={(region) => setForm({ ...form, region })} />
      <label className="stack">
        Instance type
        <select
          value={form.instanceType}
          onChange={(e) => setForm({ ...form, instanceType: e.target.value })}
        >
          {INSTANCE_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </label>
      <label className="stack">
        Operating system
        <select
          value={form.operatingSystem}
          onChange={(e) => setForm({ ...form, operatingSystem: e.target.value })}
        >
          <option>Linux</option>
          <option>Windows</option>
        </select>
      </label>
      <label className="stack">
        Hours per month
        <input
          type="number"
          min={1}
          max={744}
          value={form.hoursPerMonth}
          onChange={(e) => setForm({ ...form, hoursPerMonth: Number(e.target.value) })}
        />
      </label>
      <label className="stack">
        EBS volume type
        <select value={form.volumeType} onChange={(e) => setForm({ ...form, volumeType: e.target.value })}>
          <option value="gp3">gp3</option>
          <option value="gp2">gp2</option>
        </select>
      </label>
      <label className="stack">
        Storage (GiB)
        <input
          type="number"
          min={8}
          max={1000}
          value={form.volumeSizeGiB}
          onChange={(e) => setForm({ ...form, volumeSizeGiB: Number(e.target.value) })}
        />
      </label>
      <button className="btn" type="submit">{submitLabel}</button>
    </form>
  );
}
