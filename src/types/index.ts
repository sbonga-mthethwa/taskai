import { ReactNode } from "react";

export interface KpiData {
  label: string;
  value: string | number;
  trend?: { value: string; positive: boolean };
  icon: ReactNode;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  icon: string;
  status: "no-progress" | "in-progress" | "completed";
  team: string[];
  assignedUsers: string[];
  tasksCompleted: number;
  tasksTotal: number;
  lastUpdated: string;
  dueDate?: string;
  folderId?: string;
  color?: string;
  attachedDocuments?: string[];
  ownerUserId?: string;
  createdBy?: string;
  visibility?: "private" | "team" | "organization";
  sharedWith?: string[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  project: string;
  projectId?: string;
  parentTaskId?: string;
  assignee: string;
  assignedUsers: string[];
  dueDate: string;
  status: "no-progress" | "in-progress" | "completed";
  priority: "high" | "medium" | "low";
  folderId?: string;
  color?: string;
  attachedDocuments?: string[];
  createdBy?: string;
  visibility?: "private" | "team" | "organization";
}

export interface Activity {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
}

export interface FileItem {
  id: string;
  name: string;
  project: string;
  uploadedBy: string;
  date: string;
  type: string;
  folderId?: string;
  ownerUserId?: string;
  visibility?: "personal" | "shared" | "project" | "organization";
  sharedWith?: string[];
  editableBy?: string[];
  projectId?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  department: string;
  avatar: string;
  role: string;
  lastLogin?: string;
  status: "active" | "inactive" | "invited";
}

export interface Folder {
  id: string;
  name: string;
  parentFolderId?: string;
  createdBy: string;
}