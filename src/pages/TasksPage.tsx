import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Search, Plus, Circle, Clock, CheckCircle2, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import CreateItemModal, { CreateItemData } from "@/components/CreateItemModal";
import TeamMemberModal from "@/components/TeamMemberModal";
import TaskDetailPanel from "@/components/tasks/TaskDetailPanel";
import TaskFilterPopover, { TaskFilters, EMPTY_FILTERS } from "@/components/tasks/TaskFilterPopover";
import TaskListView from "@/components/tasks/TaskListView";
import TaskBoardCard from "@/components/tasks/TaskBoardCard";
import InlineTaskCreate from "@/components/tasks/InlineTaskCreate";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Task, TeamMember } from "@/types";
import { createTask as apiCreateTask, updateTask as apiUpdateTask, deleteTask as apiDeleteTask } from "@/services/api";
import { toast } from "sonner";

const COLUMNS: { key: Task["status"]; label: string; icon: typeof Circle; colorClass: string; dotClass: string; borderClass: string }[] = [
  { key: "no-progress", label: "No Progress", icon: Circle, colorClass: "text-muted-foreground", dotClass: "bg-muted-foreground/50", borderClass: "border-muted-foreground/20" },
  { key: "in-progress", label: "In Progress", icon: Clock, colorClass: "text-amber-500", dotClass: "bg-amber-500", borderClass: "border-amber-500/20" },
  { key: "completed", label: "Completed", icon: CheckCircle2, colorClass: "text-emerald-500", dotClass: "bg-emerald-500", borderClass: "border-emerald-500/20" },
];

