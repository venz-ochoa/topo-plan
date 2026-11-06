import { sortTasks } from "./graph.js";
import { analyze } from "./cpm.js";

//this is for making a date from text like 2026-10-28
function toDate(str) {
  return new Date(str + "T00:00:00");
}

//this is for turning a date into text like 2026-10-28
export function toDateStr(d) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + m + "-" + day;
}

//this is for adding days to a date text and giving text back
export function addDays(str, n) {
  const d = toDate(str);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

//this is for finding a task and every task that waits for it
export function findChain(id, tasks) {
  const ids = [id];
  let added = true;
  while (added) {
    added = false;
    tasks.forEach((t) => {
      if (ids.includes(t.id)) return;
      if (t.dependsOn.some((d) => ids.includes(d))) {
        ids.push(t.id);
        added = true;
      }
    });
  }
  return ids;
}

//this is for moving tasks so they start after the tasks they depend on
export function reschedule(tasks) {
  const done = {};
  sortTasks(tasks).forEach((t) => {
    //this is for a complete task: it is finished, so it never moves
    if (t.status === "done") {
      done[t.id] = t;
      return;
    }
    //this is for how many days the task lasts
    const length = Math.round(
      (toDate(t.endDate) - toDate(t.startDate)) / 86400000,
    );

    //this is for starting the task the day after its last dependency ends
    let start = t.startDate;
    t.dependsOn.forEach((id) => {
      if (!done[id]) return;
      const next = addDays(done[id].endDate, 1);
      if (next > start) start = next;
    });

    done[t.id] = { ...t, startDate: start, endDate: addDays(start, length) };
  });

  //this is for keeping the same order as before
  return tasks.map((t) => done[t.id]);
}

//this is for counting the days a date range covers
function daysBetween(startStr, endStr) {
  return (new Date(endStr) - new Date(startStr)) / 86400000 + 1;
}

//this is for running the critical path engine on the project's tasks (gives back analysis or an error)
export function analyzeTasks(tasks) {
  const today = toDateStr(new Date());
  const engineTasks = tasks.map((t) => ({
    id: t.id,
    days: daysBetween(t.startDate, t.endDate),
    //this is for how many days after today the task starts
    startDay: (new Date(t.startDate) - new Date(today)) / 86400000,
    dependsOn: t.dependsOn,
  }));
  try {
    return { analysis: analyze(engineTasks), error: null };
  } catch (e) {
    return { analysis: null, error: e.message };
  }
}

//this is for moving a task (and the tasks that wait for it) by some days, then fixing the dates
export function shiftTask(tasks, id, days) {
  const chain = findChain(id, tasks);
  const moved = tasks.map((t) => {
    //this is for leaving tasks outside the chain, and complete tasks, where they are
    if (!chain.includes(t.id) || t.status === "done") return t;
    return {
      ...t,
      startDate: addDays(t.startDate, days),
      endDate: addDays(t.endDate, days),
    };
  });
  return reschedule(moved);
}
