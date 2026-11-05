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
    .select("role, projects(id, name)")
    .eq("user_id", userId);
  if (error) throw error;
  return data
    .map((r) => ({ id: r.projects.id, name: r.projects.name, role: r.role }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

//this is for making a new project (the creator becomes admin), gives back the project id
export async function createProject(name) {
  const { data, error } = await supabase.rpc("create_project", {
    project_name: name,
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
