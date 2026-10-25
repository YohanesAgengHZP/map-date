import { describe, expect, it } from "vitest";
import { createMyPlan, decodePlan, encodePlan, isMyPlanId, toPlan } from "./myPlans";
import { PLANS } from "@/data/plans";

describe("plans the user makes", () => {
  it("never collides with a built-in plan id", () => {
    const mine = createMyPlan({ title: "Mine", mood: "foodie", startTime: "15:00" });
    expect(isMyPlanId(mine.id)).toBe(true);
    expect(PLANS.some((p) => p.id === mine.id)).toBe(false);
    expect(PLANS.every((p) => !isMyPlanId(p.id))).toBe(true);
  });

  it("gives two plans made in the same session different ids", () => {
    const a = createMyPlan({ title: "A", mood: "cozy", startTime: "10:00", now: 1 });
    const b = createMyPlan({ title: "B", mood: "cozy", startTime: "10:00", now: 2 });
    expect(a.id).not.toBe(b.id);
  });

  it("falls back to a title rather than saving a blank one", () => {
    expect(createMyPlan({ title: "   ", mood: "artsy", startTime: "09:00" }).title).toBe(
      "My plan",
    );
  });

  it("starts with no stops and survives the round trip to a Plan", () => {
    const empty = toPlan(
      createMyPlan({ title: "Empty", mood: "artsy", startTime: "09:00" }),
    );
    expect(empty.destinationIds).toEqual([]);
    // An empty plan still has to render: no stops means no photo to borrow.
    expect(empty.coverPhoto.url).toBe("");
    expect(empty.coverPhoto.alt).toBe("Empty");
  });

  it("borrows its cover photo from the first stop that has one", () => {
    const plan = toPlan(
      createMyPlan({
        title: "Dinner",
        mood: "foodie",
        startTime: "18:00",
        destinationIds: ["babi-toba-tabo", "hou-kie"],
      }),
    );
    expect(plan.coverPhoto.url).toBe("/venues/babi-toba-tabo/1.webp");
    expect(plan.tags).toEqual(["Yours"]);
  });

  it("drops ids of venues that no longer exist instead of throwing", () => {
    const plan = toPlan(
      createMyPlan({
        title: "Stale",
        mood: "foodie",
        startTime: "18:00",
        destinationIds: ["deleted-venue", "hou-kie"],
      }),
    );
    // destinationIds keeps what was saved; the derived copy skips the unknown.
    expect(plan.coverPhoto.url).toBe("/venues/hou-kie/1.webp");
    expect(plan.description).toContain("Hou Kie");
    expect(plan.description).not.toContain("deleted-venue");
  });

  it("describes a plan without claiming whose it is", () => {
    // The same text renders on a plan someone else shared with you.
    const plan = toPlan(
      createMyPlan({
        title: "Theirs",
        mood: "foodie",
        startTime: "18:00",
        destinationIds: ["hou-kie"],
      }),
    );
    expect(plan.description).not.toMatch(/your/i);
  });
});

describe("sharing a plan by link", () => {
  const sample = {
    title: "Piggy, but ours",
    mood: "foodie" as const,
    startTime: "17:00",
    destinationIds: ["bpk-ola-kisat", "babi-toba-tabo"],
  };

  it("survives the round trip", () => {
    expect(decodePlan(encodePlan(sample))).toEqual(sample);
  });

  it("keeps non-ASCII titles intact", () => {
    // btoa alone mangles these, so the encoder goes through UTF-8 bytes.
    const emoji = { ...sample, title: "Jalan-jalan sore 🍖 Yogyakarta" };
    expect(decodePlan(encodePlan(emoji))?.title).toBe(emoji.title);
  });

  it("produces a token that is safe in a URL", () => {
    const token = encodePlan(sample);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(encodeURIComponent(token)).toBe(token);
  });

  it("refuses anything that is not a plan rather than half-rendering it", () => {
    const encode = (value: unknown) =>
      Buffer.from(JSON.stringify(value)).toString("base64url");

    expect(decodePlan("not-base64-at-all!!")).toBeNull();
    expect(decodePlan(encode("a string"))).toBeNull();
    expect(decodePlan(encode(null))).toBeNull();
    // A mood outside the five the UI knows would break the filters.
    expect(decodePlan(encode({ t: "x", m: "flirty", s: "10:00", d: [] }))).toBeNull();
    expect(decodePlan(encode({ t: "x", m: "foodie", s: "teatime", d: [] }))).toBeNull();
    expect(decodePlan(encode({ t: "", m: "foodie", s: "10:00", d: [] }))).toBeNull();
    expect(decodePlan(encode({ t: "x", m: "foodie", s: "10:00", d: [1, 2] }))).toBeNull();
    expect(decodePlan(encode({ t: "x", m: "foodie", s: "10:00" }))).toBeNull();
  });

  it("caps a hand-made link so it cannot ask for thousands of stops", () => {
    const huge = { ...sample, destinationIds: Array(500).fill("hou-kie") };
    expect(decodePlan(encodePlan(huge))?.destinationIds).toHaveLength(25);
  });
});
