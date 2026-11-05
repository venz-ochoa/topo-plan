//this is for the words shown for each status (the database values stay the same)
export const status_names = {
  not_done: "Waiting",
  progress: "Underway",
  done: "Complete",
};

//this is for the order of the status choices
export const status_list = ["not_done", "progress", "done"];

//this is for finding a person's name from their id
export function nameOf(users, id) {
  const u = users.find((u) => u.id === id);
  return u ? u.name : "Nobody";
}

//this is for describing a number of days like "2 days later" or "1 day earlier"
export function daysText(days) {
  const n = Math.abs(days);
  return n + (n === 1 ? " day" : " days") + (days > 0 ? " later" : " earlier");
}
