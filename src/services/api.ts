import { apiFetch } from "./apiBase";

// ─── User types ───
export interface ApiUser {
  userId: string;
  id?: string;
  name: string;
  email: string;
  role?: string;
  department?: string;
  contactNumber?: string;
  avatar?: string;
  avatarUrl?: string;
  avatarType?: string;
  employeeNumber?: string;
  status?: "active" | "inactive" | "invited";
  lastLogin?: string;
  phone?: string;
}

function pickUserString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) return value;
  }
  return undefined;
}

function normalizeApiUser(user: any): ApiUser {
  return {
    ...user,
    userId: pickUserString(user?.userId, user?.user_id, user?.id) ?? "",
    id: pickUserString(user?.id, user?.userId, user?.user_id),
    name: pickUserString(user?.name, user?.fullName, user?.full_name) ?? "",
    email: pickUserString(user?.email, user?.mail) ?? "",
    role: pickUserString(user?.role),
    department: pickUserString(user?.department),
    contactNumber: pickUserString(user?.contactNumber, user?.contact_number, user?.phone, user?.phone_number),
    avatar: pickUserString(user?.avatar, user?.avatarUrl, user?.avatar_url),
    avatarUrl: pickUserString(user?.avatarUrl, user?.avatar_url, user?.avatar),
    avatarType: pickUserString(user?.avatarType, user?.avatar_type),
    employeeNumber: pickUserString(user?.employeeNumber, user?.employee_number),
    status: user?.status,
    lastLogin: pickUserString(user?.lastLogin, user?.last_login),
    phone: pickUserString(user?.phone, user?.phone_number, user?.contactNumber, user?.contact_number),
  };
}

// ─── Project types ───
export interface ApiProject {
  projectId: string;
  id?: string;
  name: string;
  description?: string;
  icon?: string;
  status: "no-progress" | "in-progress" | "completed";
  team?: string[];
  assignedUsers: string[];
  tasksCompleted?: number;
  tasksTotal?: number;
  lastUpdated?: string;
  dueDate?: string;
  color?: string;
  ownerUserId?: string;
  visibility?: string;
  attachedDocuments?: string[];
}

// ─── Task types ───
export interface ApiTask {
  taskId: string;
  id?: string;
  title: string;
  description?: string;
  project: string;
  projectId?: string;
  parentTaskId?: string;
  assignee?: string;
  assignedUsers: string[];
  dueDate: string;
  status: "no-progress" | "in-progress" | "completed";
  priority: "high" | "medium" | "low";
  color?: string;
  attachedDocuments?: string[];
  createdBy?: string;
  visibility?: string;
}

// ─── Dashboard types ───
export interface ApiDashboard {
  activeProjects: number;
  tasksDueToday: number;
  overdueTasks: number;
  teamMembers: number;
  trends?: {
    activeProjects?: { value: string; positive: boolean };
    tasksDueToday?: { value: string; positive: boolean };
    overdueTasks?: { value: string; positive: boolean };
    teamMembers?: { value: string; positive: boolean };
  };
  deadlines?: Array<{
    id: string;
    title: string;
    type: "task" | "project";
    dueDate: string;
    priority?: string;
    assignedUsers?: string[];
    color?: string;
    status?: string;
    description?: string;
    project?: string;
  }>;
}

// ─── Calendar types ───
export interface ApiCalendarItem {
  id: string;
  type: "task" | "project";
  title: string;
  date: string;
  status: string;
  priority?: string;
  project?: string;
  description?: string;
  color?: string;
  assignedUsers?: string[];
}

// ─── Search types ───
export interface ApiSearchResult {
  id: string;
  type: "task" | "project" | "user" | "document";
  title: string;
  subtitle?: string;
  status?: string;
  avatar?: string;
  route?: string;
}

// ═══════════════════════════════════════
// USERS
// ═══════════════════════════════════════

export async function fetchCurrentUser(): Promise<ApiUser> {
  const data = await apiFetch<any>("/me");
  return normalizeApiUser(data?.user ?? data);
}

