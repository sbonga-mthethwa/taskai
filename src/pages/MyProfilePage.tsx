import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Phone, MessageSquare, UserPlus, CheckSquare, FolderKanban, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StatusBadge from "@/components/StatusBadge";
import PriorityIndicator from "@/components/PriorityIndicator";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import InvitesSection from "@/components/InvitesSection";
import { toast } from "sonner";

const MyProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { users: teamMembers, tasks, projects } = useData();

  const [activeSection, setActiveSection] = useState<"overview" | "projects" | "tasks" | "progress" | "invites">("overview");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignType, setAssignType] = useState<"project" | "task">("project");
  const [assignSearch, setAssignSearch] = useState("");
  const [selectedAssign, setSelectedAssign] = useState<string[]>([]);

  const currentId = user?.userId || user?.id || "";
  const member = currentId ? teamMembers.find(m => m.id === currentId) : undefined;

  const memberTasks = useMemo(() => tasks.filter(t => t.assignedUsers.includes(currentId)), [tasks, currentId]);
  const memberProjects = useMemo(() => projects.filter(p => p.assignedUsers.includes(currentId)), [projects, currentId]);

  const displayName = user?.name || "User";
  const displayEmail = user?.email || "";
  const displayDepartment = user?.department || "";
  const displayAvatar = user?.avatarUrl || "";
  const displayStatus = member?.status || "inactive";

  const completedTasks = memberTasks.filter(t => t.status === "completed").length;
  const taskProgress = memberTasks.length > 0 ? Math.round((completedTasks / memberTasks.length) * 100) : 0;

  const handleAssignConfirm = () => {
    if (selectedAssign.length === 0) { toast.error("Please select at least one item"); return; }
    toast.success(`${selectedAssign.length} ${assignType}${selectedAssign.length > 1 ? "s" : ""} assigned`);
    setShowAssignModal(false);
    setSelectedAssign([]);
    setAssignSearch("");
  };

  const openAssignModal = (type: "project" | "task") => {
    setAssignType(type);
    setSelectedAssign([]);
    setAssignSearch("");
    setShowAssignModal(true);
  };

  const assignItems = assignType === "project"
    ? projects.filter(p => p.status !== "completed" && (!assignSearch || p.name.toLowerCase().includes(assignSearch.toLowerCase())))
    : tasks.filter(t => t.status !== "completed" && (!assignSearch || t.title.toLowerCase().includes(assignSearch.toLowerCase())));

  const sections = ["overview", "projects", "tasks", "progress", "invites"] as const;

  return (
    <div className="p-4 md:p-6 max-w-[1100px] mx-auto animate-fade-in">
      <div className="bg-card rounded-2xl border border-border overflow-hidden mb-4 md:mb-6 mt-2 md:mt-4">
        <div className="h-20 md:h-24 gradient-brand" />
        <div className="px-4 md:px-6 pb-4 md:pb-5">
          <div className="-mt-8 md:-mt-10 mb-2">
            {displayAvatar ? (
              <img src={displayAvatar} alt={displayName} className="w-16 md:w-20 h-16 md:h-20 rounded-full border-4 border-card object-cover" />
            ) : (
              <div className="w-16 md:w-20 h-16 md:h-20 rounded-full border-4 border-card bg-primary/10 text-primary flex items-center justify-center text-xl font-semibold">
                {displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
            )}
          </div>
          <div className="mt-2 mb-3 md:mb-4">
            <h1 className="text-lg md:text-xl font-semibold text-foreground">{displayName}</h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Team Member · {displayDepartment}</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-5 text-xs sm:text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Mail size={14} /> {displayEmail}</span>
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${displayStatus === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${displayStatus === "active" ? "bg-success" : "bg-muted-foreground"}`} />
                {displayStatus === "active" ? "Active" : "Offline"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => openAssignModal("project")}><UserPlus size={14} /> Assign</Button>
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => navigate("/tasks")}><MessageSquare size={14} /> View Tasks</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 mb-4 md:mb-6 border-b border-border overflow-x-auto scrollbar-none">
        {sections.map(s => (
          <button key={s} onClick={() => setActiveSection(s)} className={`px-3 md:px-4 py-2.5 text-xs md:text-sm font-medium capitalize transition-colors border-b-2 -mb-px whitespace-nowrap ${activeSection === s ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {s === "progress" ? "Progress Tracking" : s}
          </button>
        ))}
      </div>

      {activeSection === "overview" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl border border-border p-4 text-center cursor-pointer hover:shadow-md transition-shadow active:scale-[0.97]" onClick={() => setActiveSection("projects")}>
            <FolderKanban size={18} className="mx-auto text-primary mb-2" /><p className="text-2xl font-semibold text-foreground">{memberProjects.length}</p><p className="text-xs text-muted-foreground mt-1">Assigned Projects</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center cursor-pointer hover:shadow-md transition-shadow active:scale-[0.97]" onClick={() => setActiveSection("tasks")}>
            <CheckSquare size={18} className="mx-auto text-primary mb-2" /><p className="text-2xl font-semibold text-foreground">{memberTasks.length}</p><p className="text-xs text-muted-foreground mt-1">Assigned Tasks</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center cursor-pointer hover:shadow-md transition-shadow active:scale-[0.97]" onClick={() => setActiveSection("tasks")}>
            <CheckSquare size={18} className="mx-auto text-success mb-2" /><p className="text-2xl font-semibold text-foreground">{completedTasks}</p><p className="text-xs text-muted-foreground mt-1">Completed Tasks</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center cursor-pointer hover:shadow-md transition-shadow active:scale-[0.97]" onClick={() => setActiveSection("progress")}>
            <div className="text-2xl font-semibold text-foreground">{taskProgress}%</div><p className="text-xs text-muted-foreground mt-1">Task Completion</p>
            <div className="w-full h-1.5 bg-muted rounded-full mt-2"><div className="h-full bg-primary rounded-full transition-all" style={{ width: `${taskProgress}%` }} /></div>
          </div>
        </div>
      )}

      {activeSection === "projects" && (
        <div className="bg-card rounded-xl border border-border overflow-x-auto">
          <div className="hidden md:grid grid-cols-[1fr_100px_100px_120px_80px] gap-3 px-5 py-3 bg-muted/30 text-[11px] uppercase tracking-wider font-bold text-muted-foreground"><span>Project</span><span>Status</span><span>Priority</span><span>Due Date</span><span>Progress</span></div>
          <div className="divide-y divide-border">
            {memberProjects.length === 0 && <p className="px-5 py-6 text-sm text-muted-foreground text-center">No assigned projects</p>}
            {memberProjects.map(p => (
              <div key={p.id} onClick={() => navigate(`/tasks?project=${encodeURIComponent(p.name)}`)} className="flex flex-col gap-1.5 px-4 py-3 md:grid md:grid-cols-[1fr_100px_100px_120px_80px] md:gap-3 md:px-5 md:items-center hover:bg-muted/20 cursor-pointer transition-colors">
                <div className="flex items-center justify-between md:justify-start gap-2 min-w-0">
                  <div className="flex items-center gap-2 min-w-0"><span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color || "hsl(var(--primary))" }} /><span className="text-sm font-medium text-foreground truncate">{p.name}</span></div>
                  <div className="md:hidden"><StatusBadge status={p.status} /></div>
                </div>
                <div className="hidden md:block"><StatusBadge status={p.status} /></div>
                <span className="hidden md:block text-xs text-muted-foreground">—</span>
                <span className="hidden md:block text-xs text-muted-foreground">{p.dueDate || "—"}</span>
                <div className="flex items-center gap-2"><div className="flex-1 h-1.5 bg-muted rounded-full"><div className="h-full bg-primary rounded-full" style={{ width: `${Math.round((p.tasksCompleted / Math.max(p.tasksTotal, 1)) * 100)}%` }} /></div><span className="text-[10px] text-muted-foreground">{Math.round((p.tasksCompleted / Math.max(p.tasksTotal, 1)) * 100)}%</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === "tasks" && (
        <div className="bg-card rounded-xl border border-border overflow-x-auto">
          <div className="hidden md:grid grid-cols-[1fr_120px_80px_80px_80px] gap-3 px-5 py-3 bg-muted/30 text-[11px] uppercase tracking-wider font-bold text-muted-foreground"><span>Task</span><span>Project</span><span>Due Date</span><span>Status</span><span>Priority</span></div>
          <div className="divide-y divide-border">
            {memberTasks.length === 0 && <p className="px-5 py-6 text-sm text-muted-foreground text-center">No assigned tasks</p>}
            {memberTasks.map(t => (
              <div key={t.id} onClick={() => navigate(`/tasks?task=${t.id}`)} className="flex flex-col gap-1.5 px-4 py-3 md:grid md:grid-cols-[1fr_120px_80px_80px_80px] md:gap-3 md:px-5 md:items-center hover:bg-muted/20 cursor-pointer transition-colors">
                <div className="flex items-center justify-between md:justify-start gap-2 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">{t.color && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />}<span className="text-sm font-medium text-foreground truncate">{t.title}</span></div>
                  <div className="md:hidden"><StatusBadge status={t.status} /></div>
                </div>
                <span className="text-xs text-muted-foreground truncate">{t.project}</span>
                <span className="hidden md:block text-xs text-muted-foreground">{t.dueDate}</span>
                <div className="hidden md:block"><StatusBadge status={t.status} /></div>
                <div className="hidden md:block"><PriorityIndicator priority={t.priority} /></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === "progress" && (
        <div className="space-y-4">
          {memberProjects.map(p => {
            const pct = Math.round((p.tasksCompleted / Math.max(p.tasksTotal, 1)) * 100);
            return (
              <div key={p.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-foreground">{p.name}</span><span className="text-xs text-muted-foreground">{p.tasksCompleted}/{p.tasksTotal} tasks</span></div>
                <div className="w-full h-2 bg-muted rounded-full"><div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} /></div>
                <div className="flex items-center justify-between mt-1.5"><StatusBadge status={p.status} /><span className="text-xs font-medium text-foreground">{pct}%</span></div>
              </div>
            );
          })}
          {memberProjects.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No projects to track</p>}
        </div>
      )}

      {activeSection === "invites" && (
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">My Invitations</h3>
          <InvitesSection filterByEmail={displayEmail} />
        </div>
      )}

      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Self-Assign</DialogTitle></DialogHeader>
          <div className="flex gap-2 mb-4">
            <Button size="sm" variant={assignType === "project" ? "default" : "outline"} onClick={() => { setAssignType("project"); setSelectedAssign([]); }}><FolderKanban size={14} className="mr-1.5" /> Projects</Button>
            <Button size="sm" variant={assignType === "task" ? "default" : "outline"} onClick={() => { setAssignType("task"); setSelectedAssign([]); }}><CheckSquare size={14} className="mr-1.5" /> Tasks</Button>
          </div>
          <div className="relative mb-3"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={assignSearch} onChange={e => setAssignSearch(e.target.value)} placeholder={`Search ${assignType}s...`} className="w-full h-9 pl-9 pr-3 text-sm bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
          <div className="max-h-[240px] overflow-y-auto space-y-1">
            {assignItems.map((item: any) => {
              const itemId = item.id;
              const itemName = item.name || item.title;
              const isSelected = selectedAssign.includes(itemId);
              return (
                <button key={itemId} onClick={() => setSelectedAssign(prev => isSelected ? prev.filter(x => x !== itemId) : [...prev, itemId])} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"}`}>
                  <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border"}`}>{isSelected && "✓"}</span>
                  <span className="truncate">{itemName}</span>
                </button>
              );
            })}
          </div>
          <div className="flex justify-between mt-4 pt-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setShowAssignModal(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAssignConfirm}>Assign {selectedAssign.length > 0 && `(${selectedAssign.length})`}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyProfilePage;
