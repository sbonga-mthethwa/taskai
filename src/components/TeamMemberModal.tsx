import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TeamMember } from "@/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail, Phone, FolderKanban, CheckSquare, MessageSquare, Share2, User, Send, X, Search, Upload } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { toast } from "sonner";

interface TeamMemberModalProps {
  member: TeamMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors: Record<string, string> = {
  active: "bg-success",
  inactive: "bg-muted-foreground",
};

const TeamMemberModal = ({ member, open, onOpenChange }: TeamMemberModalProps) => {
  const navigate = useNavigate();
  const { tasks, projects } = useData();
  const [showComposer, setShowComposer] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [showAssign, setShowAssign] = useState(false);
  const [assignType, setAssignType] = useState<"project" | "task">("project");
  const [assignSearch, setAssignSearch] = useState("");
  const [selectedAssign, setSelectedAssign] = useState<string[]>([]);
  const [showShareDoc, setShowShareDoc] = useState(false);
  const [docSearch, setDocSearch] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

  if (!member) return null;

  const initials = member.name.split(" ").map(n => n[0]).join("");
  const assignedTasks = tasks.filter(t => t.assignedUsers?.includes(member.id)).length;
  const assignedProjects = projects.filter(p => p.assignedUsers?.includes(member.id)).length;

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    toast.success(`Message sent to ${member.name}`);
    setMessageText("");
    setShowComposer(false);
  };

  const handleAssignConfirm = () => {
    if (selectedAssign.length === 0) { toast.error("Select at least one item"); return; }
    toast.success(`${selectedAssign.length} ${assignType}${selectedAssign.length > 1 ? "s" : ""} assigned to ${member.name}`);
    setShowAssign(false);
    setSelectedAssign([]);
    setAssignSearch("");
  };

  const handleShareConfirm = () => {
    if (selectedDocs.length === 0) { toast.error("Select at least one document"); return; }
    toast.success(`${selectedDocs.length} document${selectedDocs.length > 1 ? "s" : ""} shared with ${member.name}`);
    setShowShareDoc(false);
    setSelectedDocs([]);
    setDocSearch("");
  };

  const assignItems = assignType === "project"
    ? projects.filter(p => p.status !== "completed" && (!assignSearch || p.name.toLowerCase().includes(assignSearch.toLowerCase())))
    : tasks.filter(t => t.status !== "completed" && (!assignSearch || t.title.toLowerCase().includes(assignSearch.toLowerCase())));

  const docList = [
    { id: "1", name: "Service Agreement.pdf" },
    { id: "2", name: "NDA Template.docx" },
    { id: "3", name: "Q1 Budget.xlsx" },
    { id: "4", name: "Employee Handbook.pdf" },
    { id: "5", name: "wireframes-v3.fig" },
    { id: "6", name: "api-spec.yaml" },
    { id: "7", name: "brand-guidelines.pdf" },
  ].filter(d => !docSearch || d.name.toLowerCase().includes(docSearch.toLowerCase()));

  // Reset sub-views when modal closes
  const handleOpenChange = (o: boolean) => {
    if (!o) {
      setShowComposer(false);
      setShowAssign(false);
      setShowShareDoc(false);
    }
    onOpenChange(o);
  };

