import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";

export type ResourceVisibility = "private" | "team" | "organization";
export type DocVisibility = "personal" | "shared" | "project" | "organization";

export interface PermissionContext {
  userId: string;

  // Global permissions - all authenticated users can do these
  canAccessSettings: boolean;
  canCreateProject: boolean;
  canCreateTask: boolean;
  canUploadDocuments: boolean;
  canViewAllProfiles: boolean;
  canMessage: boolean;

  // Project-ownership-based permissions
  isProjectOwner: (project: { ownerUserId?: string; createdBy?: string }) => boolean;
  canEditProject: (project: { ownerUserId?: string; createdBy?: string }) => boolean;
  canDeleteProject: (project: { ownerUserId?: string; createdBy?: string }) => boolean;
  canManageProjectMembers: (project: { ownerUserId?: string; createdBy?: string }) => boolean;
  canViewProject: () => boolean;

  // Task permissions - based on project membership
  canEditTask: (task: { createdBy?: string; assignedUsers?: string[]; projectId?: string }) => boolean;
  canViewTask: () => boolean;
  canDeleteTask: (task: { createdBy?: string }) => boolean;
  canCompleteTask: (task: { assignedUsers?: string[]; createdBy?: string; projectId?: string }) => boolean;
  canChangeTaskStatus: (task: { assignedUsers?: string[]; createdBy?: string; projectId?: string }) => boolean;

  // Document permissions
  canViewDocument: () => boolean;
  canEditDocument: (doc: { ownerUserId?: string; editableBy?: string[] }) => boolean;
  canDeleteDocument: (doc: { ownerUserId?: string }) => boolean;
  canShareDocument: (doc: { ownerUserId?: string }) => boolean;
}

export const usePermissions = (): PermissionContext => {
  const { user } = useAuth();
  const { projects } = useData();
  const userId = user?.id || "";

  return useMemo<PermissionContext>(() => {
    const isOwner = (resource: { ownerUserId?: string; createdBy?: string }) =>
      !!(userId && (resource.ownerUserId === userId || resource.createdBy === userId));

    // Check if user is a member of the project (owner, assigned, or in team)
    const isProjectMember = (projectId?: string) => {
      if (!userId || !projectId) return false;
      const project = projects.find(p => p.id === projectId);
      if (!project) return false;
      if (project.ownerUserId === userId || project.createdBy === userId) return true;
      if (project.assignedUsers?.includes(userId)) return true;
      if (project.team?.includes(userId)) return true;
      return false;
    };

    return {
      userId,

      // All authenticated users can do these
      canAccessSettings: true,
      canCreateProject: true,
      canCreateTask: true,
      canUploadDocuments: true,
      canViewAllProfiles: true,
      canMessage: true,

      // Project ownership checks
      isProjectOwner: isOwner,
      canEditProject: isOwner,
      canDeleteProject: isOwner,
      canManageProjectMembers: isOwner,
      canViewProject: () => true,

      // Tasks: any project member can edit/complete/change status
      canEditTask: (task) => {
        if (task.createdBy === userId) return true;
        if (task.assignedUsers?.includes(userId)) return true;
        if (isProjectMember(task.projectId)) return true;
        return false;
      },
      canViewTask: () => true,
      canDeleteTask: (task) => task.createdBy === userId,
      canCompleteTask: (task) => {
        if (task.createdBy === userId) return true;
        if (task.assignedUsers?.includes(userId)) return true;
        if (isProjectMember(task.projectId)) return true;
        return false;
      },
      canChangeTaskStatus: (task) => {
        if (task.createdBy === userId) return true;
        if (task.assignedUsers?.includes(userId)) return true;
        if (isProjectMember(task.projectId)) return true;
        return false;
      },

      // Documents: owner can manage
      canViewDocument: () => true,
      canEditDocument: (doc) => {
        if (doc.ownerUserId === userId) return true;
        if (doc.editableBy?.includes(userId)) return true;
        return false;
      },
      canDeleteDocument: (doc) => doc.ownerUserId === userId,
      canShareDocument: (doc) => doc.ownerUserId === userId,
    };
  }, [userId, projects]);
};
