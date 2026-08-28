import { FormEvent, useEffect, useState } from "react";
import { api } from "../services/api";
import type { PublicSettings, SchedulerRunResponse } from "../types/api";

const empty: PublicSettings = {
  ai_provider: "demo",
  scheduler_enabled: true,
  schedule_time: "09:00",
  timezone: "UTC",
  demo_mode: true,
  app_name: "InfraPulse",
  app_version: "0.1.0",
  environment: "development",
};

export function SettingsPage() {
  const [settings, setSettings] = useState<PublicSettings>(empty);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState<SchedulerRunResponse | null>(null);

  useEffect(() => {
    api
      .settings()
      .then(setSettings)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Unable to load settings"));
  }, []);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    try {
      const saved = await api.patchSettings({
        ai_provider: settings.ai_provider,
        scheduler_enabled: settings.scheduler_enabled,
        schedule_time: settings.schedule_time,
        timezone: settings.timezone,
        demo_mode: settings.demo_mode,
      });
      setSettings(saved);
      setMessage("Settings saved. Scheduler job refreshed.");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save settings");
    }
  }

  async function runNow() {
    try {
      setTick(await api.runScheduler());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scheduler run failed");
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Settings</h2>
          <p>Runtime controls for the local agent. Secrets are never shown here.</p>
        </div>
      </div>
      {error ? <div className="error-banner">{error}</div> : null}
      <form className="panel form-grid" onSubmit={(event) => void onSave(event)}>
        <label className="field">
          AI provider
          <select
            value={settings.ai_provider}
            onChange={(event) => setSettings({ ...settings, ai_provider: event.target.value })}
          >
            <option value="demo">demo</option>
            <option value="bedrock">bedrock</option>
          </select>
        </label>
        <label className="field">
          Daily generation time
          <input
            value={settings.schedule_time}
            onChange={(event) => setSettings({ ...settings, schedule_time: event.target.value })}
            placeholder="09:00"
          />
        </label>
        <label className="field">
          Timezone
          <input
            value={settings.timezone}
            onChange={(event) => setSettings({ ...settings, timezone: event.target.value })}
          />
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={settings.scheduler_enabled}
            onChange={(event) =>
              setSettings({ ...settings, scheduler_enabled: event.target.checked })
            }
          />
          Scheduler enabled
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={settings.demo_mode}
            onChange={(event) => setSettings({ ...settings, demo_mode: event.target.checked })}
          />
          Demo mode (no network AI calls)
        </label>
        <div>
          <button className="btn primary" type="submit">
            Save settings
          </button>
          {message ? <div className="flash">{message}</div> : null}
        </div>
      </form>
      <section className="panel" style={{ marginTop: 16 }}>
        <h3>Application</h3>
        <p className="lede">
          {settings.app_name} {settings.app_version} · {settings.environment}
        </p>
        <p className="muted">
          Bedrock model id and AWS credentials are read from the environment / IAM chain only. They
          are not accepted or displayed in this UI.
        </p>
      </section>
      <section className="panel" style={{ marginTop: 16 }}>
        <h3>Scheduler test tick</h3>
        <p className="lede">
          Runs the same job as the daily cron: skip if today already exists, otherwise generate.
        </p>
        <button className="btn" type="button" onClick={() => void runNow()}>
          Run scheduled job now
        </button>
        {tick ? (
          <p className="flash">
            {tick.skipped ? `Skipped: ${tick.reason}` : "Generated"} · {tick.message}
          </p>
        ) : null}
      </section>
    </div>
  );
}
