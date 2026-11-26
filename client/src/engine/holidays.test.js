import { describe, it, expect } from "vitest";
import { isWorkday } from "./holidays.js";
import { addWorkdays } from "./schedule.js";

describe("2027 holidays", () => {
  it("skips a holiday, together with the weekend next to it", () => {
    //this is for Wednesday Mar 24: Thursday and Friday are holidays, so the next workday is Monday
    expect(addWorkdays("2027-03-24", 1)).toBe("2027-03-29");
    expect(isWorkday("2027-11-02")).toBe(false);
    expect(isWorkday("2027-12-24")).toBe(false);
  });
  it("keeps Feb 25 as a working day", () => {
    expect(isWorkday("2027-02-25")).toBe(true);
  });
});
