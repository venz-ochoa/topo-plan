import { describe, it, expect } from "vitest";
import { statusBlockReason, dependencyChoices, isUnblocked } from "./rules.js";
import { shiftTask, reschedule } from "./schedule.js";

const t = (id, dependsOn = [], status = "not_done", s = "2026-11-10", e = "2026-11-12") => ({
  id, name: id, dependsOn, status, startDate: s, endDate: e,
});

describe("status rules", () => {
  it("blocks underway and complete while the dependency is not complete", () => {
    const tasks = [t("a"), t("b", ["a"])];
    expect(statusBlockReason(tasks[1], "progress", tasks)).not.toBe("");
    expect(statusBlockReason(tasks[1], "done", tasks)).not.toBe("");
    expect(isUnblocked(tasks[1], tasks)).toBe(false);
  });
  it("allows it once the dependency is complete", () => {
    const tasks = [t("a", [], "done"), t("b", ["a"])];
    expect(statusBlockReason(tasks[1], "done", tasks)).toBe("");
  });
  it("locks a complete task", () => {
    const tasks = [t("a", [], "done")];
    expect(statusBlockReason(tasks[0], "progress", tasks)).not.toBe("");
  });
});

describe("dependency choices", () => {
  it("leaves out itself and the tasks that wait for it", () => {
    const tasks = [t("a"), t("b", ["a"]), t("c", ["b"]), t("d")];
    expect(dependencyChoices(tasks[0], tasks).map((x) => x.id)).toEqual(["d"]);
  });
});

describe("complete tasks do not move", () => {
  it("shiftTask and reschedule leave them alone", () => {
    const tasks = [t("a", [], "done"), t("b", ["a"], "not_done", "2026-11-13", "2026-11-14")];
    const moved = shiftTask(tasks, "b", 1);
    expect(moved[0].startDate).toBe("2026-11-10");
    expect(moved[1].startDate).toBe("2026-11-14");
    expect(reschedule(tasks)[0].endDate).toBe("2026-11-12");
  });
});
