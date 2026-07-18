import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, FolderKanban, CheckSquare, Loader2 } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { fetchCalendar, ApiCalendarItem } from "@/services/api";
import PriorityIndicator from "@/components/PriorityIndicator";

const parseDateStr = (d: string): Date | null => {
  if (!d) return null;
  // ISO format: "2026-04-09"
  if (/^\d{4}-\d{2}-\d{2}/.test(d)) {
    const date = new Date(d + "T00:00:00");
    return isNaN(date.getTime()) ? null : date;
  }
  // "Mar 31" or "Mar 31, 2026"
  const parts = d.match(/^(\w+)\s+(\d+)(?:,?\s+(\d+))?$/);
  if (!parts) return null;
  const months: Record<string, number> = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
  const m = months[parts[1]];
  if (m === undefined) return null;
  return new Date(parts[3] ? parseInt(parts[3]) : 2026, m, parseInt(parts[2]));
};

interface DeadlineItem {
  id: string;
  title: string;
  type: "task" | "project";
  dueDate: Date;
  dueDateStr: string;
  priority?: "high" | "medium" | "low";
  assignedUsers?: string[];
  color?: string;
}

interface UpcomingDeadlinesProps {
  onItemClick?: (item: DeadlineItem) => void;
  dashboardDeadlines?: Array<{
    id: string;
    title: string;
    type: "task" | "project";
    dueDate: string;
    priority?: string;
    assignedUsers?: string[];
    color?: string;
  }>;
}

const UpcomingDeadlines = ({ onItemClick, dashboardDeadlines }: UpcomingDeadlinesProps) => {
  const { tasks, projects, users } = useData();

  const items = useMemo(() => {
    // If dashboard provided deadlines, use them
    if (dashboardDeadlines && dashboardDeadlines.length > 0) {
      return dashboardDeadlines
        .map(d => {
          const date = parseDateStr(d.dueDate) || new Date(d.dueDate);
          return {
            id: d.id,
            title: d.title,
            type: d.type,
            dueDate: date,
            dueDateStr: d.dueDate,
            priority: d.priority as "high" | "medium" | "low" | undefined,
            assignedUsers: d.assignedUsers,
            color: d.color,
          };
        })
        .filter(d => !isNaN(d.dueDate.getTime()))
        .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    }

    // Fallback: build from loaded tasks/projects
    const all: DeadlineItem[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    tasks.forEach(t => {
      if (t.status === "completed") return;
      const d = parseDateStr(t.dueDate);
      if (d && d >= today) {
        all.push({ id: t.id, title: t.title, type: "task", dueDate: d, dueDateStr: t.dueDate, priority: t.priority, assignedUsers: t.assignedUsers, color: t.color });
      }
    });

    projects.forEach(p => {
      if (!p.dueDate || p.status === "completed") return;
      const d = parseDateStr(p.dueDate);
      if (d && d >= today) {
        all.push({ id: p.id, title: p.name, type: "project", dueDate: d, dueDateStr: p.dueDate, assignedUsers: p.assignedUsers, color: p.color });
      }
    });

    all.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    return all;
  }, [dashboardDeadlines, tasks, projects]);

  const memberMap = useMemo(() => {
    const m: Record<string, { name: string; avatar: string }> = {};
    users.forEach(u => { m[u.id] = { name: u.name, avatar: u.avatar }; });
    return m;
  }, [users]);

  const getDaysLeft = (d: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    return `${diff}d left`;
  };

  return (
    <div className="bg-card rounded-[14px] border border-border p-4 flex flex-col" style={{ height: "520px" }}>
      <div className="flex items-center gap-2 mb-4">
        <Clock size={15} className="text-primary" />
        <h2 className="text-[15px] font-semibold text-foreground">Upcoming Deadlines</h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-0 pr-1 -mr-1">
        {items.map((item, i) => {
          const avatars = (item.assignedUsers || []).slice(0, 3);
          const daysLabel = getDaysLeft(item.dueDate);
          const isUrgent = daysLabel === "Today" || daysLabel === "Tomorrow";

          return (
            <div key={`${item.type}-${item.id}`}>
              <div onClick={() => onItemClick?.(item)} className="flex items-start gap-3 py-3 group hover:bg-muted/20 rounded-lg px-2 -mx-2 transition-colors cursor-pointer">
                <div className="mt-0.5 flex-shrink-0">
                  {item.type === "task" ? (
                    <CheckSquare size={14} className="text-primary" />
                  ) : (
                    <FolderKanban size={14} className="text-accent" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-foreground leading-tight truncate">{item.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[12px] font-medium ${isUrgent ? "text-destructive" : "text-muted-foreground"}`}>
                      {item.dueDateStr}
                    </span>
                    <span className="text-[11px] text-muted-foreground/60">·</span>
                    <span className={`text-[11px] font-medium ${isUrgent ? "text-destructive" : "text-muted-foreground/70"}`}>
                      {daysLabel}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                  {item.priority && <PriorityIndicator priority={item.priority} />}
                  {avatars.length > 0 && (
                    <div className="flex -space-x-1.5">
                      {avatars.map(uid => {
                        const member = memberMap[uid];
                        return member ? (
                          <img key={uid} src={member.avatar} alt={member.name} className="w-5 h-5 rounded-full border-2 border-card" />
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              </div>
              {i < items.length - 1 && <div className="border-b border-border mx-2" />}
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-foreground mb-1">You're all caught up 🎉</p>
            <p className="text-[12px] text-muted-foreground">No deadlines scheduled.</p>
            <p className="text-[11px] text-muted-foreground/60 mt-2">Create tasks or set deadlines to keep projects on track.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingDeadlines;
