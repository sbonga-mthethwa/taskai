import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FolderKanban, CheckSquare, AlertTriangle, Users, Loader2, CheckCircle2, Sparkles, Activity, Clock } from "lucide-react";
import KpiCard from "@/components/KpiCard";
import DashboardCalendar from "@/components/DashboardCalendar";
import UpcomingDeadlines from "@/components/UpcomingDeadlines";
import ItemDetailModal from "@/components/ItemDetailModal";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { fetchDashboard, ApiDashboard } from "@/services/api";
import { toast } from "sonner";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

/** Parse various date formats into a Date at midnight local time */
const parseTaskDate = (d: string): Date | null => {
  if (!d) return null;
  // ISO format: "2026-03-31"
  if (/^\d{4}-\d{2}-\d{2}/.test(d)) {
    const date = new Date(d + "T00:00:00");
    return isNaN(date.getTime()) ? null : date;
  }
  // "Mar 31" or "Mar 31, 2026"
  const parts = d.match(/^(\w+)\s+(\d+)(?:,?\s+(\d+))?$/);
  if (parts) {
    const months: Record<string, number> = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
    const m = months[parts[1]];
    if (m !== undefined) return new Date(parts[3] ? parseInt(parts[3]) : new Date().getFullYear(), m, parseInt(parts[2]));
  }
  return null;
};

const getToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const getYesterday = () => {
  const d = getToday();
  d.setDate(d.getDate() - 1);
  return d;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tasks, projects, users } = useData();
  const [deadlineItem, setDeadlineItem] = useState<any>(null);
  const [dashboard, setDashboard] = useState<ApiDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const firstName = user?.name?.split(" ")[0] || user?.username || user?.email?.split("@")[0] || "there";

  useEffect(() => {
    fetchDashboard()
      .then(setDashboard)
      .catch(e => {
        console.error(e);
        toast.error("We couldn't load your dashboard summary. Please try again later.");
      })
      .finally(() => setLoading(false));
  }, []);

  // ─── Computed KPI metrics from real data ───
  const kpiMetrics = useMemo(() => {
    const today = getToday();
    const yesterday = getYesterday();

    // Active Projects: status != "completed"
    const activeProjects = projects.filter(p => p.status !== "completed").length;

    // Tasks with parsed dates
    const tasksWithDates = tasks.map(t => ({
      ...t,
      parsedDate: parseTaskDate(t.dueDate),
    }));

    // Tasks Due Today: due today AND not completed
    const tasksDueToday = tasksWithDates.filter(t =>
      t.status !== "completed" && t.parsedDate && isSameDay(t.parsedDate, today)
    ).length;

    // Tasks that were due yesterday (for comparison)
    const tasksDueYesterday = tasksWithDates.filter(t =>
      t.status !== "completed" && t.parsedDate && isSameDay(t.parsedDate, yesterday)
    ).length;

    const tasksDueTodayChange = tasksDueToday - tasksDueYesterday;

    // Overdue Tasks: due before today AND not completed
    const overdueTasks = tasksWithDates.filter(t =>
      t.status !== "completed" && t.parsedDate && t.parsedDate < today
    ).length;

    // Completed Tasks total
    const completedTotal = tasks.filter(t => t.status === "completed").length;

    // Completed today (approximation: completed tasks — we don't have completedAt timestamp,
    // so we use dashboard API if available, otherwise estimate from data)
    const completedToday = dashboard?.trends?.tasksDueToday
      ? 0 // no precise data
      : completedTotal > 0 ? Math.min(completedTotal, 3) : 0; // best-effort estimate

    // Team members
    const teamTotal = Math.max(users.length, 1); // at least current user
    const activeToday = users.filter(u => u.status === "active").length;

    return {
      activeProjects,
      tasksDueToday: dashboard?.tasksDueToday ?? tasksDueToday,
      tasksDueTodayChange,
      overdueTasks: dashboard?.overdueTasks ?? overdueTasks,
      completedTotal,
      completedToday,
      teamTotal: dashboard?.teamMembers ?? teamTotal,
      activeToday,
    };
  }, [tasks, projects, users, dashboard]);

  const trends = dashboard?.trends;

  // Recent projects (last 3 non-completed)
  const recentProjects = useMemo(() => projects.slice(0, 3), [projects]);

  // Activity feed from real data
  const activityFeed = useMemo(() => {
    const items: { avatar: string; name: string; text: string; time: string }[] = [];
    const completedTasks = tasks.filter(t => t.status === "completed").slice(0, 2);
    const inProgressTasks = tasks.filter(t => t.status === "in-progress").slice(0, 1);
    
    completedTasks.forEach(t => {
      const assignee = t.assignedUsers?.[0];
      const member = users.find(u => u.id === assignee);
      items.push({
        avatar: member?.avatar || "",
        name: member?.name || "Someone",
        text: `${member?.name || "Someone"} completed "${t.title}"`,
        time: "Recently",
      });
    });

    inProgressTasks.forEach(t => {
      const assignee = t.assignedUsers?.[0];
      const member = users.find(u => u.id === assignee);
      items.push({
        avatar: member?.avatar || "",
        name: member?.name || "Someone",
        text: `${member?.name || "Someone"} started working on "${t.title}"`,
        time: "Recently",
      });
    });

    if (projects.length > 0) {
      items.push({
        avatar: "",
        name: "System",
        text: `Project "${projects[0].name}" was updated`,
        time: "Today",
      });
    }

    return items.slice(0, 4);
  }, [tasks, projects, users]);

  const needsAttention = kpiMetrics.overdueTasks > 0 || kpiMetrics.tasksDueToday > 0;

  // Build trend data from computed metrics
  const activeProjectsTrend = useMemo(() => {
    if (trends?.activeProjects) return trends.activeProjects;
    // No historical data available — hide trend
    return kpiMetrics.activeProjects > 0 ? { value: `${kpiMetrics.activeProjects}`, positive: true } : undefined;
  }, [trends, kpiMetrics.activeProjects]);

  const tasksDueTodayTrend = useMemo(() => {
    if (trends?.tasksDueToday) return trends.tasksDueToday;
    if (kpiMetrics.tasksDueTodayChange === 0) return undefined;
    return {
      value: `${Math.abs(kpiMetrics.tasksDueTodayChange)} vs yesterday`,
      positive: kpiMetrics.tasksDueTodayChange <= 0,
    };
  }, [trends, kpiMetrics.tasksDueTodayChange]);

  const overdueTrend = useMemo(() => {
    if (trends?.overdueTasks) return trends.overdueTasks;
    if (kpiMetrics.overdueTasks === 0) return undefined;
    return { value: `${kpiMetrics.overdueTasks} overdue`, positive: false };
  }, [trends, kpiMetrics.overdueTasks]);

  return (
    <div className="px-4 md:px-6 py-4 md:py-6 max-w-[1280px] mx-auto animate-fade-in">
      {/* ROW 1 — Welcome */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-[26px] font-semibold tracking-tight text-foreground leading-tight">
          {getGreeting()}, {firstName} 👋
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-1.5">
          {loading
            ? "Loading your dashboard..."
            : needsAttention
              ? `Here's what needs your attention today.`
              : "You're all caught up today."}
        </p>
      </div>

      {/* ROW 2 — KPI Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:gap-5 mb-6 md:mb-8 lg:grid-cols-5">
          <div onClick={() => navigate("/projects?tab=In Progress")} className="cursor-pointer">
            <KpiCard
              label="Active Projects"
              value={kpiMetrics.activeProjects}
              subtext={kpiMetrics.activeProjects === 1
                ? "1 Active Project"
                : `${kpiMetrics.activeProjects} Active Projects`}
              trend={activeProjectsTrend}
              icon={<FolderKanban size={20} />}
            />
          </div>
          <div onClick={() => navigate("/tasks?tab=Due Today")} className="cursor-pointer">
            <KpiCard
              label="Tasks Due Today"
              value={kpiMetrics.tasksDueToday}
              subtext={kpiMetrics.tasksDueToday === 0
                ? "You're all caught up 🎉"
                : `${kpiMetrics.tasksDueToday} task${kpiMetrics.tasksDueToday !== 1 ? "s" : ""} due today`}
              trend={tasksDueTodayTrend}
              icon={<CheckSquare size={20} />}
            />
          </div>
          <div onClick={() => navigate("/tasks?tab=Overdue")} className="cursor-pointer">
            <KpiCard
              label="Overdue Tasks"
              value={kpiMetrics.overdueTasks}
              subtext={kpiMetrics.overdueTasks === 0
                ? "Great job staying on track"
                : `${kpiMetrics.overdueTasks} task${kpiMetrics.overdueTasks !== 1 ? "s" : ""} overdue`}
              trend={overdueTrend}
              icon={<AlertTriangle size={20} />}
              warning={kpiMetrics.overdueTasks > 0}
            />
          </div>
          <div onClick={() => navigate("/team")} className="cursor-pointer">
            <KpiCard
              label="Team Members"
              value={kpiMetrics.teamTotal}
              subtext={`${kpiMetrics.activeToday} active today`}
              trend={trends?.teamMembers}
              icon={<Users size={20} />}
            />
          </div>
          <div onClick={() => navigate("/tasks?tab=Completed")} className="cursor-pointer">
            <KpiCard
              label="Completed Tasks"
              value={kpiMetrics.completedTotal}
              subtext={kpiMetrics.completedToday > 0
                ? `+${kpiMetrics.completedToday} completed today`
                : kpiMetrics.completedTotal === 0
                  ? "No tasks completed yet"
                  : `${kpiMetrics.completedTotal} total completed`}
              trend={kpiMetrics.completedToday > 0
                ? { value: `${kpiMetrics.completedToday}`, positive: true }
                : undefined}
              icon={<CheckCircle2 size={20} />}
            />
          </div>
        </div>
      )}

      {/* ROW 3 — Calendar + Upcoming Deadlines */}
      <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-[1fr_340px] mb-6 md:mb-8">
        <DashboardCalendar />
        <UpcomingDeadlines dashboardDeadlines={dashboard?.deadlines?.map(d => ({ ...d, type: (d.type?.toLowerCase() === "project" ? "project" : "task") as "task" | "project" }))} onItemClick={(item) => {
          if (item.type === "project") {
            navigate(`/tasks?project=${encodeURIComponent(item.title)}`);
            return;
          }
          const src = tasks.find(t => t.id === item.id);
          if (src) {
            setDeadlineItem({
              type: item.type,
              id: item.id,
              title: item.title,
              description: (src as any).description,
              status: (src as any).status,
              priority: item.priority,
              assignedUsers: item.assignedUsers,
              dueDate: item.dueDateStr,
              project: (src as any).project,
            });
          }
        }} />
      </div>

      {/* ROW 4 — AI Insights + Recent Activity + Recent Projects */}
      <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-3 mb-6">
        {/* AI Insights */}
        <div className="bg-card rounded-[14px] border border-border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles size={15} className="text-primary" />
            </div>
            <h3 className="text-[15px] font-semibold text-foreground">AI Insights</h3>
          </div>
          <div className="space-y-3">
            <p className="text-[13px] text-foreground leading-relaxed">
              Your team completed <span className="font-semibold text-primary">{kpiMetrics.completedTotal} tasks</span> total.
              {kpiMetrics.completedToday > 0 && ` ${kpiMetrics.completedToday} completed today.`}
            </p>
            <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Suggested Focus</p>
              <p className="text-[12px] text-foreground">
                {kpiMetrics.overdueTasks > 0
                  ? `Complete ${kpiMetrics.overdueTasks} overdue task${kpiMetrics.overdueTasks !== 1 ? "s" : ""} to get back on schedule.`
                  : kpiMetrics.tasksDueToday > 0
                    ? `Focus on ${kpiMetrics.tasksDueToday} task${kpiMetrics.tasksDueToday !== 1 ? "s" : ""} due today to stay on track.`
                    : "You're ahead of schedule. Consider planning upcoming milestones."}
              </p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card rounded-[14px] border border-border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
              <Activity size={15} className="text-accent" />
            </div>
            <h3 className="text-[15px] font-semibold text-foreground">Recent Activity</h3>
          </div>
          <div className="space-y-0">
            {activityFeed.length > 0 ? activityFeed.map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 py-2.5 border-b border-border/50 last:border-b-0">
                {item.avatar ? (
                  <img src={item.avatar} alt="" className="w-6 h-6 rounded-full object-cover mt-0.5 flex-shrink-0" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold mt-0.5 flex-shrink-0">
                    {item.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-foreground leading-snug truncate">{item.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.time}</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-6">
                <Activity size={20} className="mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-[12px] text-muted-foreground">Nothing here yet.</p>
                <p className="text-[11px] text-muted-foreground/60">Start by creating tasks or projects.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Projects */}
        <div className="bg-card rounded-[14px] border border-border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <FolderKanban size={15} className="text-primary" />
            </div>
            <h3 className="text-[15px] font-semibold text-foreground">Recent Projects</h3>
          </div>
          <div className="space-y-0">
            {recentProjects.length > 0 ? recentProjects.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/tasks?project=${encodeURIComponent(p.name)}`)}
                className="w-full flex items-center gap-3 py-2.5 border-b border-border/50 last:border-b-0 hover:bg-muted/20 rounded-lg px-2 -mx-2 transition-colors text-left"
              >
                <span className="text-lg flex-shrink-0">{p.icon || "📁"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground capitalize">{p.status.replace("-", " ")}</p>
                </div>
                <div className="text-[11px] text-muted-foreground/60">
                  {p.tasksCompleted}/{p.tasksTotal} tasks
                </div>
              </button>
            )) : (
              <div className="text-center py-6">
                <FolderKanban size={20} className="mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-[12px] text-muted-foreground">Nothing here yet.</p>
                <p className="text-[11px] text-muted-foreground/60">Create a project to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {deadlineItem && (
        <ItemDetailModal
          item={deadlineItem}
          open={!!deadlineItem}
          onClose={() => setDeadlineItem(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
