import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GenerateButton } from "../components/GenerateButton";

describe("GenerateButton", () => {
  it("renders the generate action", () => {
    render(<GenerateButton />);
    expect(screen.getByRole("button", { name: /generate now/i })).toBeInTheDocument();
  });

  it("does not call generate until clicked", () => {
    const generate = vi.fn();
    render(<GenerateButton onGenerated={generate} />);
    expect(generate).not.toHaveBeenCalled();
  });
});
