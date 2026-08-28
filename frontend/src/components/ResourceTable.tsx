import { Link } from "react-router-dom";
import type { ResourceRecord } from "../types";

export function ResourceTable({ resources, region }: { resources: ResourceRecord[]; region: string }) {
  return (
    <div className="card" style={{ overflowX: "auto" }}>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Name / ID</th>
            <th>Status</th>
            <th>Region</th>
            <th>Created</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {resources.map((r) => (
            <tr key={`${r.service}-${r.id}`}>
              <td>{r.type}</td>
              <td className="mono">{r.name}<br /><span className="muted">{r.id}</span></td>
              <td>{r.status ?? "—"}</td>
              <td>{r.region}</td>
              <td>{r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}</td>
              <td>
                <Link to={`/resources/${encodeURIComponent(r.id)}?service=${r.service}&region=${region}`}>
                  View details
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ResourceCard({ resource }: { resource: ResourceRecord }) {
  return (
    <article className="card">
      <h3>{resource.name}</h3>
      <p className="mono muted">{resource.id}</p>
      <p>{resource.type} · {resource.region} · {resource.status ?? "unknown"}</p>
    </article>
  );
}
