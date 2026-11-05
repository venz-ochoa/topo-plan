//this is for the numbers and task lists the dashboard shows for each project
import { toDateStr } from "./schedule.js";

//this is for sorting a project's tasks into the four lists (the dashboards share this)
export function groupTasks(tasks, now = new Date()) {
  const today = toDateStr(now);
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  return {
    ready: tasks.filter((t) => t.status === "not_done" && t.startDate <= today),
    underway: tasks.filter((t) => t.status === "progress"),
    later: tasks.filter((t) => t.status === "not_done" && t.startDate > today),
    complete: tasks.filter(
      (t) => t.status === "done" && t.finishedAt && new Date(t.finishedAt) >= weekAgo,
    ),
  };
}

//this is for a task that should be finished by now but is not
export function isOverdue(task, now = new Date()) {
  return task.status !== "done" && task.endDate < toDateStr(now);
}

//this is for the one line summary of a project: counts, progress, the finish date
export function summarizeProject(tasks, userId, now = new Date()) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const underway = tasks.filter((t) => t.status === "progress").length;
  const overdue = tasks.filter((t) => isOverdue(t, now)).length;
  const mine = tasks.filter((t) => t.assignedTo === userId && t.status !== "done").length;

  //this is for the last end date of any task (null when there are no tasks)
  let finishDate = null;
  tasks.forEach((t) => {
    if (!finishDate || t.endDate > finishDate) finishDate = t.endDate;
  });

  return {
    total,
    done,
    underway,
    waiting: total - done - underway,
    overdue,
    mine,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
    finishDate,
  };
}
