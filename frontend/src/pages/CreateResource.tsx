import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../api/client";
import { INSTANCE_TYPES } from "../types";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { CostCard } from "../components/CostCard";
import { ErrorState } from "../components/ErrorState";
import type { CostEstimate, OperationRecord } from "../types";

const STEPS = ["Configure", "Estimate", "Review", "Confirm", "Create"];

export function CreateResourcePage() {
  const { region: defaultRegion } = useOutletContext<{ region: string }>();
  const [step, setStep] = useState(0);
  const [region, setRegion] = useState(defaultRegion);
  const [instanceType, setInstanceType] = useState("t3.micro");
  const [volumeType, setVolumeType] = useState("gp3");
  const [volumeSizeGiB, setVolumeSizeGiB] = useState(30);
  const [name, setName] = useState("");
  const [estimate, setEstimate] = useState<CostEstimate | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [operation, setOperation] = useState<OperationRecord | null>(null);

  async function loadEstimate() {
    setBusy(true);
    setError(null);
    try {
      const res = await api.estimate({
        service: "ec2",
        region,
        instanceType,
        operatingSystem: "Linux",
        hoursPerMonth: 730,
        volumeType,
        volumeSizeGiB,
      });
      setEstimate(res.estimate);
      setStep(2);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h2>Create Resource</h2>
      <p className="muted">Configure → Estimate → Review → Confirm → Create. Nothing is launched until you confirm.</p>
      <div className="steps">
        {STEPS.map((s, i) => (
          <span key={s} className={i === step ? "current" : undefined}>{s}</span>
        ))}
      </div>
      {error ? <ErrorState message={error} /> : null}

      {step === 0 ? (
        <div className="card stack">
          <label className="stack">Region
            <input value={region} onChange={(e) => setRegion(e.target.value)} />
          </label>
          <label className="stack">Instance type
            <select value={instanceType} onChange={(e) => setInstanceType(e.target.value)}>
              {INSTANCE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label className="stack">Volume type
            <select value={volumeType} onChange={(e) => setVolumeType(e.target.value)}>
              <option value="gp3">gp3</option>
              <option value="gp2">gp2</option>
            </select>
          </label>
          <label className="stack">Storage GiB
            <input type="number" min={8} max={1000} value={volumeSizeGiB} onChange={(e) => setVolumeSizeGiB(Number(e.target.value))} />
          </label>
          <label className="stack">Name tag
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <button className="btn" type="button" onClick={() => { setStep(1); void loadEstimate(); }}>Continue to estimate</button>
        </div>
      ) : null}

      {busy ? <p className="loading">{step < 4 ? "Calculating estimate..." : "Creating resource..."}</p> : null}
      {estimate && step >= 1 ? <CostCard estimate={estimate} /> : null}

      {step >= 2 && !operation ? (
        <div className="toolbar">
          <button className="btn secondary" type="button" onClick={() => setStep(0)}>Back</button>
          <button className="btn" type="button" onClick={() => setConfirmOpen(true)}>Review and confirm create</button>
        </div>
      ) : null}

      {confirmOpen ? (
        <ConfirmationModal
          title="Create this EC2 instance?"
          confirmLabel="Confirm and create"
          busy={busy}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={async () => {
            setBusy(true);
            setError(null);
            try {
              const res = await api.createEc2({
                service: "ec2",
                region,
                instanceType,
                operatingSystem: "Linux",
                hoursPerMonth: 730,
                volumeType,
                volumeSizeGiB,
                confirm: true,
                name,
              });
              setOperation(res.operation);
              setConfirmOpen(false);
              setStep(4);
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <p>{instanceType} in {region}, {volumeSizeGiB} GiB {volumeType}.</p>
          <p className="muted">This calls EC2 RunInstances in your account.</p>
        </ConfirmationModal>
      ) : null}

      {operation ? (
        <article className="card">
          <h3>AWS API result</h3>
          <p>Status: {operation.status}</p>
          <p className="mono">Operation {operation.operationId}</p>
          {operation.resourceId ? <p className="mono">Instance {operation.resourceId}</p> : null}
          {operation.error ? <p className="error">{operation.error}</p> : null}
        </article>
      ) : null}
    </div>
  );
}
