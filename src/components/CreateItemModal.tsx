import { useState, useMemo, useRef, useEffect } from "react";
import { X, Search, ChevronDown, Mail, Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import UserMultiSelect from "@/components/UserMultiSelect";
import { useData } from "@/contexts/DataContext";
import { toast } from "sonner";

type ItemType = "task" | "project";

interface CreateItemModalProps {
  type: ItemType;
  open: boolean;
  onClose: () => void;
  onCreate: (data: CreateItemData) => void;
  defaultDate?: string;
}

export interface CreateItemData {
  name: string;
  description: string;
  assignedUsers: string[];
  status: string;
  color: string;
  dueDate: string;
  priority?: string;
  projectId?: string;
  projectName?: string;
  inviteEmails?: string[];
}

const COLOR_SWATCHES = [
  { value: "#6D5EF8", label: "Purple" },
  { value: "#FF4D8D", label: "Pink" },
  { value: "#3B82F6", label: "Blue" },
  { value: "#10B981", label: "Green" },
  { value: "#F59E0B", label: "Amber" },
  { value: "#EF4444", label: "Red" },
  { value: "#8B5CF6", label: "Violet" },
  { value: "#06B6D4", label: "Cyan" },
];

const STATUS_OPTIONS = [
  { value: "no-progress", label: "No Progress" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

const ProjectSearchDropdown = ({ value, onChange }: { value: string; onChange: (id: string, name: string) => void }) => {
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

  const selectedProject = allProjects.find(p => p.id === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-10 px-3 text-sm bg-background border border-border rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all flex items-center justify-between text-left"
      >
        <span className={selectedProject ? "text-foreground" : "text-muted-foreground/50"}>
          {selectedProject ? `${selectedProject.icon} ${selectedProject.name}` : "Select a project..."}
        </span>
        <ChevronDown size={14} className="text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search projects..."
                className="w-full h-8 pl-8 pr-3 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground text-center">No projects found</div>
            )}
            {filtered.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onChange(p.id, p.name);
                  setOpen(false);
                  setSearch("");
                }}
                className={`w-full px-3 py-2 text-sm text-left hover:bg-muted/60 transition-colors flex items-center gap-2 ${value === p.id ? "bg-primary/5 text-primary font-medium" : "text-foreground"}`}
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

const CreateItemModal = ({ type, open, onClose, onCreate, defaultDate }: CreateItemModalProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [assignedUsers, setAssignedUsers] = useState<string[]>([]);
  const [status, setStatus] = useState("no-progress");
  const [color, setColor] = useState("#6D5EF8");
  const [dueDate, setDueDate] = useState(defaultDate || "");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [projectId, setProjectId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [inviteInput, setInviteInput] = useState("");

  if (!open) return null;

  const isTask = type === "task";

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleAddInviteEmail = () => {
    const email = inviteInput.trim().toLowerCase();
    if (!email) return;
    if (!isValidEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (inviteEmails.includes(email)) {
      toast.error("This email has already been added");
      return;
    }
    setInviteEmails([...inviteEmails, email]);
    setInviteInput("");
  };

  const handleRemoveInviteEmail = (email: string) => {
    setInviteEmails(inviteEmails.filter(e => e !== email));
  };

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error(`Please enter a ${isTask ? "task" : "project"} name`);
      return;
    }
    if (isTask && !projectId) {
      toast.error("Please select a project");
      return;
    }
    onCreate({ name, description, assignedUsers, status, color, dueDate, priority, projectId, projectName, inviteEmails: inviteEmails.length > 0 ? inviteEmails : undefined });
    setName("");
    setDescription("");
    setAssignedUsers([]);
    setStatus("no-progress");
    setColor("#6D5EF8");
    setDueDate("");
    setPriority("medium");
    setProjectId("");
    setProjectName("");
    setInviteEmails([]);
    setInviteInput("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl card-shadow w-full max-w-[680px] max-h-[90vh] overflow-y-auto mx-4 p-6 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dual Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center justify-between flex-1 mr-4">
            <h2 className="text-xl font-semibold text-foreground">
              {isTask ? "Add Task" : "Add Project"}
            </h2>
            <span className="text-sm font-medium text-muted-foreground">
              {isTask ? "Task Details" : "Project Details"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="h-px bg-border mb-6" />

        {/* Fields */}
        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="text-[13px] font-medium text-foreground block mb-1.5">
              {isTask ? "Task Name" : "Project Name"} <span className="text-destructive">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Enter ${isTask ? "task" : "project"} name`}
              className="w-full h-10 px-3 text-sm bg-background border border-border rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 placeholder:text-muted-foreground/50 transition-all"
            />
          </div>

          {/* Project (tasks only) */}
          {isTask && (
            <div>
              <label className="text-[13px] font-medium text-foreground block mb-1.5">
                Project <span className="text-destructive">*</span>
              </label>
              <ProjectSearchDropdown
                value={projectId}
                onChange={(id, name) => { setProjectId(id); setProjectName(name); }}
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-[13px] font-medium text-foreground block mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`Describe the ${isTask ? "task" : "project"}...`}
              rows={3}
              className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 resize-none placeholder:text-muted-foreground/50 transition-all"
            />
          </div>

          {/* Assign Users */}
          <UserMultiSelect selected={assignedUsers} onChange={setAssignedUsers} />

          {/* Invite External Users (projects only) */}
          {!isTask && (
            <div>
              <label className="text-[13px] font-medium text-foreground block mb-1.5">
                <span className="flex items-center gap-1.5">
                  <UserPlus size={14} />
                  Invite External Users
                </span>
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Invite people who aren't on your team yet. They'll be added to this project once they accept.
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    value={inviteInput}
                    onChange={(e) => setInviteInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddInviteEmail(); } }}
                    placeholder="Enter email address..."
                    className="w-full h-10 pl-9 pr-3 text-sm bg-background border border-border rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 placeholder:text-muted-foreground/50 transition-all"
                  />
                </div>
                <Button type="button" variant="outline" size="sm" className="h-10 px-3" onClick={handleAddInviteEmail}>
                  <Plus size={14} className="mr-1" /> Add
                </Button>
              </div>
              {inviteEmails.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {inviteEmails.map(email => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1 bg-accent text-accent-foreground text-xs font-medium px-2.5 py-1 rounded-full"
                    >
                      <Mail size={10} />
                      {email}
                      <button
                        onClick={() => handleRemoveInviteEmail(email)}
                        className="hover:text-destructive ml-0.5"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Status + Priority row */}
          <div className={`grid gap-4 ${isTask ? "grid-cols-3" : "grid-cols-2"}`}>
            <div>
              <label className="text-[13px] font-medium text-foreground block mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-background border border-border rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none cursor-pointer transition-all"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {isTask && (
              <div>
                <label className="text-[13px] font-medium text-foreground block mb-1.5">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as "high" | "medium" | "low")}
                  className="w-full h-10 px-3 text-sm bg-background border border-border rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none cursor-pointer transition-all"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            )}

            <div>
              <label className="text-[13px] font-medium text-foreground block mb-1.5">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-background border border-border rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer transition-all"
              />
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="text-[13px] font-medium text-foreground block mb-2">Label Color</label>
            <div className="flex items-center gap-2">
              {COLOR_SWATCHES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  title={c.label}
                  className={`w-7 h-7 rounded-full transition-all duration-150 hover:scale-110 ${
                    color === c.value
                      ? "ring-2 ring-offset-2 ring-offset-card ring-primary scale-110"
                      : "hover:ring-1 hover:ring-border"
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-8 pt-5 border-t border-border">
          <Button variant="outline" onClick={onClose} className="px-5">
            Cancel
          </Button>
          <Button onClick={handleCreate} className="px-6" disabled={isTask && !projectId}>
            {isTask ? "Create Task" : "Create Project"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateItemModal;
