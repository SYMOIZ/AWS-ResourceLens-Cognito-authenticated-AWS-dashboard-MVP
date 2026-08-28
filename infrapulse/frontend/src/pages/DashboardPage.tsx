import { Link } from "react-router-dom";
import { GenerateButton } from "../components/GenerateButton";
import { useStatus } from "../hooks/useStatus";
import { useTodayInsight } from "../hooks/useTodayInsight";
import { formatTimestamp, schedulerLabel } from "../utils/format";

export function DashboardPage() {
  const { status, refresh: refreshStatus } = useStatus();
  const { insight, loading, error, setInsight } = useTodayInsight();
  const sched = status?.scheduler;

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Dashboard</h2>
          <p>Today’s generated infrastructure insight and the agent’s scheduler health.</p>
        </div>
        <GenerateButton
          onGenerated={(next) => {
            setInsight(next);
            void refreshStatus();
          }}
        />
      </div>
      {error ? <div className="error-banner">{error}</div> : null}
      <div className="grid stats">
        <div className="panel">
          <h3>Insights stored</h3>
          <div className="stat-value">{status?.total_insights ?? "—"}</div>
          <div className="stat-label">SQLite history</div>
        </div>
        <div className="panel">
          <h3>Scheduler</h3>
          <div className="stat-value">{sched ? schedulerLabel(sched) : "—"}</div>
          <div className="stat-label">
            {sched ? `${sched.schedule_time} ${sched.timezone}` : "loading"}
          </div>
        </div>
        <div className="panel">
          <h3>Last successful</h3>
          <div className="stat-value" style={{ fontSize: 18 }}>
            {formatTimestamp(status?.last_successful_generation)}
          </div>
          <div className="stat-label">Most recent write</div>
        </div>
        <div className="panel">
          <h3>Provider</h3>
          <div className="stat-value" style={{ fontSize: 22 }}>
            {status?.ai_provider ?? "—"}
          </div>
          <div className="stat-label">{status?.demo_mode ? "demo mode on" : "live provider"}</div>
        </div>
      </div>
      <div className="grid main" style={{ marginTop: 16 }}>
        <section className="panel">
          <h3>Today’s insight</h3>
          {loading ? <p className="muted">Loading…</p> : null}
          {!loading && !insight ? (
            <div className="empty">
              No insight for today yet. Use Generate Now, or wait for the daily scheduler.
            </div>
          ) : null}
          {insight ? (
            <>
              <div className="meta-row">
                <span className="chip signal">{insight.category}</span>
                <span className="chip">{insight.topic}</span>
                <span className="chip">{formatTimestamp(insight.generated_at)}</span>
              </div>
              <h3 className="insight-title">{insight.title}</h3>
              <p className="lede">{insight.summary}</p>
              <div className="rec">{insight.practical_recommendation}</div>
              <p style={{ marginTop: 16 }}>
                <Link className="btn" to="/today">
                  Open full insight
                </Link>
              </p>
            </>
          ) : null}
        </section>
        <section className="panel">
          <h3>Agent status</h3>
          <p className="lede">
            The local scheduler uses APScheduler. The same generation path is what EventBridge will
            call after AWS migration.
          </p>
          <div className="meta-row">
            <span className="chip">{sched?.enabled ? "enabled" : "disabled"}</span>
            <span className="chip">{sched?.running ? "process running" : "process idle"}</span>
            {sched?.last_run_status ? <span className="chip">{sched.last_run_status}</span> : null}
          </div>
          {sched?.last_error ? <p className="flash bad">{sched.last_error}</p> : null}
          <p className="muted">
            Next run {formatTimestamp(sched?.next_run_at)}. Last tick {formatTimestamp(sched?.last_run_at)}.
          </p>
        </section>
      </div>
    </div>
  );
}
