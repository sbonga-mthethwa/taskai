import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Users, CheckCircle2, Save, Pencil, CalendarDays, Search, ChevronDown, Paperclip, Lock, Plus, GitBranch, MessageSquare } from "lucide-react";
import ActivityComments from "@/components/ActivityComments";
import { format, isValid, parse } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import StatusBadge from "@/components/StatusBadge";
import UserMultiSelect from "@/components/UserMultiSelect";
import DocumentAttachments from "@/components/DocumentAttachments";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { toast } from "sonner";

interface TaskDetailPanelProps {
  item: {
    type: "task" | "project";
    id: string;
    title: string;
    description?: string;
    status: string;
    priority?: string;
    project?: string;
    projectId?: string;
    color?: string;
    assignedUsers?: string[];
    dueDate?: string;
    attachedDocuments?: string[];
    createdBy?: string;
    ownerUserId?: string;
  };
  open: boolean;
  onClose: () => void;
  onSave?: (updated: any) => void;
  subtasks?: { id: string; title: string; status: string; priority?: string }[];
  onCreateSubtask?: (parentTaskId: string, title: string) => void;
  onSubtaskClick?: (task: any) => void;
}

const STATUS_OPTIONS = ["no-progress", "in-progress", "completed"];
const PRIORITY_OPTIONS: ("high" | "medium" | "low")[] = ["high", "medium", "low"];
const COLOR_SWATCHES = [
  "#6D5EF8", "#8B5CF6", "#FF4D8D", "#F59E0B", "#10B981",
  "#3B82F6", "#EF4444", "#EC4899", "#14B8A6", "#6366F1",
];

const parseStoredDueDate = (value?: string) => {
  if (!value) return undefined;

  const parsedWithYear = parse(value, "MMM d, yyyy", new Date());
  if (isValid(parsedWithYear)) return parsedWithYear;

  const parsedWithoutYear = parse(value, "MMM d", new Date());
  if (isValid(parsedWithoutYear)) return parsedWithoutYear;

  return undefined;
};