export async function fetchUsers(): Promise<ApiUser[]> {
  const data = await apiFetch<any>("/users");
  const arr: ApiUser[] = Array.isArray(data) ? data : data.users ?? [];
  return arr.map(normalizeApiUser);
}

export async function fetchUser(userId: string): Promise<ApiUser> {
  const u = await apiFetch<any>(`/users/${userId}`);
  return normalizeApiUser(u);
}

export async function updateUser(userId: string, updates: Partial<ApiUser>): Promise<ApiUser> {
  const user = await apiFetch<any>(`/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
  return normalizeApiUser(user);
}

// ═══════════════════════════════════════
// PROJECTS
// ═══════════════════════════════════════

export async function fetchProjects(): Promise<ApiProject[]> {
  const data = await apiFetch<any>("/projects");
  const arr: ApiProject[] = Array.isArray(data) ? data : data.projects ?? [];
  return arr.map(p => ({ ...p, id: p.projectId || p.id }));
}

export async function createProject(project: Partial<ApiProject>): Promise<ApiProject> {
  const p = await apiFetch<ApiProject>("/projects", {
    method: "POST",
    body: JSON.stringify(project),
  });
  return { ...p, id: p.projectId || p.id };
}

export async function updateProject(projectId: string, updates: Partial<ApiProject>): Promise<ApiProject> {
  return apiFetch<ApiProject>(`/projects/${projectId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export async function deleteProject(projectId: string): Promise<void> {
  return apiFetch<void>(`/projects/${projectId}`, { method: "DELETE" });
}

// ═══════════════════════════════════════
// TASKS
// ═══════════════════════════════════════

export async function fetchTasks(): Promise<ApiTask[]> {
  const data = await apiFetch<any>("/tasks");
  const arr: ApiTask[] = Array.isArray(data) ? data : data.tasks ?? [];
  return arr.map(t => ({ ...t, id: t.taskId || t.id }));
}

export async function createTask(task: Partial<ApiTask>): Promise<ApiTask> {
  const { parentTaskId, ...rest } = task as any;
  const payload = { ...rest, ...(parentTaskId !== undefined ? { parent_task_id: parentTaskId } : {}) };
  const t = await apiFetch<ApiTask>("/tasks", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return { ...t, id: t.taskId || t.id };
}

export async function updateTask(taskId: string, updates: Partial<ApiTask>): Promise<ApiTask> {
  const { parentTaskId, ...rest } = updates as any;
  const payload = { taskId, ...rest, ...(parentTaskId !== undefined ? { parent_task_id: parentTaskId } : {}) };
  return apiFetch<ApiTask>(`/tasks/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteTask(taskId: string): Promise<void> {
  return apiFetch<void>(`/tasks/${taskId}`, { method: "DELETE" });
}

// ═══════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════

export async function fetchDashboard(): Promise<ApiDashboard> {
  return apiFetch<ApiDashboard>("/dashboard");
}

// ═══════════════════════════════════════
// CALENDAR
// ═══════════════════════════════════════

export async function fetchCalendar(): Promise<ApiCalendarItem[]> {
  const data = await apiFetch<any>("/calendar");
  return Array.isArray(data) ? data : data.calendarItems ?? data.items ?? [];
}

// ═══════════════════════════════════════
// SEARCH
// ═══════════════════════════════════════

export async function searchAll(query: string): Promise<ApiSearchResult[]> {
  const data = await apiFetch<any>(`/search?q=${encodeURIComponent(query)}`);
  return Array.isArray(data) ? data : data.results ?? [];
}

// ═══════════════════════════════════════
// DOCUMENTS (re-export from documentApi)
// ═══════════════════════════════════════
export {
  fetchDocuments,
  requestUploadUrl,
  uploadFileToS3,
  createDocument,
  getDownloadUrl,
  apiDocToDocFile,
  FOLDER_TO_CATEGORY,
} from "./documentApi";
export type {
  ApiDocument,
  UploadUrlRequest,
  UploadUrlResponse,
  CreateDocumentRequest,
} from "./documentApi";
