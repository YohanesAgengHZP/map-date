import { describe, expect, it } from "vitest";
import { summarizeCategories } from "./format";

describe("summarizeCategories", () => {
  it("joins distinct categories in order", () => {
    expect(summarizeCategories(["Museum", "Park", "Cafe"])).toBe(
      "Museum → Park → Cafe",
    );
  });

  it("counts a run rather than repeating it", () => {
    expect(
      summarizeCategories(["Batak restaurant", "Batak restaurant", "Batak restaurant"]),
    ).toBe("3 × Batak restaurant");
  });

  it("only collapses neighbours, so the shape of the day survives", () => {
    expect(summarizeCategories(["Cafe", "Cafe", "Museum", "Cafe"])).toBe(
      "2 × Cafe → Museum → Cafe",
    );
  });

  it("has nothing to say about a plan with no stops", () => {
    expect(summarizeCategories([])).toBe("");
  });
});
