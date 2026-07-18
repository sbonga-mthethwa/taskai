import { useState, useMemo, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, X, FolderKanban, CheckSquare, Upload, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import PriorityIndicator from "@/components/PriorityIndicator";
import ItemDetailModal from "@/components/ItemDetailModal";
import { useData } from "@/contexts/DataContext";

type View = "month" | "week" | "day" | "year";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

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

interface CalendarEvent {
  type: "task" | "project";
  id: string;
  title: string;
  date: Date;
  status: string;
  priority?: string;
  project?: string;
  description?: string;
  color?: string;
  assignedUsers?: string[];
}

// ─── Plus Menu ───
const CellPlusMenu = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const options = [
    { icon: CheckSquare, label: "Add Task", action: () => navigate("/tasks?new=1") },
    { icon: FolderKanban, label: "Add Project", action: () => navigate("/projects?new=1") },
    { icon: Upload, label: "Upload Document", action: () => navigate("/files?upload=1") },
  ];

  return (
    <div ref={ref} className="absolute right-0 top-7 z-50 w-44 bg-card border border-border rounded-xl shadow-lg py-1 animate-fade-in" onClick={e => e.stopPropagation()}>
      <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Create</p>
      {options.map(o => (
        <button key={o.label} onClick={() => { o.action(); onClose(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-foreground hover:bg-muted transition-colors">
          <o.icon size={13} className="text-muted-foreground" /> {o.label}
        </button>
      ))}
    </div>
  );
};

// ─── Event Pill ───
const EventPill = ({ event, onClick, compact }: { event: CalendarEvent; onClick: () => void; compact?: boolean }) => {
  const bgColor = event.color || (event.type === "task" ? "hsl(var(--primary))" : "hsl(var(--accent))");
  const assignedAvatars = (event.assignedUsers || []).slice(0, 2);
  const { users: teamMembers } = useData();
  const memberMap = useMemo(() => {
    const map: Record<string, string> = {};
    teamMembers.forEach(m => { map[m.id] = m.name.split(" ").map(n => n[0]).join(""); });
    return map;
  }, [teamMembers]);

  return (
    <button
      onClick={ev => { ev.stopPropagation(); onClick(); }}
      className={`w-full flex items-center gap-1 transition-all hover:brightness-95 group/pill text-left ${
        compact
          ? "rounded-[7px] px-2 text-[12px] font-medium leading-4"
          : "rounded-[8px] px-2.5 py-1.5 text-[13px] font-medium leading-[18px]"
      }`}
      style={{ backgroundColor: bgColor, color: "#FFFFFF", height: compact ? "22px" : "auto" }}
    >
      <span className="truncate flex-1">{event.title}</span>
      {!compact && assignedAvatars.length > 0 && (
        <div className="flex -space-x-1 flex-shrink-0">
          {assignedAvatars.map(uid => (
            <div key={uid} className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[7px] font-bold text-white border border-white/40">
              {memberMap[uid] || "?"}
            </div>
          ))}
        </div>
      )}
      <MoreVertical size={10} className="flex-shrink-0 opacity-0 group-hover/pill:opacity-70" />
    </button>
  );
};

const DashboardCalendar = () => {
  const navigate = useNavigate();
  const { tasks, projects, users: teamMembers } = useData();
  const [view, setView] = useState<View>("month");
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 17));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [plusMenuDate, setPlusMenuDate] = useState<string | null>(null);

  const events = useMemo(() => {
    const items: CalendarEvent[] = [];
    tasks.forEach(t => {
      const d = parseDateStr(t.dueDate);
      if (d) items.push({ type: "task", id: t.id, title: t.title, date: d, status: t.status, priority: t.priority, project: t.project, color: t.color, assignedUsers: t.assignedUsers });
    });
    projects.forEach(p => {
      if (p.dueDate) {
        const d = parseDateStr(p.dueDate);
        if (d) items.push({ type: "project", id: p.id, title: p.name, date: d, status: p.status, description: p.description, color: p.color, assignedUsers: p.assignedUsers });
      }
    });
    return items;
  }, [tasks, projects]);

  const getEventsForDate = (date: Date) =>
    events.filter(e => e.date.getFullYear() === date.getFullYear() && e.date.getMonth() === date.getMonth() && e.date.getDate() === date.getDate());

  const nav = (dir: number) => {
    const d = new Date(currentDate);
    if (view === "month") d.setMonth(d.getMonth() + dir);
    else if (view === "week") d.setDate(d.getDate() + dir * 7);
    else if (view === "day") d.setDate(d.getDate() + dir);
    else d.setFullYear(d.getFullYear() + dir);
    setCurrentDate(d);
  };

  const goToDay = (date: Date) => {
    setCurrentDate(date);
    setView("day");
    setSelectedDate(null);
  };

  const today = new Date(2026, 2, 17);
  const dateKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

  // ─── Month Grid ───
  const renderMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayRaw = new Date(year, month, 1).getDay();
    const firstDay = firstDayRaw === 0 ? 6 : firstDayRaw - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells: { day: number; month: number; year: number; inMonth: boolean }[] = [];
    for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevMonthDays - i, month: month - 1, year, inMonth: false });
    for (let i = 1; i <= daysInMonth; i++) cells.push({ day: i, month, year, inMonth: true });
    const remaining = Math.ceil(cells.length / 7) * 7 - cells.length;
    for (let i = 1; i <= remaining; i++) cells.push({ day: i, month: month + 1, year, inMonth: false });

    const weeks: typeof cells[] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    const maxShow = 1;

    return (
      <div className="flex flex-col flex-1 min-h-0">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {DAY_NAMES.map(d => (
            <div key={d} className="text-[11px] font-semibold text-muted-foreground text-center py-2 uppercase tracking-wider border-r border-border last:border-r-0">{d}</div>
          ))}
        </div>
        {/* Weeks */}
        <div className="flex flex-col flex-1 min-h-0">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 flex-1 min-h-0 border-b border-border last:border-b-0">
              {week.map((cell, ci) => {
                const date = new Date(cell.year, cell.month, cell.day);
                const dayEvents = getEventsForDate(date);
                const isToday = cell.inMonth && date.getTime() === today.getTime();
                const dk = dateKey(date);
                const showPlusMenu = plusMenuDate === dk;
                const overflow = dayEvents.length - maxShow;

                return (
                  <div
                    key={ci}
                    onClick={() => goToDay(date)}
                    className={`relative border-r border-border last:border-r-0 cursor-pointer transition-colors group ${
                      !cell.inMonth ? "bg-muted/10" : "hover:bg-muted/20"
                    }`}
                    style={{ padding: "8px", minHeight: "116px" }}
                  >
                    {/* Top row: date + plus */}
                    <div className="flex items-start justify-between" style={{ marginBottom: "8px" }}>
                      <span className={`text-[13px] leading-none font-medium ${
                        isToday
                          ? "w-6 h-6 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold"
                          : cell.inMonth ? "text-foreground" : "text-muted-foreground/40"
                      }`}>
                        {cell.day}
                      </span>
                      {cell.inMonth && (
                        <button
                          onClick={e => { e.stopPropagation(); setPlusMenuDate(showPlusMenu ? null : dk); }}
                          className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:!text-primary hover:bg-primary/10 transition-all"
                        >
                          <Plus size={14} strokeWidth={2.5} />
                        </button>
                      )}
                    </div>

                    {showPlusMenu && <CellPlusMenu onClose={() => setPlusMenuDate(null)} />}

                    {/* Events */}
                    <div className="flex flex-col" style={{ gap: "6px" }}>
                      {dayEvents.slice(0, maxShow).map(e => (
                        <EventPill key={e.id + e.type} event={e} onClick={() => setSelectedEvent(e)} compact />
                      ))}
                      {overflow > 0 && (
                        <button
                          onClick={ev => { ev.stopPropagation(); goToDay(date); }}
                          className="text-[11px] text-primary font-medium px-2 hover:underline transition-colors"
                        >
                          +{overflow} more
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ─── Week View ───
  const renderWeek = () => {
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(startOfWeek.getDate() + mondayOffset);

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      return d;
    });

    return (
      <div className="flex flex-col flex-1 min-h-0">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {days.map((d, i) => {
            const isToday = d.getTime() === today.getTime();
            return (
              <div key={i} className="text-center py-2.5 border-r border-border last:border-r-0">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{DAY_NAMES[i]}</span>
                <span className={`block text-sm font-semibold mt-0.5 ${isToday ? "text-primary" : "text-foreground"}`}>{d.getDate()}</span>
              </div>
            );
          })}
        </div>
        {/* Content */}
        <div className="grid grid-cols-7 flex-1 min-h-0">
          {days.map((d, i) => {
            const dayEvents = getEventsForDate(d);
            const dk = dateKey(d);
            const showPlusMenu = plusMenuDate === dk;
            return (
              <div key={i} onClick={() => setSelectedDate(d)} className="border-r border-border last:border-r-0 cursor-pointer hover:bg-muted/20 transition-colors group relative" style={{ padding: "12px", minHeight: "160px" }}>
                <div className="flex justify-end mb-2">
                  <button
                    onClick={e => { e.stopPropagation(); setPlusMenuDate(showPlusMenu ? null : dk); }}
                    className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:!text-primary hover:bg-primary/10 transition-all"
                  >
                    <Plus size={14} strokeWidth={2.5} />
                  </button>
                </div>
                {showPlusMenu && <CellPlusMenu onClose={() => setPlusMenuDate(null)} />}
                <div className="flex flex-col" style={{ gap: "8px" }}>
                  {dayEvents.slice(0, 5).map(e => (
                    <EventPill key={e.id + e.type} event={e} onClick={() => setSelectedEvent(e)} />
                  ))}
                  {dayEvents.length > 5 && (
                    <span className="text-[11px] text-primary font-medium px-2.5">+{dayEvents.length - 5} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── Day View ───
  const renderDay = () => {
    const dayEvents = getEventsForDate(currentDate);
    return (
      <div className="flex-1 p-4 space-y-2">
        <p className="text-sm font-semibold text-foreground mb-3">
          {DAY_NAMES[currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1]}, {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getDate()}, {currentDate.getFullYear()}
        </p>
        {dayEvents.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No events scheduled</p>}
        {dayEvents.map(e => (
          <button
            key={e.id + e.type}
            onClick={() => setSelectedEvent(e)}
            className="w-full text-left p-3 rounded-xl border border-border hover:border-primary/20 hover:bg-muted/30 transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: e.color || (e.type === "task" ? "hsl(var(--primary))" : "hsl(var(--accent))") }} />
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">{e.type}</span>
              <span className="text-sm font-medium text-foreground truncate">{e.title}</span>
            </div>
            {e.project && <p className="text-xs text-muted-foreground mt-1 ml-5">{e.project}</p>}
          </button>
        ))}
      </div>
    );
  };

  // ─── Year View ───
  const renderYear = () => {
    const year = currentDate.getFullYear();
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 flex-1 p-4">
        {MONTH_NAMES.map((name, mi) => {
          const monthEvents = events.filter(e => e.date.getFullYear() === year && e.date.getMonth() === mi);
          return (
            <button
              key={mi}
              onClick={() => { setCurrentDate(new Date(year, mi, 1)); setView("month"); }}
              className="p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/20 transition-all text-left"
            >
              <p className="text-xs font-semibold text-foreground mb-1.5">{name}</p>
              <div className="flex items-center gap-2.5 text-[10px]">
                <span className="text-primary font-semibold">{monthEvents.filter(e => e.type === "task").length} tasks</span>
                <span className="text-accent font-semibold">{monthEvents.filter(e => e.type === "project").length} proj</span>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="bg-card rounded-[14px] border border-border card-shadow flex flex-col overflow-hidden" style={{ height: "520px" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex items-center gap-5">
          <h2 className="text-[15px] font-semibold text-foreground">Calendar</h2>
          <div className="flex items-center gap-3 text-[11px]">
            <button onClick={() => navigate("/tasks")} className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
              <span className="w-2 h-2 rounded-full bg-primary" /> Tasks
            </button>
            <button onClick={() => navigate("/projects")} className="flex items-center gap-1.5 text-muted-foreground hover:text-accent transition-colors">
              <span className="w-2 h-2 rounded-full bg-accent" /> Projects
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5">
            {(["day", "week", "month", "year"] as View[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all duration-150 ${
                  view === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-5 py-2 border-b border-border">
        <button onClick={() => nav(-1)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-foreground">
          {view === "year" ? currentDate.getFullYear() :
           view === "day" ? `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}` :
           `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
        </span>
        <button onClick={() => nav(1)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Calendar Content */}
      <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
        {view === "month" && renderMonth()}
        {view === "week" && renderWeek()}
        {view === "day" && renderDay()}
        {view === "year" && renderYear()}
      </div>

      {/* Selected date panel */}
      {selectedDate && (
        <div className="border-t border-border px-5 py-3 bg-muted/20 max-h-[140px] overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-foreground">
              {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getDate()}
              <span className="text-muted-foreground font-normal ml-1.5">
                {selectedDateEvents.length} item{selectedDateEvents.length !== 1 ? "s" : ""}
              </span>
            </p>
            <button onClick={() => setSelectedDate(null)} className="text-muted-foreground hover:text-foreground transition-colors">
              <X size={12} />
            </button>
          </div>
          {selectedDateEvents.length === 0 && <p className="text-xs text-muted-foreground">No events</p>}
          {selectedDateEvents.map(e => (
            <button
              key={e.id + e.type}
              onClick={() => setSelectedEvent(e)}
              className="w-full text-left flex items-center gap-2.5 py-1.5 text-xs hover:bg-muted/40 rounded-lg px-2 transition-colors"
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: e.color || (e.type === "task" ? "hsl(var(--primary))" : "hsl(var(--accent))") }} />
              <span className="text-foreground font-medium truncate flex-1">{e.title}</span>
              <StatusBadge status={e.status} />
            </button>
          ))}
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <ItemDetailModal
          item={{
            ...selectedEvent,
            dueDate: `${selectedEvent.date.toLocaleString("default", { month: "short" })} ${selectedEvent.date.getDate()}`,
          }}
          open={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
};

export default DashboardCalendar;
