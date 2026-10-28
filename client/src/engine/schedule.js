import { sortTasks } from "./graph.js";

//this is for making a date from text like 2026-10-28
function toDate(str) {
  return new Date(str + "T00:00:00");
}

//this is for adding days to a date text and giving text back
function addDays(str, n) {
  const d = toDate(str);
  d.setDate(d.getDate() + n);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + m + "-" + day;
}

//this is for moving tasks so they start after the tasks they depend on
export function reschedule(tasks) {
  const done = {};
  sortTasks(tasks).forEach((t) => {
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
