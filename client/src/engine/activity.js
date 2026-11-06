//this is for the numbers on the profile activity tracker (all from the tasks assigned to the person)
import { toDateStr, addDays } from "./schedule.js";

//this is for how many weeks the calendar of finished tasks shows
export const WEEKS = 12;

//this is for turning a task's finish time into a day text like 2026-11-06
function dayOf(iso) {
  return toDateStr(new Date(iso));
}

//this is for the whole tracker: counts, a day-by-day calendar and a line per project
export function myActivity(tasksByProject, projects, userId, now = new Date()) {
  const today = toDateStr(now);
  const mine = [];
  projects.forEach((p) =>
    (tasksByProject[p.id] || []).forEach((t) => {
      if (t.assignedTo === userId) mine.push({ ...t, projectId: p.id });
    }),
  );

  const done = mine.filter((t) => t.status === "done");
  const counts = {
    total: mine.length,
    done: done.length,
    inProgress: mine.filter((t) => t.status === "progress").length,
    todo: mine.filter((t) => t.status === "not_done").length,
    overdue: mine.filter((t) => t.status !== "done" && t.endDate < today)
      .length,
  };

  //this is for how many tasks were finished on each day
  const perDay = {};
  done.forEach((t) => {
    if (!t.finishedAt) return;
    const d = dayOf(t.finishedAt);
    perDay[d] = (perDay[d] || 0) + 1;
  });

  //this is for the calendar: WEEKS columns of 7 days, the last column ends with the end of this week (Monday first)
  const weekday = (now.getDay() + 6) % 7;
  const first = addDays(today, -(weekday + (WEEKS - 1) * 7));
  const days = [];
  for (let i = 0; i < WEEKS * 7; i++) {
    const date = addDays(first, i);
    days.push({ date, count: perDay[date] || 0, future: date > today });
  }

  //this is for the finished tasks of the last 7 days, and the run of days in a row with at least one
  const weekAgo = addDays(today, -6);
  const lastWeek = days
    .filter((d) => d.date >= weekAgo && d.date <= today)
    .reduce((n, d) => n + d.count, 0);
  let streak = 0;
  let cursor = perDay[today] ? today : addDays(today, -1);
  while (perDay[cursor]) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  //this is for one line per project: how many of your tasks are done
  const perProject = projects
    .map((p) => {
      const list = mine.filter((t) => t.projectId === p.id);
      return {
        id: p.id,
        name: p.name,
        total: list.length,
        done: list.filter((t) => t.status === "done").length,
      };
    })
    .filter((p) => p.total > 0);

  return { counts, days, lastWeek, streak, perProject };
}
