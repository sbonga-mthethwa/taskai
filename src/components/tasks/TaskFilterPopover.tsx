import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useData } from "@/contexts/DataContext";

export interface TaskFilters {
  status: string[];
  project: string[];
  assignedUser: string[];
  priority: string[];
}

const EMPTY_FILTERS: TaskFilters = { status: [], project: [], assignedUser: [], priority: [] };

interface TaskFilterPopoverProps {
  filters: TaskFilters;
  onChange: (f: TaskFilters) => void;
}

const STATUS_OPTIONS = [
  { value: "no-progress", label: "No Progress" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

const PRIORITY_OPTIONS = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const toggle = (arr: string[], val: string) =>
  arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];

const TaskFilterPopover = ({ filters, onChange }: TaskFilterPopoverProps) => {
  const { projects: allProjects, users: teamMembers } = useData();
  const [open, setOpen] = useState(false);
  const activeCount = filters.status.length + filters.project.length + filters.assignedUser.length + filters.priority.length;

  const projectNames = [...new Set(allProjects.map(p => p.name))];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground h-8 relative">
          <Filter size={14} /> Filter
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{activeCount}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
          <span className="text-sm font-semibold text-foreground">Filters</span>
          {activeCount > 0 && <button onClick={() => onChange(EMPTY_FILTERS)} className="text-xs text-primary hover:underline">Clear all</button>}
        </div>
        <div className="p-3 space-y-4 max-h-[360px] overflow-y-auto">
          <FilterSection label="Status">
            {STATUS_OPTIONS.map(s => (<Chip key={s.value} label={s.label} active={filters.status.includes(s.value)} onClick={() => onChange({ ...filters, status: toggle(filters.status, s.value) })} />))}
          </FilterSection>
          <FilterSection label="Priority">
            {PRIORITY_OPTIONS.map(p => (<Chip key={p.value} label={p.label} active={filters.priority.includes(p.value)} onClick={() => onChange({ ...filters, priority: toggle(filters.priority, p.value) })} />))}
          </FilterSection>
          <FilterSection label="Project">
            {projectNames.map(name => (<Chip key={name} label={name} active={filters.project.includes(name)} onClick={() => onChange({ ...filters, project: toggle(filters.project, name) })} />))}
          </FilterSection>
          <FilterSection label="Assigned User">
            {teamMembers.map(m => (<Chip key={m.id} label={m.name} active={filters.assignedUser.includes(m.id)} onClick={() => onChange({ ...filters, assignedUser: toggle(filters.assignedUser, m.id) })} />))}
          </FilterSection>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const FilterSection = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">{label}</span>
    <div className="flex flex-wrap gap-1.5">{children}</div>
  </div>
);

const Chip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
    {label}
  </button>
);

export { EMPTY_FILTERS };
export default TaskFilterPopover;
