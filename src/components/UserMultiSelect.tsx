import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useData } from "@/contexts/DataContext";

interface UserMultiSelectProps {
  selected: string[];
  onChange: (ids: string[]) => void;
  label?: string;
}

const UserMultiSelect = ({ selected, onChange, label = "Assign Users" }: UserMultiSelectProps) => {
  const { users: teamMembers } = useData();
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

  const filtered = teamMembers.filter(m =>
    !search || m.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter(i => i !== id) : [...selected, id]);
  };

  const selectedMembers = teamMembers.filter(m => selected.includes(m.id));

  return (
    <div ref={ref} className="relative">
      <label className="text-sm font-medium text-foreground block mb-1">{label}</label>
      <div
        onClick={() => setOpen(!open)}
        className="min-h-[36px] w-full px-3 py-1.5 text-sm bg-background border border-border rounded-md cursor-pointer flex items-center gap-1.5 flex-wrap focus-within:ring-2 focus-within:ring-primary/20"
      >
        {selectedMembers.length === 0 && (
          <span className="text-muted-foreground/60">Select team members...</span>
        )}
        {selectedMembers.map(m => (
          <span
            key={m.id}
            className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full"
          >
            {m.avatar ? (
              <img src={m.avatar} alt="" className="w-4 h-4 rounded-full" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[7px] font-bold">
                {m.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
            )}
            {m.name.split(" ")[0]}
            <button
              onClick={e => { e.stopPropagation(); toggle(m.id); }}
              className="hover:text-destructive"
            >
              <X size={10} />
            </button>
          </span>
        ))}
      </div>

      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                autoFocus
                className="w-full h-8 pl-7 pr-3 text-sm bg-muted/50 border-none rounded-md focus:outline-none placeholder:text-muted-foreground/50"
              />
            </div>
          </div>
          <div className="max-h-[180px] overflow-y-auto py-1">
            {filtered.map(m => {
              const isSelected = selected.includes(m.id);
              return (
                <button
                  key={m.id}
                  onClick={() => toggle(m.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                    isSelected ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  {m.avatar ? (
                    <img src={m.avatar} alt="" className="w-6 h-6 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold">
                      {m.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                  )}
                  <span className="flex-1 text-left truncate">{m.name}</span>
                  {isSelected && <span className="text-primary text-xs font-bold">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMultiSelect;
