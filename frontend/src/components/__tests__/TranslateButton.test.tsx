import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TranslateButton from "../TranslateButton";

describe("TranslateButton", () => {
  it("is disabled when disabled prop is true", () => {
    render(<TranslateButton disabled>Translate</TranslateButton>);
    expect(screen.getByRole("button", { name: /translate/i })).toBeDisabled();
  });

  it("shows spinner when loading", () => {
    render(<TranslateButton loading>Translate</TranslateButton>);
    expect(screen.getByRole("img", { hidden: true })).toBeInTheDocument();
  });
});