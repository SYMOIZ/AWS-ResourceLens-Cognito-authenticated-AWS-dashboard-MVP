import { describe, expect, it } from "vitest";
import { formatTimestamp, schedulerLabel } from "./format";

describe("formatTimestamp", () => {
  it("returns an em dash for empty values", () => {
    expect(formatTimestamp(null)).toBe("—");
  });

  it("formats a UTC timestamp", () => {
    const text = formatTimestamp("2026-08-21T09:00:00Z");
    expect(text).toContain("2026");
    expect(text).toContain("UTC");
  });
});

describe("schedulerLabel", () => {
  it("reports active when enabled and running", () => {
    expect(schedulerLabel({ enabled: true, running: true, last_run_status: "success" })).toBe(
      "active",
    );
  });
});
