import { useState, useRef, useEffect } from "react";
import { Plus, X, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Task } from "@/types";

interface ProjectOption {
  id: string;
  name: string;
}

interface InlineTaskCreateProps {
  status: Task["status"];
  onSubmit: (title: string, status: Task["status"], projectId?: string, projectName?: string) => void;
  /** If set, tasks are auto-assigned to this project (no dropdown shown) */
  currentProjectId?: string;
  currentProjectName?: string;
  /** Available projects for the dropdown */
  projects?: ProjectOption[];
}

const InlineTaskCreate = ({
  status,
  onSubmit,
  currentProjectId,
  currentProjectName,
  projects = [],
}: InlineTaskCreateProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(currentProjectId || "");
  const [selectedProjectName, setSelectedProjectName] = useState(currentProjectName || "");
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const needsProjectSelector = !currentProjectId;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowProjectDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(projectSearch.toLowerCase())
  );

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;

    const projId = currentProjectId || selectedProjectId;
    const projName = currentProjectName || selectedProjectName;

    if (!projId) {
      // Flash the project selector to draw attention
      setShowProjectDropdown(true);
      return;
    }

    onSubmit(trimmed, status, projId, projName);
    setTitle("");
    if (!currentProjectId) {
      setSelectedProjectId("");
      setSelectedProjectName("");
    }
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      setTitle("");
      setIsOpen(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setSelectedProjectId(currentProjectId || "");
    setSelectedProjectName(currentProjectName || "");
    setIsOpen(false);
    setShowProjectDropdown(false);
    setProjectSearch("");
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center gap-1.5 py-2 px-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
      >
        <Plus size={14} />
        Add task
      </button>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-3 space-y-2 shadow-sm">
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Task title..."
        className="w-full text-sm bg-transparent border-none focus:outline-none placeholder:text-muted-foreground/50 text-foreground"
        autoFocus
      />

      {needsProjectSelector && (
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowProjectDropdown(!showProjectDropdown)}
            className={`w-full flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
              selectedProjectId
                ? "border-border bg-muted/30 text-foreground"
                : "border-destructive/50 bg-destructive/5 text-destructive"
            }`}
          >
            <span className="truncate">
              {selectedProjectName || "Select project (required)"}
            </span>
            <ChevronDown size={12} className="shrink-0 ml-1" />
          </button>

          {showProjectDropdown && (
            <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
              <div className="p-1.5 border-b border-border">
                <div className="relative">
                  <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={projectSearch}
                    onChange={e => setProjectSearch(e.target.value)}
                    placeholder="Search projects..."
                    className="w-full text-xs pl-6 pr-2 py-1 bg-transparent border-none focus:outline-none placeholder:text-muted-foreground/50"
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-32 overflow-y-auto">
                {filteredProjects.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-2 text-center">No projects found</p>
                ) : (
                  filteredProjects.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedProjectId(p.id);
                        setSelectedProjectName(p.name);
                        setShowProjectDropdown(false);
                        setProjectSearch("");
                      }}
                      className={`w-full text-left text-xs px-2.5 py-1.5 hover:bg-muted/50 transition-colors ${
                        selectedProjectId === p.id ? "bg-primary/10 text-primary font-medium" : "text-foreground"
                      }`}
                    >
                      {p.name}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={handleClose}
        >
          <X size={12} />
        </Button>
        <Button
          size="sm"
          className="h-7 px-3 text-xs"
          onClick={handleSubmit}
          disabled={!title.trim()}
        >
          Add
        </Button>
      </div>
    </div>
  );
};

export default InlineTaskCreate;
