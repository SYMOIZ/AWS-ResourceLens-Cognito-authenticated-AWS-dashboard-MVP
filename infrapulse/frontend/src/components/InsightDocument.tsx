import type { InfrastructureInsight } from "../types/api";

const sections: Array<{ key: keyof InfrastructureInsight; title: string }> = [
  { key: "summary", title: "Summary" },
  { key: "real_world_scenario", title: "Real-world scenario" },
  { key: "technical_explanation", title: "Technical explanation" },
  { key: "architecture", title: "Architecture" },
  { key: "practical_recommendation", title: "Practical recommendation" },
];

export function InsightDocument({ insight }: { insight: InfrastructureInsight }) {
  return (
    <article className="doc">
      <header>
        <div className="meta-row">
          <span className="chip signal">{insight.category}</span>
          <span className="chip">{insight.topic}</span>
          <span className="chip">{insight.generation_source}</span>
        </div>
        <h2 className="insight-title">{insight.title}</h2>
      </header>
      {sections.map((section) => (
        <section className="doc-section panel" key={section.key}>
          <h3>{section.title}</h3>
          <p>{String(insight[section.key])}</p>
        </section>
      ))}
      <section className="doc-section panel">
        <h3>Best practices</h3>
        <ul>
          {insight.best_practices.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section className="doc-section panel">
        <h3>Common mistakes</h3>
        <ul>
          {insight.common_mistakes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section className="doc-section panel">
        <h3>What to learn next</h3>
        <ul>
          {insight.what_to_learn_next.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section className="doc-section panel">
        <h3>Tags</h3>
        <div className="meta-row">
          {insight.tags.map((tag) => (
            <span className="chip" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </section>
    </article>
  );
}
