//this is for sorting tasks so every task comes after the tasks it depends on
export function sortTasks(tasks) {
  //this is for the final list we return
  const order = [];
  //this is for tasks we already placed
  const done = new Set();
  //this is for tasks we are still checking, to catch circles
  const visiting = new Set();

  //this is for checking one task and its dependencies first
  function visit(task) {
    if (done.has(task.id)) return;
    if (visiting.has(task.id)) {
      //this is for stopping when tasks depend on each other in a circle
      throw new Error("Circle found at task: " + task.id);
    }
    visiting.add(task.id);

    //this is for placing dependencies before this task
    task.dependsOn.forEach((depId) => {
      const dep = tasks.find((t) => t.id === depId);
      if (dep) visit(dep);
    });

    visiting.delete(task.id);
    done.add(task.id);
    order.push(task);
  }

  tasks.forEach(visit);
  return order;
}
