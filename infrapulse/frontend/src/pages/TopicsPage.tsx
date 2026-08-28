import { FormEvent, useEffect, useState } from "react";
import { api } from "../services/api";
import type { Topic } from "../types/api";
import { formatTimestamp } from "../utils/format";

export function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("AWS");
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setTopics(await api.topics());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load topics");
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function toggle(topic: Topic) {
    const updated = await api.patchTopic(topic.id, { enabled: !topic.enabled });
    setTopics((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  }

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    try {
      const created = await api.createTopic({ name, category });
      setTopics((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create topic");
    }
  }

  const grouped = topics.reduce<Record<string, Topic[]>>((acc, topic) => {
    acc[topic.category] = acc[topic.category] ?? [];
    acc[topic.category].push(topic);
    return acc;
  }, {});

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Topics</h2>
          <p>Enable or disable catalog entries. The agent prefers unused enabled topics.</p>
        </div>
      </div>
      {error ? <div className="error-banner">{error}</div> : null}
      <form className="toolbar" onSubmit={(event) => void onCreate(event)}>
        <label className="field">
          New topic
          <input value={name} onChange={(event) => setName(event.target.value)} required minLength={4} />
        </label>
        <label className="field">
          Category
          <input value={category} onChange={(event) => setCategory(event.target.value)} required />
        </label>
        <div className="field" style={{ flex: "0 0 auto", justifyContent: "flex-end" }}>
          <label>&nbsp;</label>
          <button className="btn" type="submit">
            Add topic
          </button>
        </div>
      </form>
      {Object.entries(grouped).map(([group, items]) => (
        <section key={group} className="panel" style={{ marginBottom: 16 }}>
          <h3>{group}</h3>
          <div className="topic-list">
            {items.map((topic) => (
              <div className="topic-row" key={topic.id}>
                <div>
                  <strong>{topic.name}</strong>
                  <div className="muted">Last used {formatTimestamp(topic.last_used_at)}</div>
                </div>
                <span className="chip">{topic.enabled ? "enabled" : "disabled"}</span>
                <button
                  className={`toggle ${topic.enabled ? "on" : ""}`}
                  type="button"
                  onClick={() => void toggle(topic)}
                >
                  {topic.enabled ? "Disable" : "Enable"}
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
