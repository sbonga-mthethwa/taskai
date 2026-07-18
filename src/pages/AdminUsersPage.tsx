import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Search, Plus, MoreHorizontal, Pencil, Trash2, Loader2, Mail, Shield, UserX, KeyRound, Users, UserCheck, Clock, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TeamMemberModal from "@/components/TeamMemberModal";
import AdminInvitesSection from "@/components/AdminInvitesSection";
import { TeamMember, Project } from "@/types";
import { usePermissions } from "@/hooks/usePermissions";
import { createInvitation } from "@/services/invitationApi";
import { toast } from "sonner";

// Helper: get initials from name or email
function getInitials(name: string, email?: string): string {
  if (name && name !== "Unknown User") {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  }
  if (email) return email.substring(0, 2).toUpperCase();
  return "??";
}

// Helper: relative time from ISO string or epoch
function formatLastLogin(val?: string): string {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Status badge component for team members
function MemberStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    active: { label: "Active", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    invited: { label: "Invited", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    inactive: { label: "Disabled", className: "bg-muted text-muted-foreground" },
  };
  const c = config[status] || config.inactive;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${c.className}`}>{c.label}</span>;
}

const AdminUsersPage = () => {
  const { user } = useAuth();
  const { users, projects, loadingUsers } = useData();
  const permissions = usePermissions();
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"members" | "invites">("members");

  // Add user form state
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addMessage, setAddMessage] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [sending, setSending] = useState(false);

  // Show projects where user is owner, creator, or member
  const ownedProjects = useMemo(() => {
    const uid = user?.id || "";
    return projects.filter(p =>
      p.ownerUserId === uid ||
      p.createdBy === uid ||
      p.assignedUsers?.includes(uid) ||
      p.team?.includes(uid)
    );
  }, [projects, user]);

  // Only show users who share a project with the current user (teammates)
  const teammates = useMemo(() => {
    if (!user?.id) return [];
    // Collect all user IDs from projects where current user is a member
    const myProjects = projects.filter(p =>
      p.ownerUserId === user.id ||
      p.assignedUsers?.includes(user.id) ||
      p.team?.includes(user.id)
    );
    const teammateIds = new Set<string>();
    myProjects.forEach(p => {
      if (p.ownerUserId) teammateIds.add(p.ownerUserId);
      p.assignedUsers?.forEach(id => teammateIds.add(id));
      p.team?.forEach(id => teammateIds.add(id));
    });
    // Remove self
    teammateIds.delete(user.id);
    return users.filter(u => teammateIds.has(u.id));
  }, [users, projects, user]);

  // Stats based on teammates only
  const totalMembers = teammates.length;
  const activeMembers = teammates.filter(u => u.status === "active").length;
  const invitedMembers = teammates.filter(u => u.status === "invited").length;

  const handleMemberClick = (u: TeamMember) => {
    setSelectedMember(u);
    setMemberModalOpen(true);
  };

  const resetAddForm = () => {
    setAddName("");
    setAddEmail("");
    setAddMessage("");
    setSelectedProjectId("");
  };

  const handleSendInvite = async () => {
    console.log("[invite] send clicked", { email: addEmail, projectId: selectedProjectId, user: user?.id });
    if (!addEmail.trim()) {
      toast.error("Email address is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!selectedProjectId) {
      toast.error("Please select a project to invite the member to");
      return;
    }
    const selectedProject = ownedProjects.find(p => p.id === selectedProjectId);
    setSending(true);
    try {
      const result = await createInvitation({
        invited_email: addEmail.trim(),
        invited_role: "member",
        invited_by_user_id: user?.id || "unknown",
        invited_by_name: user?.name || "User",
        message: addMessage.trim() || undefined,
        full_name: addName.trim() || undefined,
        project_id: selectedProjectId,
        project_name: selectedProject?.name,
        workspace_name: "TaskAI",
      });
      toast.success("Invitation sent successfully!", {
        description: `${addEmail.trim()} was invited to "${selectedProject?.name || ""}".`,
        duration: 6000,
      });
      // Notify other parts of the app to refresh
      window.dispatchEvent(new CustomEvent("invites-updated"));
      window.dispatchEvent(new CustomEvent("notifications-updated"));
      resetAddForm();
      setShowAddModal(false);
    } catch (err: any) {
      const message = err.message === "Failed to fetch"
        ? "Unable to reach the server. Please check your connection and try again."
        : err.message || "Failed to send invitation";
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  const filtered = teammates.filter(u => {
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q);
  });

  const statCards = [
    { label: "Team Members", value: totalMembers, icon: Users, color: "text-primary" },
    { label: "Active", value: activeMembers, icon: UserCheck, color: "text-emerald-500" },
    { label: "Pending Invites", value: invitedMembers, icon: Clock, color: "text-amber-500" },
  ];

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-lg md:text-xl font-semibold tracking-tight text-foreground">Team Members</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{teammates.length} teammate{teammates.length !== 1 ? "s" : ""}</p>
        </div>
        <Button size="sm" className="h-8 md:h-9 gap-1.5 text-sm" onClick={() => setShowAddModal(true)}>
          <UserPlus size={16} /> <span className="hidden sm:inline">Invite Member</span><span className="sm:hidden">Invite</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {statCards.map(s => (
          <div key={s.label} className="bg-card rounded-lg border border-border px-4 py-3 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center ${s.color}`}>
              <s.icon size={18} />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground leading-none">{s.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs: Members / Invites */}
      <div className="flex gap-1 mb-4 border-b border-border">
        <button
          onClick={() => setActiveTab("members")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === "members" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Members
        </button>
        <button
          onClick={() => setActiveTab("invites")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${activeTab === "invites" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <Mail size={14} /> Sent Invites
        </button>
      </div>

      {activeTab === "members" && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, department, role..." className="w-full h-9 pl-9 pr-4 text-sm bg-muted/50 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60" />
            </div>
          </div>

          {loadingUsers ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="bg-card rounded-lg card-shadow overflow-x-auto">
              <div className="hidden md:grid grid-cols-[1fr_120px_90px_100px_50px] gap-4 px-5 py-3 bg-muted/30 text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                <span>User</span><span>Department</span><span>Status</span><span>Last Login</span><span></span>
              </div>
              <div className="divide-y divide-border">
                {filtered.map(u => {
                  const initials = getInitials(u.name, u.email);
                  const displayName = u.name && u.name !== "Unknown User" ? u.name : u.email || "Unknown User";
                  return (
                    <div key={u.id} className="flex items-center gap-3 px-4 md:px-5 py-3.5 md:grid md:grid-cols-[1fr_120px_90px_100px_50px] md:gap-4 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => handleMemberClick(u)}>
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {u.avatar ? (
                          <img src={u.avatar} alt={displayName} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-primary">{initials}</span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
                          {u.name && u.name !== "Unknown User" && u.name !== u.email && (
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          )}
                        </div>
                      </div>
                      
                      <span className="hidden md:block text-xs text-muted-foreground">{u.department}</span>
                      <div className="hidden md:block"><MemberStatusBadge status={u.status} /></div>
                      <span className="hidden md:block text-xs text-muted-foreground tabular-nums">{formatLastLogin(u.lastLogin)}</span>
                      <div className="hidden md:block">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button onClick={(e) => e.stopPropagation()} className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                              <MoreHorizontal size={16} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }}>
                              <Pencil size={14} className="mr-2" /> Edit Member
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }}>
                              <Shield size={14} className="mr-2" /> Change Role
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }}>
                              <KeyRound size={14} className="mr-2" /> Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }}>
                              <UserX size={14} className="mr-2" /> Disable User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }} className="text-destructive focus:text-destructive">
                              <Trash2 size={14} className="mr-2" /> Remove from Team
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "invites" && <AdminInvitesSection />}

      <TeamMemberModal member={selectedMember} open={memberModalOpen} onOpenChange={setMemberModalOpen} />

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm animate-fade-in" onClick={() => setShowAddModal(false)}>
          <div className="bg-card rounded-lg card-shadow w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-foreground mb-1">Invite to Project</h2>
            <p className="text-sm text-muted-foreground mb-5">Invite a team member to one of your projects.</p>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Project <span className="text-destructive">*</span></label>
                <select
                  value={selectedProjectId}
                  onChange={e => setSelectedProjectId(e.target.value)}
                  className="w-full h-9 px-3 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select a project...</option>
                  {ownedProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div><label className="text-sm font-medium text-foreground block mb-1">Full Name</label><input value={addName} onChange={e => setAddName(e.target.value)} placeholder="Jane Doe" className="w-full h-9 px-3 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
              <div><label className="text-sm font-medium text-foreground block mb-1">Email <span className="text-destructive">*</span></label><input type="email" value={addEmail} onChange={e => setAddEmail(e.target.value)} placeholder="jane@company.com" className="w-full h-9 px-3 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20" required /></div>
              <div><label className="text-sm font-medium text-foreground block mb-1">Personal Message <span className="text-xs text-muted-foreground">(optional)</span></label><textarea value={addMessage} onChange={e => setAddMessage(e.target.value)} placeholder="Welcome to the team! Looking forward to working with you." rows={2} className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => { resetAddForm(); setShowAddModal(false); }}>Cancel</Button>
              <Button className="flex-1 gap-1.5" onClick={handleSendInvite} disabled={sending}>
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                Send Invite
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
