//this is for every talk between the app and the database
import { supabase } from "./supabase.js";

//this is for turning a database row into the task shape the app uses
function fromRow(r) {
  return {
    id: r.id,
    name: r.name,
    assignedTo: r.assigned_to,
    startDate: r.start_date,
    endDate: r.end_date,
    priority: r.priority,
    dependsOn: r.depends_on,
    status: r.status,
    finishedAt: r.finished_at,
  };
}

//this is for turning a task into a database row (status is left out on purpose)
export function toRow(t, projectId) {
  return {
    id: t.id,
    project_id: projectId,
    name: t.name,
    assigned_to: t.assignedTo || null,
    start_date: t.startDate,
    end_date: t.endDate,
    priority: t.priority,
    depends_on: t.dependsOn,
  };
}

//this is for turning a request row into the shape the app uses
function requestFromRow(r) {
  return {
    id: r.id,
    taskId: r.task_id,
    requestedBy: r.requested_by,
    kind: r.kind,
    days: r.days,
    newStatus: r.new_status,
    reason: r.reason,
    status: r.status,
    createdAt: r.created_at,
  };
}

//this is for finding every project the user is in, with their role in each
export async function getMyProjects(userId) {
  const { data, error } = await supabase
    .from("roles")
    .select("role, projects(id, name, description)")
    .eq("user_id", userId);
  if (error) throw error;
  return data
    .map((r) => ({
      id: r.projects.id,
      name: r.projects.name,
      description: r.projects.description || "",
      role: r.role,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

//this is for making a new project (the creator becomes admin) and making an invite for each email
//it gives back { id, invites: [{ email, code }] }
export async function createProject(name, description = "", emails = []) {
  const { data, error } = await supabase.rpc("create_project", {
    project_name: name,
    project_description: description,
    invite_emails: emails,
  });
  if (error) throw error;
  return data;
}

//this is for joining a project with an invite code, gives back the project id
export async function joinProject(code) {
  const { data, error } = await supabase.rpc("join_project", {
    invite_code: code,
  });
  if (error) throw error;
  return data;
}

//this is for getting the user's own name
export async function getMyName(userId) {
  const { data, error } = await supabase
    .from("users")
    .select("name")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data.name;
}

//this is for saving the user's own name
export async function saveMyName(userId, name) {
  const { data, error } = await supabase
    .from("users")
    .update({ name: name })
    .eq("id", userId)
    .select("name");
  if (error) throw error;
  if (data.length === 0) throw new Error("Could not save the name");
}

//this is for getting the names and roles of everyone in the project
export async function getUsers(projectId) {
  const { data, error } = await supabase
    .from("roles")
    .select("user_id, role, users(name)")
    .eq("project_id", projectId);
  if (error) throw error;
  return data
    .map((r) => ({
      id: r.user_id,
      name: r.users && r.users.name ? r.users.name : "Unnamed",
      role: r.role,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

//this is for getting all tasks of a project
export async function getTasks(projectId) {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at");
  if (error) throw error;
  return data.map(fromRow);
}

//this is for saving new or changed tasks (admins only)
export async function saveTasks(projectId, tasks) {
  if (tasks.length === 0) return;
  const { error } = await supabase
    .from("tasks")
    .upsert(tasks.map((t) => toRow(t, projectId)));
  if (error) throw error;
}

//this is for an admin changing the status of a task assigned to themselves
export async function updateStatus(taskId, status) {
  const { error } = await supabase.rpc("set_task_status", {
    task_id: taskId,
    new_status: status,
  });
  if (error) throw error;
}

//this is for getting the requests (admins see all, members see their own)
export async function getRequests(projectId) {
  const { data, error } = await supabase
    .from("requests")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(requestFromRow);
}

//this is for asking the admin for a change: kind 'status' (with newStatus) or 'extension' (days is 1 or -1)
export async function sendRequest({
  projectId,
  taskId,
  userId,
  kind,
  days,
  newStatus,
  reason,
}) {
  const { error } = await supabase.from("requests").insert({
    project_id: projectId,
    task_id: taskId,
    requested_by: userId,
    kind: kind,
    days: days,
    new_status: newStatus,
    reason: reason,
  });
  if (error) {
    //this is for the friendly message when the same kind of request is already waiting
    if (error.code === "23505")
      throw new Error(
        "You already have a request of this kind waiting for this task.",
      );
    throw error;
  }
}

//this is for an admin approving or denying a request
export async function decideRequest(requestId, approve) {
  const { error } = await supabase.rpc("decide_request", {
    request_id: requestId,
    approve: approve,
  });
  if (error) throw error;
}

//this is for making an invite code (admins only)
export async function makeInvite(projectId, role, userId) {
  const { data, error } = await supabase
    .from("invites")
    .insert({ project_id: projectId, role: role, created_by: userId })
    .select("code")
    .single();
  if (error) throw error;
  return data.code;
}

//this is for the dashboard: the tasks, the number of people and the waiting requests of every project at once
//(one question per table instead of one per project)
export async function getOverview(projectIds) {
  const out = { tasks: {}, members: {}, pending: {} };
  projectIds.forEach((id) => {
    out.tasks[id] = [];
    out.members[id] = 0;
    out.pending[id] = 0;
  });
  if (projectIds.length === 0) return out;

  const [t, r, q] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .in("project_id", projectIds)
      .order("created_at"),
    supabase.from("roles").select("project_id").in("project_id", projectIds),
    supabase
      .from("requests")
      .select("project_id")
      .eq("status", "pending")
      .in("project_id", projectIds),
  ]);
  if (t.error) throw t.error;
  if (r.error) throw r.error;
  if (q.error) throw q.error;

  t.data.forEach((row) => out.tasks[row.project_id].push(fromRow(row)));
  r.data.forEach((row) => (out.members[row.project_id] += 1));
  //this is for admins only: members only see their own requests, so the number would be misleading
  q.data.forEach((row) => (out.pending[row.project_id] += 1));
  return out;
}

//this is for the invites waiting for the logged in user's email address
export async function getMyInvites() {
  const { data, error } = await supabase.rpc("my_pending_invites");
  if (error) throw error;
  return data.map((r) => ({
    code: r.code,
    projectId: r.project_id,
    projectName: r.project_name,
    description: r.project_description,
    role: r.role,
    invitedBy: r.invited_by_name,
    expiresAt: r.expires_at,
  }));
}

//this is for saying no to an invite
export async function declineInvite(code) {
  const { error } = await supabase.rpc("decline_invite", { invite_code: code });
  if (error) throw error;
}

//this is for deleting a task (admins only)
export async function deleteTask(taskId) {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw error;
}

//this is for leaving a project (userId is yourself) or removing a member (admins only)
export async function removeFromProject(projectId, userId) {
  const { error } = await supabase.rpc("remove_from_project", {
    pid: projectId,
    uid: userId,
  });
  if (error) throw error;
}

//this is for running a function whenever rows change in these tables (live updates)
//it waits a moment so many quick changes only cause one reload, and gives back a function that stops listening
export function onChange(tables, callback) {
  let timer;
  const run = () => {
    clearTimeout(timer);
    timer = setTimeout(callback, 300);
  };
  const channel = supabase.channel("live-" + crypto.randomUUID());
  tables.forEach((table) =>
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      run,
    ),
  );
  channel.subscribe();
  return () => {
    clearTimeout(timer);
    supabase.removeChannel(channel);
  };
}

//this is for getting the user's latest notifications (the database only gives back their own)
export async function getNotifications() {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
}

//this is for marking all of the user's notifications as read
export async function markAllRead() {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("read", false);
  if (error) throw error;
}