  // Sub-view: Assign
  if (showAssign) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-sm p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">Assign to {member.name.split(" ")[0]}</h3>
              <button onClick={() => setShowAssign(false)} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant={assignType === "project" ? "default" : "outline"} onClick={() => { setAssignType("project"); setSelectedAssign([]); }} className="text-xs h-7">
                <FolderKanban size={12} className="mr-1" /> Projects
              </Button>
              <Button size="sm" variant={assignType === "task" ? "default" : "outline"} onClick={() => { setAssignType("task"); setSelectedAssign([]); }} className="text-xs h-7">
                <CheckSquare size={12} className="mr-1" /> Tasks
              </Button>
            </div>
          </div>
          <div className="px-5 py-3">
            <div className="relative mb-3">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={assignSearch} onChange={e => setAssignSearch(e.target.value)} placeholder="Search..." className="w-full h-8 pl-8 pr-3 text-xs bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="max-h-[200px] overflow-y-auto space-y-0.5">
              {assignItems.map((item: any) => {
                const id = item.id;
                const name = item.name || item.title;
                const sel = selectedAssign.includes(id);
                return (
                  <button key={id} onClick={() => setSelectedAssign(prev => sel ? prev.filter(x => x !== id) : [...prev, id])} className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors ${sel ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"}`}>
                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] ${sel ? "bg-primary border-primary text-primary-foreground" : "border-border"}`}>{sel && "✓"}</span>
                    <span className="truncate">{name}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex justify-between px-5 py-3 border-t border-border">
            <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setShowAssign(false)}>Cancel</Button>
            <Button size="sm" className="text-xs h-7" onClick={handleAssignConfirm}>Assign {selectedAssign.length > 0 && `(${selectedAssign.length})`}</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Sub-view: Share Doc
  if (showShareDoc) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-sm p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">Share with {member.name.split(" ")[0]}</h3>
              <button onClick={() => setShowShareDoc(false)} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
            </div>
          </div>
          <div className="px-5 py-3">
            <div className="relative mb-3">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={docSearch} onChange={e => setDocSearch(e.target.value)} placeholder="Search documents..." className="w-full h-8 pl-8 pr-3 text-xs bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="max-h-[200px] overflow-y-auto space-y-0.5">
              {docList.map(d => {
                const sel = selectedDocs.includes(d.id);
                return (
                  <button key={d.id} onClick={() => setSelectedDocs(prev => sel ? prev.filter(x => x !== d.id) : [...prev, d.id])} className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors ${sel ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"}`}>
                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] ${sel ? "bg-primary border-primary text-primary-foreground" : "border-border"}`}>{sel && "✓"}</span>
                    <span className="truncate">{d.name}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={() => { handleOpenChange(false); navigate("/files?upload=1"); }} className="w-full flex items-center gap-2 mt-3 px-2.5 py-2 rounded-lg text-xs text-primary hover:bg-primary/5 transition-colors">
              <Upload size={12} /> Upload new document
            </button>
          </div>
          <div className="flex justify-between px-5 py-3 border-t border-border">
            <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setShowShareDoc(false)}>Cancel</Button>
            <Button size="sm" className="text-xs h-7" onClick={handleShareConfirm}>Share {selectedDocs.length > 0 && `(${selectedDocs.length})`}</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="h-20 gradient-brand relative">
          <div className="absolute -bottom-8 left-6">
            {member.avatar ? (
              <img src={member.avatar} alt={member.name} className="w-16 h-16 rounded-full border-4 border-card object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full border-4 border-card bg-primary/10 text-primary flex items-center justify-center text-lg font-semibold">
                {initials}
              </div>
            )}
            <div className={`absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border-2 border-card ${statusColors[member.status] || "bg-muted-foreground"}`} />
          </div>
        </div>

        <div className="px-6 pt-12 pb-6">
          {/* Info */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">{member.name}</h3>
            <p className="text-sm text-muted-foreground">Team Member · {member.department}</p>
            <span className={`inline-flex items-center gap-1.5 mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${member.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusColors[member.status]}`} />
              {member.status === "active" ? "Active" : "Offline"}
            </span>
          </div>

          {/* Contact */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Mail size={14} /> <span>{member.email}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Phone size={14} /> <span>+1 (555) {String(parseInt(member.id) * 111).padStart(3, "0")}-{String(parseInt(member.id) * 222).padStart(4, "0").slice(0, 4)}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                <FolderKanban size={13} /> <span className="text-[11px] font-medium">Projects</span>
              </div>
              <span className="text-lg font-semibold text-foreground tabular-nums">{assignedProjects}</span>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                <CheckSquare size={13} /> <span className="text-[11px] font-medium">Tasks</span>
              </div>
              <span className="text-lg font-semibold text-foreground tabular-nums">{assignedTasks}</span>
            </div>
          </div>

          {/* Inline Message Composer */}
          {showComposer && (
            <div className="mb-4 p-3 bg-muted/30 rounded-xl border border-border animate-fade-in">
              <textarea
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                placeholder={`Message ${member.name.split(" ")[0]}...`}
                rows={3}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none mb-2"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => { setShowComposer(false); setMessageText(""); }}>Cancel</Button>
                <Button size="sm" className="text-xs h-7 gap-1" onClick={handleSendMessage}><Send size={11} /> Send</Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => { handleOpenChange(false); navigate(`/team/${member.id}`); }}>
              <User size={13} /> View Profile
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setShowComposer(!showComposer)}>
              <MessageSquare size={13} /> Message
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setShowAssign(true)}>
              <CheckSquare size={13} /> Assign
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setShowShareDoc(true)}>
              <Share2 size={13} /> Share Doc
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeamMemberModal;
