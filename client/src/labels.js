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

//this is for describing a request like "change the status to Underway" or "move it 1 day later"
export function requestText(r) {
  if (r.kind === "status")
    return "change the status to " + status_names[r.newStatus];
  return "move it " + daysText(r.days);
}

//this is for the three kinds of people in a project: the owner (made the project, one per project), admins, and members
//in the database the owner is an admin who also has is_owner turned on, so everything an admin can do the owner can do too
export function roleName(role, isOwner) {
  if (isOwner) return "Owner";
  return role === "admin" ? "Admin" : "Member";
}

//this is for the small picture that goes with each kind of person
export function roleIcon(role, isOwner) {
  if (isOwner) return "/icons/crown.svg";
  return role === "admin" ? "/icons/shield.svg" : "/icons/user.svg";
}
