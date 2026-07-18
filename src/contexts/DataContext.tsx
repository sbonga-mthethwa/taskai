import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from "react";
import { fetchUsers, fetchProjects, fetchTasks, ApiUser, ApiProject, ApiTask } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { TeamMember, Project, Task } from "@/types";

interface DataContextType {
  users: TeamMember[];
  projects: Project[];
  tasks: Task[];
  loadingUsers: boolean;
  loadingProjects: boolean;
  loadingTasks: boolean;
  refreshUsers: () => Promise<void>;
  refreshProjects: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  updateTaskLocally: (taskId: string, updates: Partial<Task>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

function apiUserToTeamMember(u: ApiUser): TeamMember {
  return {
    id: u.userId || u.id || "",
    name: u.name || u.email || "Unknown User",
    email: u.email || "",
    department: u.department || "General",
    avatar: u.avatarUrl || u.avatar || "",
    role: u.role || "Employee",
    lastLogin: u.lastLogin,
    status: (u.status === "active" ? "active" : u.status === "invited" ? "invited" : "inactive") as "active" | "inactive" | "invited",
  };
}

function apiProjectToProject(p: ApiProject): Project {
  return {
    id: p.projectId || p.id || "",
    name: p.name || "",
    description: p.description,
    icon: p.icon || "📁",
    status: p.status || "no-progress",
    team: p.team || [],
    assignedUsers: p.assignedUsers || [],
    tasksCompleted: p.tasksCompleted ?? 0,
    tasksTotal: p.tasksTotal ?? 0,
    lastUpdated: p.lastUpdated || "Recently",
    dueDate: p.dueDate,
    color: p.color,
    ownerUserId: p.ownerUserId,
    createdBy: (p as any).createdBy,
    visibility: p.visibility as any,
    attachedDocuments: p.attachedDocuments,
  };
}

function apiTaskToTask(t: ApiTask): Task {
  return {
    id: t.taskId || t.id || "",
    title: t.title || "",
    description: t.description,
    project: (t as any).projectName || t.project || "Unassigned",
    projectId: t.projectId,
    parentTaskId: t.parentTaskId || (t as any).parent_task_id,
    assignee: t.assignee || "",
    assignedUsers: t.assignedUsers || [],
    dueDate: t.dueDate || "",
    status: t.status || "no-progress",
    priority: t.priority || "medium",
    color: t.color,
    attachedDocuments: t.attachedDocuments,
    createdBy: t.createdBy,
    visibility: t.visibility as any,
  };
}

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [users, setUsers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);

  const refreshUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const data = await fetchUsers();
      setUsers(data.map(apiUserToTeamMember));
    } catch (e) {
      console.error("Failed to load users:", e);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const refreshProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const data = await fetchProjects();
      setProjects(data.map(apiProjectToProject));
    } catch (e) {
      console.error("Failed to load projects:", e);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  const refreshTasks = useCallback(async () => {
    setLoadingTasks(true);
    try {
      const data = await fetchTasks();
      setTasks(data.map(apiTaskToTask));
    } catch (e) {
      console.error("Failed to load tasks:", e);
    } finally {
      setLoadingTasks(false);
    }
  }, []);

  const updateTaskLocally = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    refreshUsers();
    refreshProjects();
    refreshTasks();
  }, [isAuthenticated, refreshUsers, refreshProjects, refreshTasks]);

  const value = useMemo(() => ({
    users, projects, tasks,
    loadingUsers, loadingProjects, loadingTasks,
    refreshUsers, refreshProjects, refreshTasks,
    updateTaskLocally,
  }), [users, projects, tasks, loadingUsers, loadingProjects, loadingTasks, refreshUsers, refreshProjects, refreshTasks, updateTaskLocally]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
};
