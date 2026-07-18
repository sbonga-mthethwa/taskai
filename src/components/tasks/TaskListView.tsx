import { Calendar, Paperclip } from "lucide-react";
import { Task } from "@/types";
import { useData } from "@/contexts/DataContext";
import StatusBadge from "@/components/StatusBadge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface TaskListViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const PRIORITY_DISPLAY: Record<string, { text: string; className: string }> = {
  urgent: { text: "Urgent", className: "text-destructive" },
  high: { text: "High", className: "text-orange-500" },
  medium: { text: "Medium", className: "text-blue-500" },
  low: { text: "Low", className: "text-muted-foreground" },
};

function formatDueDate(dueDate: string, status: string): { display: string; className: string } {
  if (!dueDate) return { display: "—", className: "text-muted-foreground" };

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

  if (!parsed || isNaN(parsed.getTime())) return { display: dueDate, className: "text-muted-foreground" };

  parsed.setHours(0, 0, 0, 0);
  const isCompleted = status === "completed";
  const isOverdue = !isCompleted && parsed < today;
  const isDueTomorrow = !isCompleted && parsed.getTime() === tomorrow.getTime();

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const shortDate = `${monthNames[parsed.getMonth()]} ${parsed.getDate()}`;

  if (isOverdue) return { display: `Overdue · ${shortDate}`, className: "text-destructive" };
  if (isDueTomorrow) return { display: "Due Tomorrow", className: "text-amber-500" };
  return { display: shortDate, className: "text-muted-foreground" };
}

const TaskListView = ({ tasks, onTaskClick }: TaskListViewProps) => {
  const { users: teamMembers } = useData();

  return (
    <div className="flex-1 overflow-auto rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Task</th>
            <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Project</th>
            <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Assigned</th>
            <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Due Date</th>
            <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Priority</th>
            <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 && (
            <tr><td colSpan={6} className="text-center py-12 text-sm text-muted-foreground">No tasks found</td></tr>
          )}
          {tasks.map(task => {
            const assignedMembers = teamMembers.filter(m => task.assignedUsers.includes(m.id));
            const prio = PRIORITY_DISPLAY[task.priority] || PRIORITY_DISPLAY.medium;
            const due = formatDueDate(task.dueDate, task.status);
            return (
              <tr key={task.id} onClick={() => onTaskClick(task)} className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors group">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {task.color && <div className="w-1 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: task.color }} />}
                    <span className="text-[13px] font-medium text-foreground line-clamp-1">{task.title}</span>
                    {task.attachedDocuments && task.attachedDocuments.length > 0 && <Paperclip size={12} className="text-muted-foreground flex-shrink-0" />}
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell"><span className="text-xs font-medium text-muted-foreground bg-muted/60 rounded px-1.5 py-0.5">{task.project}</span></td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {assignedMembers.length > 0 ? (
                    <div className="flex -space-x-1.5">
                      {assignedMembers.slice(0, 3).map(m => (
                        <Tooltip key={m.id}>
                          <TooltipTrigger asChild>
                            {m.avatar ? (
                              <img src={m.avatar} alt={m.name} className="w-6 h-6 rounded-full border-2 border-card cursor-pointer" />
                            ) : (
                              <div className="w-6 h-6 rounded-full border-2 border-card bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold cursor-pointer">
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
                      {assignedMembers.length > 3 && (<span className="w-6 h-6 rounded-full bg-muted text-[10px] font-bold flex items-center justify-center border-2 border-card text-muted-foreground">+{assignedMembers.length - 3}</span>)}
                    </div>
                  ) : (<span className="text-xs text-muted-foreground">—</span>)}
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className={`flex items-center gap-1 text-xs font-medium ${due.className}`}>
                    <Calendar size={11} /> {due.display}
                  </span>
                </td>
                <td className="px-4 py-3"><span className={`text-xs font-medium ${prio.className}`}>{prio.text}</span></td>
                <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TaskListView;
