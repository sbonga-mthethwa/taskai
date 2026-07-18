import { useState, useRef, useEffect } from "react";
import { Calendar, Paperclip, Pencil, UserPlus, Flag, Trash2, Check, Search, ChevronRight, ChevronDown as ChevronDownIcon, GitBranch } from "lucide-react";
import { Task, TeamMember } from "@/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface TaskBoardCardProps {
  task: Task;
  teamMembers: TeamMember[];
  subtasks?: Task[];
  expandedTasks?: Set<string>;
  onSelect: (task: Task) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onQuickUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onDropOnTask?: (draggedTaskId: string, targetTaskId: string) => void;
  onToggleExpand?: (taskId: string) => void;
  isSubtask?: boolean;
}

const PRIORITY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  urgent: { bg: "bg-destructive/10", text: "text-destructive", label: "Urgent" },
  high: { bg: "bg-orange-500/10", text: "text-orange-500", label: "High" },
  medium: { bg: "bg-blue-500/10", text: "text-blue-500", label: "Medium" },
  low: { bg: "bg-muted", text: "text-muted-foreground", label: "Low" },
};

const PRIORITY_OPTIONS: { value: Task["priority"]; label: string; dot: string }[] = [
  { value: "high", label: "High", dot: "bg-orange-500" },
  { value: "medium", label: "Medium", dot: "bg-blue-500" },
  { value: "low", label: "Low", dot: "bg-muted-foreground" },
];

function formatDueDate(dueDate: string, status: string): { display: string; isOverdue: boolean; isDueTomorrow: boolean } {
  if (!dueDate) return { display: "", isOverdue: false, isDueTomorrow: false };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  let parsed: Date | null = null;
  if (/^\d{4}-\d{2}-\d{2}/.test(dueDate)) {
    parsed = new Date(dueDate + "T00:00:00");
  } else {
    const months: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
    const parts = dueDate.replace(",", "").split(" ");
    const monthNum = months[parts[0]];
    if (monthNum !== undefined && parts[1]) {
      const day = parseInt(parts[1]);
      const year = parts[2] ? parseInt(parts[2]) : today.getFullYear();
      parsed = new Date(year, monthNum, day);
    }
  }
  if (!parsed || isNaN(parsed.getTime())) return { display: dueDate, isOverdue: false, isDueTomorrow: false };
  parsed.setHours(0, 0, 0, 0);
  const isCompleted = status === "completed";
  const isOverdue = !isCompleted && parsed < today;
  const isDueTomorrow = !isCompleted && parsed.getTime() === tomorrow.getTime();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const shortDate = `${monthNames[parsed.getMonth()]} ${parsed.getDate()}`;
  if (isOverdue) return { display: `Overdue · ${shortDate}`, isOverdue: true, isDueTomorrow: false };
  if (isDueTomorrow) return { display: "Due Tomorrow", isOverdue: false, isDueTomorrow: true };
  return { display: shortDate, isOverdue: false, isDueTomorrow: false };
}

const MiniPopover = ({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      ref={ref}
      className="absolute top-8 right-0 z-50 bg-popover border border-border rounded-lg shadow-lg overflow-hidden animate-fade-in"
      onClick={e => e.stopPropagation()}
    >
      {children}
    </div>
  );
};

