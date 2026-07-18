import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, Plus, MoreHorizontal, LayoutGrid, List, Trash2, Pencil, UserPlus, X, Loader2, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import AvatarStack from "@/components/AvatarStack";
import AssignedUsersPopover from "@/components/AssignedUsersPopover";
import CreateItemModal, { CreateItemData } from "@/components/CreateItemModal";
import ItemDetailModal from "@/components/ItemDetailModal";
import TeamMemberModal from "@/components/TeamMemberModal";
import { Project, TeamMember } from "@/types";
import { createProject as apiCreateProject, updateProject as apiUpdateProject, deleteProject as apiDeleteProject } from "@/services/api";
import { createInvitation } from "@/services/invitationApi";
import { toast } from "sonner";

const tabs = ["All Projects", "In Progress", "No Progress", "Completed", "My Projects"];

const ProjectsPage = () => {
  const { user } = useAuth();
  const { projects: allProjects, users: teamMembers, refreshProjects } = useData();
  const permissions = usePermissions();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialTab = tabs.includes(searchParams.get("tab") || "") ? searchParams.get("tab")! : "All Projects";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("lastUpdated");
  const [viewMode, setViewMode] = useState<"list" | "board">("list");
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [memberModal, setMemberModal] = useState<TeamMember | null>(null);
  const [dropdownId, setDropdownId] = useState<string | null>(null);
  const [inviteProject, setInviteProject] = useState<Project | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSending, setInviteSending] = useState(false);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);

  const visibleProjects = allProjects;

  useEffect(() => {
    if (searchParams.get("new") === "1") setShowNewModal(true);
  }, [searchParams]);

  const matchesSearch = (p: Project) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const assignedNames = teamMembers.filter(m => p.assignedUsers.includes(m.id)).map(m => m.name.toLowerCase());
    return p.name.toLowerCase().includes(q) ||
      (p.description || "").toLowerCase().includes(q) ||
      p.status.replace("-", " ").includes(q) ||
      (p.dueDate || "").toLowerCase().includes(q) ||
      assignedNames.some(n => n.includes(q));
  };

  const filtered = visibleProjects
    .filter(p => {
      if (activeTab === "In Progress") return p.status === "in-progress";
      if (activeTab === "No Progress") return p.status === "no-progress";
      if (activeTab === "Completed") return p.status === "completed";
      if (activeTab === "My Projects") return p.ownerUserId === user?.id || p.assignedUsers.includes(user?.id || "");
      return true;
    })
    .filter(matchesSearch)
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "status") return a.status.localeCompare(b.status);
      return 0;
    });

  const handleCreateProject = async (data: CreateItemData) => {
    try {
      const result = await apiCreateProject({
        name: data.name,
        description: data.description,
        status: data.status as Project["status"],
        assignedUsers: data.assignedUsers,
        dueDate: data.dueDate || undefined,
        color: data.color,
        ownerUserId: user?.id,
      });
      const projectId = result?.projectId || result?.id;

      // Send invitations for external users
      if (data.inviteEmails && data.inviteEmails.length > 0 && user) {
        let sentCount = 0;
        for (const email of data.inviteEmails) {
          try {
            await createInvitation({
              invited_email: email,
              invited_role: "member",
              invited_by_user_id: user.id,
              invited_by_name: user.name || user.email,
              workspace_name: "TaskAI",
              project_id: projectId || undefined,
              project_name: data.name,
              message: `You've been invited to join the project "${data.name}" on TaskAI.`,
            });
            sentCount++;
          } catch (invErr: any) {
            toast.error(`Failed to invite ${email}: ${invErr.message}`);
          }
        }
        if (sentCount > 0) {
          toast.success(`${sentCount} invitation${sentCount > 1 ? "s" : ""} sent successfully`);
          window.dispatchEvent(new CustomEvent("invites-updated"));
          window.dispatchEvent(new CustomEvent("notifications-updated"));
        }
      }

      setShowNewModal(false);
      navigate("/projects", { replace: true });
      toast.success("Project created successfully");
      await refreshProjects();
    } catch (e: any) {
      toast.error(e.message || "Failed to create project");
    }
  };

  const handleSaveProject = async (updated: any) => {
    try {
      await apiUpdateProject(updated.id, {
        name: updated.title,
        description: updated.description,
        status: updated.status,
        dueDate: updated.dueDate,
        assignedUsers: updated.assignedUsers,
        color: updated.color,
      });
      setSelectedProject(null);
      toast.success("Project updated successfully");
      await refreshProjects();
    } catch (e: any) {
      toast.error(e.message || "Failed to save changes");
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await apiDeleteProject(projectId);
      toast.success("Project deleted successfully");
      await refreshProjects();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete project");
    }
  };

  const handleSendInvite = async () => {
    console.log("[invite] send clicked", { project: inviteProject?.name, email: inviteEmail, user: user?.id });
    if (!inviteProject || !user) {
      console.warn("[invite] aborted — missing project or user", { inviteProject, user });
      toast.error("Cannot send invite: missing project or user context");
      return;
    }
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    setInviteSending(true);
    const payload = {
      invited_email: email,
      invited_role: "member",
      invited_by_user_id: user.id,
      invited_by_name: user.name || user.email,
      workspace_name: "TaskAI",
      project_id: inviteProject.id,
      project_name: inviteProject.name,
      message: `You've been invited to join the project "${inviteProject.name}" on TaskAI.`,
    };
    console.log("[invite] modal opened for project", inviteProject);
    console.log("[invite] sending payload", payload);
    console.log("[invite] endpoint", "https://daiee5zick.execute-api.af-south-1.amazonaws.com/prod/invites");
    try {
      const response = await createInvitation(payload);
      console.log("[invite] response body", response);
      toast.success(`Invitation sent to ${email}`);
      console.log("Refreshing sent invites");
      console.log("Refreshing received invites");
      window.dispatchEvent(new CustomEvent("invites-updated"));
      window.dispatchEvent(new CustomEvent("notifications-updated"));
      setInviteProject(null);
      setInviteEmail("");
    } catch (e: any) {
      toast.error(e.message || "Failed to send invitation");
    } finally {
      setInviteSending(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h1 className="text-lg md:text-xl font-semibold tracking-tight text-foreground">Projects</h1>
        {permissions.canCreateProject && (
          <Button size="sm" className="h-8 md:h-9 gap-1.5 text-sm font-medium" onClick={() => setShowNewModal(true)}>
            <Plus size={16} /> <span className="hidden sm:inline">New Project</span><span className="sm:hidden">New</span>
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-4 mb-4 border-b border-border overflow-x-auto scrollbar-none">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 text-xs md:text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${activeTab === tab ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 md:gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-0">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..." className="w-full h-9 pl-9 pr-4 text-sm bg-muted/50 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60" />
        </div>
        <div className="hidden sm:flex items-center rounded-lg border border-border overflow-hidden">
          <button onClick={() => setViewMode("list")} className={`w-9 h-9 flex items-center justify-center transition-all duration-150 ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}><List size={15} /></button>
          <div className="w-px h-5 bg-border" />
          <button onClick={() => setViewMode("board")} className={`w-9 h-9 flex items-center justify-center transition-all duration-150 ${viewMode === "board" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}><LayoutGrid size={15} /></button>
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="hidden sm:block h-9 px-3 text-sm bg-card border border-border rounded-md text-foreground focus:outline-none">
          <option value="lastUpdated">Sort by: Last Updated</option>
          <option value="name">Sort by: Name</option>
          <option value="status">Sort by: Status</option>
        </select>
      </div>

      {viewMode === "list" ? (
        <div className="bg-card rounded-lg card-shadow overflow-x-auto">
          <div className="hidden md:grid grid-cols-[1fr_100px_80px_100px_130px_120px_40px] gap-4 px-5 py-3 bg-muted/30 text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
            <span>Project</span><span>Status</span><span>Assigned</span><span>Team</span><span>Progress</span><span>Updated</span><span></span>
          </div>
          <div className="divide-y divide-border">
            {filtered.map(p => {
              const isOwner = permissions.isProjectOwner(p);
              return (
                <div key={p.id} onClick={() => navigate(`/tasks?project=${encodeURIComponent(p.name)}`)} className="flex flex-col md:grid md:grid-cols-[1fr_100px_80px_100px_130px_120px_40px] gap-2 md:gap-4 px-4 md:px-5 py-3.5 md:items-center hover:bg-muted/20 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between md:justify-start gap-3 min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                      {p.color ? <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} /> : <span className="text-base">{p.icon}</span>}
                      <span className="text-sm font-medium text-foreground truncate">{p.name}</span>
                    </div>
                    <div className="md:hidden">
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                  <div className="hidden md:block"><StatusBadge status={p.status} /></div>
                  <div className="hidden md:block"><AssignedUsersPopover userIds={p.assignedUsers} onMemberClick={m => setMemberModal(m)} /></div>
                  <div className="hidden md:block"><AvatarStack initials={p.team} /></div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${(p.tasksCompleted / Math.max(p.tasksTotal, 1)) * 100}%` }} />
                    </div>
                    <span className="text-[11px] text-muted-foreground tabular-nums">{p.tasksCompleted}/{p.tasksTotal}</span>
                  </div>
                  <span className="hidden md:block text-xs text-muted-foreground tabular-nums">{p.lastUpdated}</span>
                  <div className="hidden md:block relative">
                    <button onClick={e => { e.stopPropagation(); setDropdownId(dropdownId === p.id ? null : p.id); }} className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                      <MoreHorizontal size={16} />
                    </button>
                    {dropdownId === p.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-lg shadow-lg py-1 z-50 animate-fade-in">
                        {isOwner && (
                          <>
                            <button onClick={e => { e.stopPropagation(); setDropdownId(null); setSelectedProject(p); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                              <Pencil size={14} /> Edit Project
                            </button>
                            <button onClick={e => { e.stopPropagation(); setDropdownId(null); console.log("Opening invite modal for project:", p.name); setInviteProject(p); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                              <UserPlus size={14} /> Invite Members
                            </button>
                            <div className="border-t border-border my-1" />
                            <button onClick={e => { e.stopPropagation(); setDropdownId(null); setDeleteProject(p); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors">
                              <Trash2 size={14} /> Delete Project
                            </button>
                          </>
                        )}
                        {!isOwner && (
                          <div className="px-3 py-2 text-xs text-muted-foreground">No actions available</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">No projects found</div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => {
            const isOwner = permissions.isProjectOwner(p);
            return (
              <div key={p.id} onClick={() => navigate(`/tasks?project=${encodeURIComponent(p.name)}`)} className="bg-card rounded-xl border border-border p-5 hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200 cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {p.color ? <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} /> : <span className="text-base">{p.icon}</span>}
                    <span className="text-sm font-semibold text-foreground truncate">{p.name}</span>
                  </div>
                  {isOwner && (
                    <button onClick={e => { e.stopPropagation(); }} className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors opacity-0 group-hover:opacity-100">
                      <MoreHorizontal size={15} />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-3"><StatusBadge status={p.status} /></div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${(p.tasksCompleted / Math.max(p.tasksTotal, 1)) * 100}%` }} />
                  </div>
                  <span className="text-[11px] text-muted-foreground tabular-nums">{p.tasksCompleted}/{p.tasksTotal}</span>
                </div>
                <div className="flex items-center justify-between">
                  <AssignedUsersPopover userIds={p.assignedUsers} onMemberClick={m => setMemberModal(m)} />
                  <span className="text-[11px] text-muted-foreground tabular-nums">{p.lastUpdated}</span>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full px-5 py-8 text-center text-sm text-muted-foreground">No projects found</div>
          )}
        </div>
      )}

      <CreateItemModal type="project" open={showNewModal} onClose={() => { setShowNewModal(false); navigate("/projects", { replace: true }); }} onCreate={handleCreateProject} />

      {selectedProject && (
        <ItemDetailModal
          item={{ type: "project", id: selectedProject.id, title: selectedProject.name, description: selectedProject.description, status: selectedProject.status, priority: "medium", assignedUsers: selectedProject.assignedUsers, dueDate: selectedProject.dueDate, color: selectedProject.color, attachedDocuments: selectedProject.attachedDocuments, ownerUserId: selectedProject.ownerUserId }}
          open={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          onSave={handleSaveProject}
        />
      )}

      <TeamMemberModal member={memberModal} open={!!memberModal} onOpenChange={o => { if (!o) setMemberModal(null); }} />

      {inviteProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={() => !inviteSending && setInviteProject(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-card rounded-xl border border-border shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <UserPlus size={16} className="text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Invite Members</h3>
              </div>
              <button onClick={() => !inviteSending && setInviteProject(null)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Project</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 border border-border rounded-md text-sm text-foreground">
                  {inviteProject.color ? <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: inviteProject.color }} /> : <span>{inviteProject.icon}</span>}
                  <span className="font-medium">{inviteProject.name}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email address</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleSendInvite(); }}
                    placeholder="name@example.com"
                    autoFocus
                    disabled={inviteSending}
                    className="w-full h-9 pl-9 pr-3 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
              <Button variant="ghost" size="sm" onClick={() => setInviteProject(null)} disabled={inviteSending}>Cancel</Button>
              <Button size="sm" onClick={handleSendInvite} disabled={inviteSending || !inviteEmail.trim()}>
                {inviteSending ? <><Loader2 size={14} className="animate-spin mr-1.5" /> Sending...</> : "Send Invite"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={() => setDeleteProject(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-card rounded-xl border border-border shadow-lg w-full max-w-sm">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Delete Project</h3>
            </div>
            <div className="p-5">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete <span className="font-medium text-foreground">{deleteProject.name}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
              <Button variant="ghost" size="sm" onClick={() => setDeleteProject(null)}>Cancel</Button>
              <Button variant="destructive" size="sm" onClick={async () => { const id = deleteProject.id; setDeleteProject(null); await handleDeleteProject(id); }}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
