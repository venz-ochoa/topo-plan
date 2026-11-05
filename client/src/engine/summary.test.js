import { describe, it, expect } from "vitest";
import { groupTasks, summarizeProject, isOverdue } from "./summary.js";
import { parseEmails, MAX_INVITES } from "../emails.js";

//this is for a fixed "now" so the tests never depend on the real date
const NOW = new Date("2026-11-05T12:00:00");

//this is for building a task with sensible defaults
function task(id, over = {}) {
  return {
    id, name: id, assignedTo: null, startDate: "2026-11-05", endDate: "2026-11-07",
    priority: "med", dependsOn: [], status: "not_done", finishedAt: null, ...over,
  };
}

describe("groupTasks", () => {
  it("puts waiting tasks that already started into ready, and future ones into later", () => {
    const g = groupTasks([
      task("today"), task("past", { startDate: "2026-11-01" }), task("future", { startDate: "2026-11-06" }),
    ], NOW);
    expect(g.ready.map((t) => t.id)).toEqual(["today", "past"]);
    expect(g.later.map((t) => t.id)).toEqual(["future"]);
  });

  it("puts tasks in progress into underway, even if their start date is in the future", () => {
    const g = groupTasks([task("a", { status: "progress", startDate: "2026-12-01" })], NOW);
    expect(g.underway).toHaveLength(1);
    expect(g.ready).toHaveLength(0);
    expect(g.later).toHaveLength(0);
  });

  it("only lists tasks completed in the last 7 days", () => {
    const g = groupTasks([
      task("recent", { status: "done", finishedAt: "2026-11-02T10:00:00" }),
      task("old", { status: "done", finishedAt: "2026-10-20T10:00:00" }),
      task("nodate", { status: "done", finishedAt: null }),
    ], NOW);
    expect(g.complete.map((t) => t.id)).toEqual(["recent"]);
  });

  it("does not change the input and handles an empty project", () => {
    expect(groupTasks([], NOW)).toEqual({ ready: [], underway: [], later: [], complete: [] });
  });
});

describe("isOverdue", () => {
  it("is overdue only when the end date passed and the task is not done", () => {
    expect(isOverdue(task("a", { endDate: "2026-11-04" }), NOW)).toBe(true);
    expect(isOverdue(task("b", { endDate: "2026-11-05" }), NOW)).toBe(false);
    expect(isOverdue(task("c", { endDate: "2026-11-01", status: "done" }), NOW)).toBe(false);
    expect(isOverdue(task("d", { endDate: "2026-11-01", status: "progress" }), NOW)).toBe(true);
  });
});

describe("summarizeProject", () => {
  it("counts everything and finds the finish date", () => {
    const s = summarizeProject([
      task("a", { status: "done", endDate: "2026-11-03" }),
      task("b", { status: "progress", assignedTo: "me", endDate: "2026-11-04" }),
      task("c", { assignedTo: "me", endDate: "2026-11-20" }),
      task("d", { assignedTo: "someone", endDate: "2026-11-10" }),
    ], "me", NOW);
    expect(s).toEqual({
      total: 4, done: 1, underway: 1, waiting: 2, overdue: 1, mine: 2, percent: 25, finishDate: "2026-11-20",
    });
  });

  it("does not count finished tasks as mine, and rounds the percentage", () => {
    const s = summarizeProject([
      task("a", { status: "done", assignedTo: "me" }), task("b"), task("c"),
    ], "me", NOW);
    expect(s.mine).toBe(0);
    expect(s.percent).toBe(33);
  });

  it("gives zeros and no finish date for a project without tasks (no divide by zero)", () => {
    expect(summarizeProject([], "me", NOW)).toEqual({
      total: 0, done: 0, underway: 0, waiting: 0, overdue: 0, mine: 0, percent: 0, finishDate: null,
    });
  });
});

describe("parseEmails", () => {
  it("splits on commas, spaces, semicolons and new lines, and lower-cases", () => {
    const r = parseEmails("A@x.com, b@x.com;c@x.com\nD@x.com   e@x.com");
    expect(r.added).toEqual(["a@x.com", "b@x.com", "c@x.com", "d@x.com", "e@x.com"]);
    expect(r.problems).toEqual([]);
  });

  it("reports bad addresses but still keeps the good ones", () => {
    const r = parseEmails("good@x.com nope @x.com a@b");
    expect(r.added).toEqual(["good@x.com"]);
    expect(r.problems).toHaveLength(3);
  });

  it("ignores repeats, both inside the text and against the existing list", () => {
    const r = parseEmails("a@x.com A@X.com b@x.com", ["b@x.com"]);
    expect(r.added).toEqual(["a@x.com"]);
    expect(r.problems).toEqual([]);
  });

  it("refuses your own email (any case) with a clear message", () => {
    const r = parseEmails("Me@x.com", [], "me@X.com");
    expect(r.added).toEqual([]);
    expect(r.problems[0]).toMatch(/your own email/);
  });

  it("stops at the limit", () => {
    const many = Array.from({ length: MAX_INVITES + 2 }, (_, i) => "u" + i + "@x.com").join(" ");
    const r = parseEmails(many);
    expect(r.added).toHaveLength(MAX_INVITES);
    expect(r.problems.length).toBeGreaterThan(0);
  });

  it("returns nothing for empty text", () => {
    expect(parseEmails("  \n ")).toEqual({ added: [], problems: [] });
  });
});