const ProjectEditDropdown = ({ value, onChange }: { value: string; onChange: (name: string) => void }) => {
  const { projects: allProjects } = useData();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(() => {
    if (!search) return allProjects;
    const q = search.toLowerCase();
    return allProjects.filter(p => p.name.toLowerCase().includes(q));
  }, [search]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-10 px-3 text-sm bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 flex items-center justify-between text-left"
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>{value || "Select project..."}</span>
        <ChevronDown size={14} className="text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search projects..."
                className="w-full h-8 pl-7 pr-3 text-xs bg-muted/50 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-44 overflow-y-auto py-1">
            {filtered.length === 0 && <div className="px-3 py-2 text-xs text-muted-foreground text-center">No projects found</div>}
            {filtered.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onChange(p.name);
                  setOpen(false);
                  setSearch("");
                }}
                className={cn(
                  "w-full px-3 py-2 text-sm text-left hover:bg-muted/60 transition-colors flex items-center gap-2",
                  value === p.name ? "bg-primary/5 text-primary font-medium" : "text-foreground",
                )}
              >
                <span>{p.icon}</span>
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const STATUS_LABELS: Record<string, string> = {
  "no-progress": "No Progress",
  "in-progress": "In Progress",
  "completed": "Completed",
};

const PRIORITY_BADGE: Record<string, { bg: string; text: string }> = {
  high: { bg: "bg-orange-500/10", text: "text-orange-500" },
  medium: { bg: "bg-blue-500/10", text: "text-blue-500" },
  low: { bg: "bg-muted", text: "text-muted-foreground" },
};

const SubtasksSection = ({
  subtasks,
  onCreateSubtask,
  onSubtaskClick,
  canCreate,
}: {
  subtasks: { id: string; title: string; status: string; priority?: string }[];
  onCreateSubtask?: (title: string) => void;
  onSubtaskClick?: (task: any) => void;
  canCreate: boolean;
}) => {
  const [showInput, setShowInput] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const handleSubmit = () => {
    const trimmed = newTitle.trim();
    if (!trimmed || !onCreateSubtask) return;
    onCreateSubtask(trimmed);
    setNewTitle("");
    setShowInput(false);
  };

  return (
    <section className="space-y-3 pt-1 border-t border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch size={14} className="text-muted-foreground" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Subtasks {subtasks.length > 0 && `(${subtasks.length})`}
          </p>
        </div>
        {canCreate && onCreateSubtask && !showInput && (
          <button
            onClick={() => setShowInput(true)}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
          >
            <Plus size={12} /> Add subtask
          </button>
        )}
      </div>

      {subtasks.length > 0 && (
        <div className="space-y-1.5">
          {subtasks.map(sub => {
            const prioBadge = PRIORITY_BADGE[sub.priority || "medium"] || PRIORITY_BADGE.medium;
            return (
              <button
                key={sub.id}
                onClick={() => onSubtaskClick?.(sub)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted/30 transition-colors text-left group"
              >
                <CheckCircle2
                  size={14}
                  className={sub.status === "completed" ? "text-emerald-500" : "text-muted-foreground/40"}
                />
                <span className={`text-sm flex-1 truncate ${sub.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {sub.title}
                </span>
                {sub.priority && (
                  <span className={`text-[10px] font-semibold rounded px-1.5 py-0.5 ${prioBadge.bg} ${prioBadge.text} capitalize`}>
                    {sub.priority}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground">
                  {STATUS_LABELS[sub.status] || sub.status}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {subtasks.length === 0 && !showInput && (
        <p className="text-xs text-muted-foreground/60 pl-1">No subtasks yet</p>
      )}

      {showInput && (
        <div className="flex items-center gap-2">
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") { e.preventDefault(); handleSubmit(); }
              if (e.key === "Escape") { setNewTitle(""); setShowInput(false); }
            }}
            placeholder="Subtask title..."
            className="flex-1 text-sm bg-muted/30 border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50"
            autoFocus
          />
          <button
            onClick={handleSubmit}
            disabled={!newTitle.trim()}
            className="text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-40 disabled:cursor-not-allowed px-2 py-1.5"
          >
            Add
          </button>
          <button
            onClick={() => { setNewTitle(""); setShowInput(false); }}
            className="text-xs text-muted-foreground hover:text-foreground px-1"
          >
            Cancel
          </button>
        </div>
      )}
    </section>
  );
};

const TaskDetailPanel = ({ item, open, onClose, onSave, subtasks = [], onCreateSubtask, onSubtaskClick }: TaskDetailPanelProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { users: teamMembers } = useData();
  const permissions = usePermissions();
  const isTask = item.type === "task";

  // Permission checks
  const canEdit = isTask
    ? permissions.canEditTask({ createdBy: item.createdBy, assignedUsers: item.assignedUsers, projectId: item.projectId })
    : permissions.isProjectOwner({ ownerUserId: item.ownerUserId, createdBy: item.createdBy });
  const canComplete = isTask ? permissions.canCompleteTask({ assignedUsers: item.assignedUsers, createdBy: item.createdBy, projectId: item.projectId }) : false;
  const canChangeStatus = isTask
    ? permissions.canChangeTaskStatus({ assignedUsers: item.assignedUsers, createdBy: item.createdBy, projectId: item.projectId })
    : canEdit;
  const canAssign = true;

  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description || "");
  const [status, setStatus] = useState(item.status);
  const [priority, setPriority] = useState(item.priority || "medium");
  const [dueDate, setDueDate] = useState(item.dueDate || "");
  const [assignedUsers, setAssignedUsers] = useState<string[]>(item.assignedUsers || []);
  const [color, setColor] = useState(item.color || "#6D5EF8");
  const [attachedDocuments, setAttachedDocuments] = useState<string[]>(item.attachedDocuments || []);
  const [project, setProject] = useState(item.project || "");
  const [editing, setEditing] = useState(false);
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(parseStoredDueDate(item.dueDate));

  useEffect(() => {
    setTitle(item.title);
    setDescription(item.description || "");
    setStatus(item.status);
    setPriority(item.priority || "medium");
    setDueDate(item.dueDate || "");
    setAssignedUsers(item.assignedUsers || []);
    setColor(item.color || "#6D5EF8");
    setAttachedDocuments(item.attachedDocuments || []);
    setProject(item.project || "");
    setEditing(false);
    setCalendarDate(parseStoredDueDate(item.dueDate));
  }, [item]);

  const editingEnabled = canEdit && (isTask || editing);
  const assignedMembers = teamMembers.filter(m => assignedUsers.includes(m.id));
  const dueDateDisplay = dueDate || "—";

  const handleSave = () => {
    onSave?.({ ...item, title, description, status, priority, dueDate, assignedUsers, color, attachedDocuments, project });
    toast.success(isTask ? "Task updated successfully" : "Project updated successfully");
    if (!isTask) setEditing(false);
  };

  const handleCancel = () => {
    setTitle(item.title);
    setDescription(item.description || "");
    setStatus(item.status);
    setPriority(item.priority || "medium");
    setDueDate(item.dueDate || "");
    setAssignedUsers(item.assignedUsers || []);
    setColor(item.color || "#6D5EF8");
    setAttachedDocuments(item.attachedDocuments || []);
    setProject(item.project || "");
    setCalendarDate(parseStoredDueDate(item.dueDate));
    if (!isTask) {
      setEditing(false);
      return;
    }
    onClose();
  };

  const handleComplete = () => {
    onSave?.({ ...item, title, description, status: "completed", priority, dueDate, assignedUsers, color, attachedDocuments, project });
    toast.success("Task completed successfully");
    onClose();
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setCalendarDate(date);
    setDueDate(format(date, "MMM d"));
  };

  return (
    <Sheet open={open} onOpenChange={nextOpen => { if (!nextOpen) onClose(); }}>
      <SheetContent side="right" className="w-full sm:w-[70vw] sm:max-w-[70vw] lg:w-[52vw] lg:max-w-[52vw] p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{item.type}</span>
            {editingEnabled && <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Editable</span>}
          </div>
          <SheetTitle className="sr-only">{title}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {!canEdit && isTask && (
            <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
              <Lock size={14} />
              You have read-only access to this task.
            </div>
          )}

          <section className="space-y-4">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Task overview</p>
              {editingEnabled ? (
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full text-2xl font-semibold text-foreground bg-transparent border-b border-border pb-2 focus:outline-none focus:border-primary transition-colors"
                  placeholder="Task title"
                />
              ) : (
                <h3 className="text-2xl font-semibold text-foreground">{title}</h3>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Status</label>
                {editingEnabled ? (
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="w-full h-10 px-3 text-sm bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {STATUS_OPTIONS.map(option => (
                      <option key={option} value={option}>
                        {option === "no-progress" ? "No Progress" : option === "in-progress" ? "In Progress" : "Completed"}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="h-10 flex items-center"><StatusBadge status={status} /></div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Priority</label>
                {editingEnabled ? (
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                    className="w-full h-10 px-3 text-sm bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {PRIORITY_OPTIONS.map(option => (
                      <option key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="h-10 flex items-center text-sm text-foreground capitalize">{priority}</div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Users size={11} /> Assigned team members
              </label>
              {editingEnabled && canAssign ? (
                <UserMultiSelect selected={assignedUsers} onChange={setAssignedUsers} label="" />
              ) : (
                <div className="flex flex-wrap gap-2 pt-1">
                  {assignedMembers.length === 0 && <span className="text-sm text-muted-foreground">Unassigned</span>}
                  {assignedMembers.map(member => (
                    <span key={member.id} className="flex items-center gap-1.5 text-xs bg-muted rounded-full px-2.5 py-1.5">
                      <img src={member.avatar} alt={member.name} className="w-4 h-4 rounded-full" />
                      {member.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4 pt-1 border-t border-border">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Task details</p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Description</label>
              {editingEnabled ? (
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  className="w-full text-sm text-foreground bg-muted/30 border border-border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all"
                  placeholder="Add description..."
                />
              ) : (
                <p className="text-sm text-muted-foreground min-h-16">{description || "No description"}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {isTask && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Project</label>
                  {editingEnabled ? (
                    <ProjectEditDropdown value={project} onChange={setProject} />
                  ) : (
                    <div className="h-10 flex items-center text-sm text-foreground">{project || "—"}</div>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Calendar size={11} /> Due date
                </label>
                {editingEnabled ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("w-full h-10 justify-start text-left font-normal", !dueDate && "text-muted-foreground")}>
                        <CalendarDays size={14} className="mr-2" />
                        {dueDate || "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarPicker mode="single" selected={calendarDate} onSelect={handleDateSelect} initialFocus className={cn("p-3 pointer-events-auto")} />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <div className="h-10 flex items-center text-sm text-foreground">{dueDateDisplay}</div>
                )}
              </div>
            </div>
          </section>

          {isTask && (
            <SubtasksSection
              subtasks={subtasks}
              onCreateSubtask={onCreateSubtask ? (title: string) => onCreateSubtask(item.id, title) : undefined}
              onSubtaskClick={onSubtaskClick}
              canCreate={editingEnabled}
            />
          )}

          <section className="space-y-4 pt-1 border-t border-border">
            <div className="flex items-center gap-2">
              <Paperclip size={14} className="text-muted-foreground" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Attachments</p>
            </div>
            <DocumentAttachments attachedDocIds={attachedDocuments} onChange={setAttachedDocuments} editing={editingEnabled} entityId={item.projectId || item.id} />
          </section>

          <ActivityComments entityType={item.type} entityId={item.id} />

          {!isTask && editingEnabled && (
            <section className="space-y-4 pt-1 border-t border-border">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Appearance</p>
              <div className="flex gap-2 flex-wrap">
                {COLOR_SWATCHES.map(swatch => (
                  <button
                    key={swatch}
                    type="button"
                    onClick={() => setColor(swatch)}
                    className={cn(
                      "w-7 h-7 rounded-full transition-all",
                      color === swatch ? "ring-2 ring-primary ring-offset-2 ring-offset-card scale-110" : "hover:scale-110",
                    )}
                    style={{ backgroundColor: swatch }}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={editingEnabled ? handleCancel : onClose}>
            {editingEnabled ? "Close" : "Cancel"}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                const chatType = isTask ? "task" : "project";
                const chatId = item.id;
                navigate(`/chats/${chatType}/${chatId}`);
                onClose();
              }}
            >
              <MessageSquare size={13} /> Chat
            </Button>
            {canEdit && !isTask && !editingEnabled && (
              <Button variant="secondary" size="sm" onClick={() => setEditing(true)} className="gap-1.5">
                <Pencil size={13} /> Edit
              </Button>
            )}
            {editingEnabled && (
              <Button size="sm" onClick={handleSave} className="gap-1.5">
                <Save size={13} /> Save Changes
              </Button>
            )}
            {canEdit && isTask && status !== "completed" && canComplete && (
              <Button variant="outline" size="sm" onClick={handleComplete} className="gap-1.5 text-primary border-primary/20 hover:bg-primary/5">
                <CheckCircle2 size={13} /> Complete Task
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TaskDetailPanel;
