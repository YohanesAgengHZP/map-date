import { describe, expect, it } from "vitest";
import { DESTINATIONS } from "@/data/destinations";
import { checkOpeningHours, parseOpeningHours } from "./openingHours";

const at = (hours: string, arrival: number, departure = arrival + 60) =>
  checkOpeningHours({ openingHours: hours }, arrival, departure);

const clock = (h: number, m = 0) => h * 60 + m;

describe("parseOpeningHours", () => {
  it("reads OSM syntax and the hand-written display strings alike", () => {
    expect(parseOpeningHours("Mo-Su 11:00-22:00")).toEqual([
      { start: 660, end: 1320 },
    ]);
    // The seed data uses an en dash and spaces.
    expect(parseOpeningHours("11:00 – 22:00")).toEqual([
      { start: 660, end: 1320 },
    ]);
  });

  it("keeps every window in a multi-rule string", () => {
    expect(parseOpeningHours("Mo-Fr 08:00-12:00,13:00-17:00; Sa 09:00-14:00")).toEqual(
      [
        { start: 480, end: 720 },
        { start: 780, end: 1020 },
        { start: 540, end: 840 },
      ],
    );
  });

  it("runs a window past midnight rather than discarding it as backwards", () => {
    expect(parseOpeningHours("Fr-Sa 22:00-02:00")).toEqual([
      { start: 1320, end: 1560 },
    ]);
  });

  it("treats 24/7 and 00:00-24:00 as open all day", () => {
    expect(parseOpeningHours("24/7")).toEqual([{ start: 0, end: 1440 }]);
    expect(parseOpeningHours("Mo-Su 00:00-24:00")).toEqual([
      { start: 0, end: 1440 },
    ]);
  });

  it("says it does not know rather than guessing", () => {
    // Unknown must never read as closed: most venues in this app have no
    // hours at all, and four of the seed restaurants are blank on purpose.
    expect(parseOpeningHours(undefined)).toBeNull();
    expect(parseOpeningHours("")).toBeNull();
    expect(parseOpeningHours("By appointment")).toBeNull();
    expect(parseOpeningHours("Mo-Fr sunrise-sunset")).toBeNull();
    expect(parseOpeningHours("Mo-Fr 99:00-17:00")).toBeNull();
  });
});

describe("checkOpeningHours", () => {
  it("flags an arrival after closing time", () => {
    // The case that ruins an afternoon: the scheduler used to put you here.
    expect(at("11:00 – 22:00", clock(22, 30))).toBe("closed-on-arrival");
    expect(at("Mo-Su 09:00-17:00", clock(8))).toBe("closed-on-arrival");
  });

  it("counts arriving exactly at closing time as arriving at a locked door", () => {
    expect(at("11:00 – 22:00", clock(22))).toBe("closed-on-arrival");
  });

  it("flags a visit that runs past closing", () => {
    // 21:00 for ninety minutes somewhere that shuts at 22:00.
    expect(at("11:00 – 22:00", clock(21), clock(22, 30))).toBe(
      "closes-during-visit",
    );
  });

  it("lets a visit end exactly at closing time", () => {
    expect(at("11:00 – 22:00", clock(20, 30), clock(22))).toBeNull();
  });

  it("says nothing when the stop fits", () => {
    expect(at("11:00 – 22:00", clock(12), clock(13, 30))).toBeNull();
    expect(at("24/7", clock(3))).toBeNull();
  });

  it("says nothing when the hours are unknown", () => {
    expect(at("", clock(3))).toBeNull();
    expect(checkOpeningHours({}, clock(3), clock(4))).toBeNull();
  });

  it("stays quiet when only some days would be shut", () => {
    // 08:30 is inside the weekday window and outside the Saturday one. The
    // plan carries no date, so claiming "closed" here would be a guess.
    expect(at("Mo-Fr 08:00-17:00; Sa 09:00-14:00", clock(8, 30), clock(9, 30)))
      .toBeNull();
    // 19:00 is outside both, which holds whichever day you go.
    expect(at("Mo-Fr 08:00-17:00; Sa 09:00-14:00", clock(19))).toBe(
      "closed-on-arrival",
    );
  });

  it("handles a venue open past midnight", () => {
    expect(at("Fr-Sa 22:00-02:00", clock(23), clock(24, 30))).toBeNull();
    expect(at("Fr-Sa 22:00-02:00", clock(3))).toBe("closed-on-arrival");
  });

  it("reads the hours the seed data actually carries", () => {
    // Guards the format, not the venues: a rewrite of these strings that this
    // parser cannot read would silently turn the whole check off.
    const stated = DESTINATIONS.filter((d) => d.openingHours);
    expect(stated.length).toBeGreaterThan(0);
    for (const destination of stated) {
      expect(parseOpeningHours(destination.openingHours)).not.toBeNull();
    }
  });
});
