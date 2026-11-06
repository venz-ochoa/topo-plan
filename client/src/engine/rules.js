//this is for the rules about which tasks can be changed, kept apart so they can be tested
import { findChain } from "./schedule.js";

//this is for the dependencies of a task that are not complete yet (the tasks, not the ids)
export function unfinishedDeps(task, tasks) {
  return task.dependsOn
    .map((id) => tasks.find((t) => t.id === id))
    .filter((t) => t && t.status !== "done");
}

//this is for a task that can be started or finished: every task it waits for is complete
export function isUnblocked(task, tasks) {
  return unfinishedDeps(task, tasks).length === 0;
}

//this is for the words that explain why a status change is not allowed (empty when it is allowed)
export function statusBlockReason(task, newStatus, tasks) {
  if (task.status === "done") return "This task is done, so it is locked.";
  if (newStatus === "not_done") return "";
  const waiting = unfinishedDeps(task, tasks);
  if (waiting.length === 0) return "";
  return "Finish " + waiting.map((t) => t.name).join(", ") + " first.";
}

//this is for the tasks that could be chosen as the dependency of a task (not itself, not a task that waits for it)
export function dependencyChoices(task, tasks) {
  const below = findChain(task.id, tasks);
  return tasks.filter((t) => !below.includes(t.id));
}

//this is for a task nobody is assigned to: its dates, status, priority and dependency stay locked until someone is
export function needsAssignee(task) {
  return !task.assignedTo;
}
