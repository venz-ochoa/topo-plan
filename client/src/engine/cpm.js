//this is for the forward pass of the critical path method
import { sortTasks } from "./graph.js";

//this is for finding the earliest start and finish of every task
export function forwardPass(tasks) {
  //this is for the sorted order, so dependencies are always done first
  const sorted = sortTasks(tasks);

  //this is for remembering the results, with the task id as the key
  const result = {};

  //this is for walking through the tasks in the correct order
  sorted.forEach((task) => {
    //this is for finding the latest finish among this task's dependencies (0 if none)
    let start = task.startDay || 0;
    task.dependsOn.forEach((depId) => {
      const dep = result[depId];
      if (dep && dep.earlyFinish > start) {
        start = dep.earlyFinish;
      }
    });

    //this is for saving the earliest start and finish of this task
    result[task.id] = {
      earlyStart: start,
      earlyFinish: start + task.days,
    };
  });

  return result;
}

//this is for the earliest day the whole project can finish
export function projectEnd(tasks) {
  //this is for running the forward pass first
  const result = forwardPass(tasks);

  //this is for picking the biggest earlyFinish of all tasks
  let end = 0;
  tasks.forEach((t) => {
    if (result[t.id].earlyFinish > end) {
      end = result[t.id].earlyFinish;
    }
  });
  return end;
}

//this is for the backward pass of the critical path method
export function backwardPass(tasks) {
  //this is for the forward results, we need the project end from them
  const forward = forwardPass(tasks);
  const sorted = sortTasks(tasks);

  //this is for the earliest day the whole project can finish
  let end = 0;
  tasks.forEach((t) => {
    if (forward[t.id].earlyFinish > end) {
      end = forward[t.id].earlyFinish;
    }
  });

  //this is for the results by task id
  const result = {};

  //this is for walking the tasks in REVERSE order, dependencies last
  for (let i = sorted.length - 1; i >= 0; i--) {
    const task = sorted[i];

    //this is for the latest finish, starting from the project end
    let finish = end;

    //this is for checking every task that waits for this one
    sorted.forEach((other) => {
      if (other.dependsOn.includes(task.id)) {
        const waiting = result[other.id];
        if (waiting && waiting.latestStart < finish) {
          finish = waiting.latestStart;
        }
      }
    });

    //this is for saving the latest finish and start of this task
    result[task.id] = {
      latestFinish: finish,
      latestStart: finish - task.days,
    };
  }

  return result;
}

//this is for the full analysis: early, late, slack, and the critical flag
export function analyze(tasks) {
  //this is for running both passes
  const forward = forwardPass(tasks);
  const backward = backwardPass(tasks);

  //this is for combining the two passes for every task
  const result = {};
  tasks.forEach((t) => {
    const f = forward[t.id];
    const b = backward[t.id];

    //this is for the breathing room: latest start minus earliest start
    const slack = b.latestStart - f.earlyStart;

    result[t.id] = {
      earlyStart: f.earlyStart,
      earlyFinish: f.earlyFinish,
      latestStart: b.latestStart,
      latestFinish: b.latestFinish,
      slack: slack,
      critical: slack === 0,
    };
  });
  return result;
}