const TasksPage = () => {
  const { user } = useAuth();
  const { tasks: allTasks, users: teamMembers, projects, refreshTasks, loadingTasks, updateTaskLocally } = useData();
  const permissions = usePermissions();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [memberModal, setMemberModal] = useState<TeamMember | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [filters, setFilters] = useState<TaskFilters>(EMPTY_FILTERS);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const visibleTasks = allTasks;

  // Build subtask map
  const subtaskMap = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of visibleTasks) {
      if (t.parentTaskId) {
        const existing = map.get(t.parentTaskId) || [];
        existing.push(t);
        map.set(t.parentTaskId, existing);
      }
    }
    return map;
  }, [visibleTasks]);

  // Only show top-level tasks (no parentTaskId) in columns
  const topLevelTasks = useMemo(() => visibleTasks.filter(t => !t.parentTaskId), [visibleTasks]);

  useEffect(() => {
    if (searchParams.get("new") === "1") setShowNewModal(true);
    const projectParam = searchParams.get("project");
    if (projectParam) {
      setFilters(prev => ({ ...prev, project: [projectParam] }));
    }
  }, [searchParams]);

  const matchesSearch = (t: Task) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const assignedNames = teamMembers.filter(m => t.assignedUsers.includes(m.id)).map(m => m.name.toLowerCase());
    return t.title.toLowerCase().includes(q) ||
      (t.description || "").toLowerCase().includes(q) ||
      t.project.toLowerCase().includes(q) ||
      t.status.replace("-", " ").includes(q) ||
      t.priority.includes(q) ||
      assignedNames.some(n => n.includes(q));
  };

  const matchesFilters = (t: Task) => {
    if (filters.status.length > 0 && !filters.status.includes(t.status)) return false;
    if (filters.priority.length > 0 && !filters.priority.includes(t.priority)) return false;
    if (filters.project.length > 0 && !filters.project.includes(t.project)) return false;
    if (filters.assignedUser.length > 0 && !t.assignedUsers.some(u => filters.assignedUser.includes(u))) return false;
    return true;
  };

  const filtered = topLevelTasks.filter(t => matchesSearch(t) && matchesFilters(t));

  const handleCreateTask = async (data: CreateItemData) => {
    if (!data.projectId) {
      toast.error("A task must belong to a project. Please select a project.");
      return;
    }
    try {
      await apiCreateTask({
        title: data.name,
        description: data.description,
        project: data.projectName || "Unassigned",
        projectId: data.projectId,
        assignedUsers: data.assignedUsers,
        dueDate: data.dueDate || "",
        status: data.status as Task["status"],
        priority: (data.priority as Task["priority"]) || "medium",
        color: data.color,
      });
      setShowNewModal(false);
      toast.success("Task created successfully");
      await refreshTasks();
    } catch (e: any) {
      toast.error(e.message || "Failed to create task");
    }
  };

  const handleInlineCreate = async (title: string, status: Task["status"], projectId?: string, projectName?: string) => {
    if (!projectId) {
      toast.error("A task must belong to a project. Please select a project.");
      return;
    }
    try {
      await apiCreateTask({
        title,
        project: projectName || "Unassigned",
        projectId,
        assignedUsers: [],
        dueDate: "",
        status,
        priority: "medium",
      });
      toast.success("Task created");
      await refreshTasks();
    } catch (e: any) {
      const msg = e.message || "Failed to create task";
      if (msg.toLowerCase().includes("project")) {
        toast.error("A task must belong to a project. Please select a project.");
      } else {
        toast.error(msg);
      }
    }
  };

  const handleTaskSave = async (updated: any) => {
    try {
      await apiUpdateTask(updated.id, {
        title: updated.title,
        description: updated.description,
        status: updated.status,
        priority: updated.priority,
        dueDate: updated.dueDate,
        assignedUsers: updated.assignedUsers,
        color: updated.color,
        attachedDocuments: updated.attachedDocuments,
        project: updated.project,
      });
      setSelectedTask(null);
      toast.success("Task updated successfully");
      await refreshTasks();
    } catch (e: any) {
      toast.error(e.message || "Failed to save changes");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await apiDeleteTask(taskId);
      toast.success("Task deleted");
      await refreshTasks();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete task");
    }
  };

  const handleQuickUpdate = useCallback(async (taskId: string, updates: Partial<Task>) => {
    updateTaskLocally(taskId, updates);
    try {
      await apiUpdateTask(taskId, updates as any);
      toast.success("Task updated");
      refreshTasks();
    } catch (e: any) {
      toast.error(e.message || "Failed to update task");
      refreshTasks();
    }
  }, [updateTaskLocally, refreshTasks]);

  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(colKey);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverCol(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, newStatus: Task["status"]) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId) return;
    const task = allTasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    const oldStatus = task.status;
    const wasSubtask = !!task.parentTaskId;

    // If subtask is dragged to a column, detach it from parent (becomes standalone)
    if (wasSubtask) {
      updateTaskLocally(taskId, { status: newStatus, parentTaskId: undefined });
      const statusLabel = newStatus === "no-progress" ? "No Progress" : newStatus === "in-progress" ? "In Progress" : "Completed";
      try {
        await apiUpdateTask(taskId, { status: newStatus, parentTaskId: null } as any);
        toast.success(`Subtask detached and moved to ${statusLabel}`);
        refreshTasks();
      } catch (err: any) {
        updateTaskLocally(taskId, { status: oldStatus, parentTaskId: task.parentTaskId });
        toast.error(err.message || "Failed to detach subtask");
      }
      return;
    }

    // Parent task: move it and all its children
    updateTaskLocally(taskId, { status: newStatus });
    const childTasks = subtaskMap.get(taskId) || [];
    childTasks.forEach(child => updateTaskLocally(child.id, { status: newStatus }));

    const statusLabel = newStatus === "no-progress" ? "No Progress" : newStatus === "in-progress" ? "In Progress" : "Completed";
    try {
      await apiUpdateTask(taskId, { status: newStatus });
      for (const child of childTasks) {
        await apiUpdateTask(child.id, { status: newStatus });
      }
      toast.success(`Task moved to ${statusLabel}`);
      refreshTasks();
    } catch (err: any) {
      updateTaskLocally(taskId, { status: oldStatus });
      childTasks.forEach(child => updateTaskLocally(child.id, { status: oldStatus }));
      toast.error(err.message || "Failed to update task status");
    }
  }, [allTasks, subtaskMap, refreshTasks, updateTaskLocally]);

  const handleDropOnTask = useCallback(async (draggedTaskId: string, targetTaskId: string) => {
    // Prevent self-nesting
    if (draggedTaskId === targetTaskId) return;

    const draggedTask = allTasks.find(t => t.id === draggedTaskId);
    const targetTask = allTasks.find(t => t.id === targetTaskId);
    if (!draggedTask || !targetTask) return;

    // Prevent circular: target can't already be a subtask of dragged
    if (targetTask.parentTaskId === draggedTaskId) {
      toast.error("Cannot create circular subtask hierarchy");
      return;
    }

    // Subtasks must belong to same project
    if (draggedTask.projectId && targetTask.projectId && draggedTask.projectId !== targetTask.projectId) {
      toast.error("Subtasks must belong to the same project");
      return;
    }

    // Don't nest subtasks under subtasks (only one level)
    if (targetTask.parentTaskId) {
      toast.error("Cannot nest subtasks more than one level deep");
      return;
    }

    updateTaskLocally(draggedTaskId, { parentTaskId: targetTaskId });
    try {
      await apiUpdateTask(draggedTaskId, { parentTaskId: targetTaskId } as any);
      toast.success("Task converted to subtask");
      // Auto-expand parent
      setExpandedTasks(prev => new Set([...prev, targetTaskId]));
      refreshTasks();
    } catch (e: any) {
      updateTaskLocally(draggedTaskId, { parentTaskId: undefined });
      toast.error(e.message || "Failed to create subtask");
      refreshTasks();
    }
  }, [allTasks, updateTaskLocally, refreshTasks]);

  const handleToggleExpand = useCallback((taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }, []);

  const handleCreateSubtask = useCallback(async (parentTaskId: string, title: string) => {
    const parent = allTasks.find(t => t.id === parentTaskId);
    if (!parent) return;
    try {
      await apiCreateTask({
        title,
        project: parent.project,
        projectId: parent.projectId,
        assignedUsers: [],
        dueDate: "",
        status: parent.status,
        priority: "medium",
        parentTaskId,
      } as any);
      toast.success("Subtask created");
      setExpandedTasks(prev => new Set([...prev, parentTaskId]));
      await refreshTasks();
    } catch (e: any) {
      toast.error(e.message || "Failed to create subtask");
    }
  }, [allTasks, refreshTasks]);

  return (
    <div className="p-4 md:p-6 h-full flex flex-col animate-fade-in">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-lg md:text-xl font-semibold tracking-tight text-foreground">Tasks</h1>
          <div className="hidden sm:flex items-center gap-2">
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center bg-muted rounded-lg p-0.5">
            <button onClick={() => setViewMode("board")} className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === "board" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              <LayoutGrid size={13} /> Board
            </button>
            <button onClick={() => setViewMode("list")} className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              <List size={13} /> List
            </button>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="h-8 w-32 sm:w-48 pl-8 pr-3 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60" />
          </div>
          {permissions.canCreateTask && (
            <Button size="sm" className="h-8 gap-1 text-sm font-medium" onClick={() => setShowNewModal(true)}>
              <Plus size={15} /> <span className="hidden sm:inline">Add Task</span><span className="sm:hidden">Add</span>
            </Button>
          )}
        </div>
      </div>

      {viewMode === "board" ? (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 min-h-0">
          {COLUMNS.map(col => {
            const Icon = col.icon;
            const columnTasks = filtered.filter(t => t.status === col.key);
            const isDragOver = dragOverCol === col.key;
            return (
              <div
                key={col.key}
                className={`flex flex-col min-h-0 rounded-xl transition-all duration-200 ${isDragOver ? "bg-primary/5 ring-2 ring-primary/20 scale-[1.01]" : ""}`}
                onDragOver={e => handleDragOver(e, col.key)}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, col.key)}
              >
                <div className={`flex items-center gap-2 mb-3 pb-2 border-b-2 ${col.borderClass}`}>
                  <Icon size={16} className={col.colorClass} />
                  <span className="text-sm font-semibold text-foreground">{col.label}</span>
                  <span className="ml-auto text-xs font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">{columnTasks.length}</span>
                </div>
                <ScrollArea className="flex-1 -mr-1 pr-1">
                  <div className="space-y-2.5 pb-2">
                    {columnTasks.length === 0 && (
                      <div className="text-center py-10">
                        {isDragOver ? (
                          <p className="text-sm font-medium text-primary animate-pulse">Drop here</p>
                        ) : (
                          <>
                            <p className="text-xs font-medium text-muted-foreground">No tasks here yet</p>
                            <p className="text-[11px] text-muted-foreground/60 mt-1">Drag tasks here or create a new task</p>
                          </>
                        )}
                      </div>
                    )}
                    {columnTasks.map(task => (
                      <TaskBoardCard
                        key={task.id}
                        task={task}
                        teamMembers={teamMembers}
                        subtasks={subtaskMap.get(task.id) || []}
                        expandedTasks={expandedTasks}
                        onSelect={setSelectedTask}
                        onDragStart={handleDragStart}
                        onDelete={handleDeleteTask}
                        onQuickUpdate={handleQuickUpdate}
                        onDropOnTask={handleDropOnTask}
                        onToggleExpand={handleToggleExpand}
                      />
                    ))}
                  </div>
                  {permissions.canCreateTask && (
                    <div className="pb-4 pt-1">
                      <InlineTaskCreate
                        status={col.key}
                        onSubmit={handleInlineCreate}
                        projects={projects.map(p => ({ id: p.id, name: p.name }))}
                      />
                    </div>
                  )}
                </ScrollArea>
              </div>
            );
          })}
        </div>
      ) : (
        <TaskListView tasks={filtered} onTaskClick={setSelectedTask} />
      )}

      <CreateItemModal type="task" open={showNewModal} onClose={() => setShowNewModal(false)} onCreate={handleCreateTask} />
      <TeamMemberModal member={memberModal} open={!!memberModal} onOpenChange={o => { if (!o) setMemberModal(null); }} />

      {selectedTask && (
        <TaskDetailPanel
          item={{
            type: "task",
            id: selectedTask.id,
            title: selectedTask.title,
            description: selectedTask.description,
            status: selectedTask.status,
            priority: selectedTask.priority,
            project: selectedTask.project,
            projectId: selectedTask.projectId,
            color: selectedTask.color,
            assignedUsers: selectedTask.assignedUsers,
            dueDate: selectedTask.dueDate,
            attachedDocuments: selectedTask.attachedDocuments,
            createdBy: selectedTask.createdBy,
          }}
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onSave={handleTaskSave}
          subtasks={subtaskMap.get(selectedTask.id) || []}
          onCreateSubtask={handleCreateSubtask}
          onSubtaskClick={setSelectedTask}
        />
      )}
    </div>
  );
};

export default TasksPage;