const TaskBoardCard = ({
  task,
  teamMembers,
  subtasks = [],
  expandedTasks,
  onSelect,
  onDragStart,
  onDelete,
  onQuickUpdate,
  onDropOnTask,
  onToggleExpand,
  isSubtask = false,
}: TaskBoardCardProps) => {
  const assignedMembers = teamMembers.filter(m => task.assignedUsers.includes(m.id));
  const prio = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
  const due = formatDueDate(task.dueDate, task.status);

  const [activePopover, setActivePopover] = useState<"assign" | "priority" | null>(null);
  const [assignSearch, setAssignSearch] = useState("");
  const [dragOverTask, setDragOverTask] = useState(false);

  const isExpanded = expandedTasks?.has(task.id) ?? false;
  const hasSubtasks = subtasks.length > 0;

  const closePopover = () => {
    setActivePopover(null);
    setAssignSearch("");
  };

  const filteredMembers = teamMembers.filter(m =>
    m.name.toLowerCase().includes(assignSearch.toLowerCase())
  );

  const toggleAssignee = (userId: string) => {
    if (!onQuickUpdate) return;
    const current = task.assignedUsers || [];
    const updated = current.includes(userId)
      ? current.filter(id => id !== userId)
      : [...current, userId];
    onQuickUpdate(task.id, { assignedUsers: updated });
  };

  const setPriority = (priority: Task["priority"]) => {
    if (!onQuickUpdate) return;
    onQuickUpdate(task.id, { priority });
    closePopover();
  };

  const handleTaskDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTask(true);
  };

  const handleTaskDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setDragOverTask(false);
  };

  const handleTaskDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTask(false);
    const draggedTaskId = e.dataTransfer.getData("text/plain");
    if (!draggedTaskId || draggedTaskId === task.id) return;
    if (onDropOnTask) {
      onDropOnTask(draggedTaskId, task.id);
    }
  };

  return (
    <div>
      <div
        draggable
        onDragStart={e => onDragStart(e, task.id)}
        onDragOver={handleTaskDragOver}
        onDragLeave={handleTaskDragLeave}
        onDrop={handleTaskDrop}
        onClick={() => { if (!activePopover) onSelect(task); }}
        className={`bg-card border rounded-xl p-3.5 cursor-grab active:cursor-grabbing transition-all hover:shadow-md hover:-translate-y-0.5 group relative ${
          dragOverTask
            ? "border-primary ring-2 ring-primary/30 scale-[1.02]"
            : "border-border"
        } ${isSubtask ? "ml-4 border-l-2 border-l-primary/30" : ""}`}
      >
        {/* Drop indicator for subtask */}
        {dragOverTask && (
          <div className="absolute -top-1 left-0 right-0 flex items-center justify-center z-20">
            <span className="text-[10px] font-semibold text-primary bg-primary/10 border border-primary/30 rounded-full px-2 py-0.5">
              Drop to create subtask
            </span>
          </div>
        )}

        {/* Hover actions */}
        <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-0.5 bg-card/95 backdrop-blur border border-border rounded-lg px-1 py-0.5 shadow-sm z-10">
          <button
            onClick={e => { e.stopPropagation(); onSelect(task); }}
            className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Edit task"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setActivePopover(activePopover === "assign" ? null : "assign"); }}
            className={`p-1 rounded hover:bg-muted transition-colors ${activePopover === "assign" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            title="Assign user"
          >
            <UserPlus size={12} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setActivePopover(activePopover === "priority" ? null : "priority"); }}
            className={`p-1 rounded hover:bg-muted transition-colors ${activePopover === "priority" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            title="Set priority"
          >
            <Flag size={12} />
          </button>
          {onDelete && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(task.id); }}
              className="p-1 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
              title="Delete task"
            >
              <Trash2 size={12} />
            </button>
          )}

          <MiniPopover open={activePopover === "assign"} onClose={closePopover}>
            <div className="w-52">
              <div className="p-2 border-b border-border">
                <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">Assign users</p>
                <div className="relative">
                  <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={assignSearch}
                    onChange={e => setAssignSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-full text-xs pl-6 pr-2 py-1 bg-muted/30 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground/50"
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-40 overflow-y-auto p-1">
                {filteredMembers.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-2 text-center">No members found</p>
                ) : (
                  filteredMembers.map(m => {
                    const isAssigned = task.assignedUsers.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        onClick={() => toggleAssignee(m.id)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors text-left"
                      >
                        {m.avatar ? (
                          <img src={m.avatar} alt={m.name} className="w-5 h-5 rounded-full shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[8px] font-bold shrink-0">
                            {m.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                          </div>
                        )}
                        <span className="text-xs text-foreground truncate flex-1">{m.name}</span>
                        {isAssigned && <Check size={12} className="text-primary shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </MiniPopover>

          <MiniPopover open={activePopover === "priority"} onClose={closePopover}>
            <div className="w-36 p-1">
              <p className="text-[11px] font-semibold text-muted-foreground px-2 py-1">Set priority</p>
              {PRIORITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPriority(opt.value)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors text-left ${task.priority === opt.value ? "bg-muted/60" : ""}`}
                >
                  <span className={`w-2 h-2 rounded-full ${opt.dot} shrink-0`} />
                  <span className="text-xs text-foreground">{opt.label}</span>
                  {task.priority === opt.value && <Check size={12} className="text-primary ml-auto shrink-0" />}
                </button>
              ))}
            </div>
          </MiniPopover>
        </div>

        {task.color && <div className="w-full h-1 rounded-full mb-2.5 -mt-0.5" style={{ backgroundColor: task.color }} />}

        <div className="flex items-center gap-1.5 mb-2">
          {hasSubtasks && onToggleExpand && (
            <button
              onClick={e => { e.stopPropagation(); onToggleExpand(task.id); }}
              className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
            >
              {isExpanded ? <ChevronDownIcon size={13} /> : <ChevronRight size={13} />}
            </button>
          )}
          <p className="text-[13px] font-medium text-foreground leading-snug line-clamp-2 flex-1">{task.title}</p>
        </div>

        <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
          <span className="inline-block text-[11px] font-medium text-muted-foreground bg-muted/60 rounded px-1.5 py-0.5">{task.project}</span>
          {task.priority && (
            <span className={`inline-block text-[10px] font-semibold rounded px-1.5 py-0.5 ${prio.bg} ${prio.text}`}>
              {prio.label}
            </span>
          )}
          {hasSubtasks && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted/60 rounded px-1.5 py-0.5">
              <GitBranch size={10} /> {subtasks.length} subtask{subtasks.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {due.display && (
              <span className={`flex items-center gap-1 text-[11px] font-medium ${due.isOverdue ? "text-destructive" : due.isDueTomorrow ? "text-amber-500" : "text-muted-foreground"}`}>
                <Calendar size={11} /> {due.display}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {task.attachedDocuments && task.attachedDocuments.length > 0 && (
              <span className="flex items-center gap-0.5 text-muted-foreground text-[11px]"><Paperclip size={11} /> {task.attachedDocuments.length}</span>
            )}
            {assignedMembers.length > 0 && (
              <div className="flex -space-x-1.5" onClick={e => e.stopPropagation()}>
                {assignedMembers.slice(0, 3).map(m => (
                  <Tooltip key={m.id}>
                    <TooltipTrigger asChild>
                      {m.avatar ? (
                        <img src={m.avatar} alt={m.name} className="w-5 h-5 rounded-full border-2 border-card cursor-pointer" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-card bg-primary/10 text-primary flex items-center justify-center text-[8px] font-bold cursor-pointer">
                          {m.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                      )}
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      <p className="font-medium">{m.name}</p>
                      {m.department && <p className="text-muted-foreground">{m.department}</p>}
                    </TooltipContent>
                  </Tooltip>
                ))}
                {assignedMembers.length > 3 && (
                  <span className="w-5 h-5 rounded-full bg-muted text-[9px] font-bold flex items-center justify-center border-2 border-card text-muted-foreground">
                    +{assignedMembers.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded subtasks */}
      {hasSubtasks && isExpanded && (
        <div className="mt-1 space-y-1.5">
          {subtasks.map(sub => (
            <TaskBoardCard
              key={sub.id}
              task={sub}
              teamMembers={teamMembers}
              onSelect={onSelect}
              onDragStart={onDragStart}
              onDelete={onDelete}
              onQuickUpdate={onQuickUpdate}
              isSubtask
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskBoardCard;
