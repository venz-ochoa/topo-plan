import { describe, it, expect } from "vitest";
import { forwardPass, projectEnd } from "./cpm.js";

//this is for the example project: A design, B build, C docs, D ship
const demo = [
  { id: "a", days: 3, dependsOn: [] },
  { id: "b", days: 5, dependsOn: ["a"] },
  { id: "c", days: 2, dependsOn: ["a"] },
  { id: "d", days: 1, dependsOn: ["b", "c"] },
];

describe("forwardPass", () => {
  it("starts tasks with no dependencies at day 0", () => {
    const r = forwardPass(demo);
    expect(r.a.earlyStart).toBe(0);
    expect(r.a.earlyFinish).toBe(3);
  });

  it("waits for the dependency to finish", () => {
    const r = forwardPass(demo);
    expect(r.b.earlyStart).toBe(3);
    expect(r.b.earlyFinish).toBe(8);
    expect(r.c.earlyFinish).toBe(5);
  });

  it("waits for the SLOWEST dependency when there are two", () => {
    const r = forwardPass(demo);
    //this is for d needing b (ends day 8) and c (ends day 5), so it starts at 8
    expect(r.d.earlyStart).toBe(8);
    expect(r.d.earlyFinish).toBe(9);
  });

  it("works no matter what order the tasks are given in", () => {
    const shuffled = [demo[3], demo[2], demo[1], demo[0]];
    const r = forwardPass(shuffled);
    expect(r.d.earlyFinish).toBe(9);
  });

  it("refuses to run when tasks form a circle", () => {
    const circle = [
      { id: "a", days: 1, dependsOn: ["b"] },
      { id: "b", days: 1, dependsOn: ["a"] },
    ];
    expect(() => forwardPass(circle)).toThrow();
  });
});

describe("projectEnd", () => {
  it("says the demo project ends on day 9", () => {
    expect(projectEnd(demo)).toBe(9);
  });
});

import { backwardPass, analyze } from "./cpm.js";

describe("backwardPass", () => {
  it("gives the last task a latest finish equal to the project end", () => {
    const r = backwardPass(demo);
    expect(r.d.latestFinish).toBe(9);
  });

  it("gives c waiting room but not b", () => {
    const r = backwardPass(demo);
    //this is for c could wait until day 6, b cannot wait at all
    expect(r.c.latestStart).toBe(6);
    expect(r.b.latestStart).toBe(3);
  });
});

describe("analyze", () => {
  it("marks a, b and d critical, c not", () => {
    const r = analyze(demo);
    expect(r.a.critical).toBe(true);
    expect(r.b.critical).toBe(true);
    expect(r.c.critical).toBe(false);
    expect(r.d.critical).toBe(true);
  });

  it("gives c exactly 3 days of slack", () => {
    const r = analyze(demo);
    expect(r.c.slack).toBe(3);
    expect(r.a.slack).toBe(0);
  });
});
