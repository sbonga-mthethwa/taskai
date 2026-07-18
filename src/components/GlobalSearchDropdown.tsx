import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, CheckSquare, FolderKanban, Users, FileText, Building2 } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { searchAll, ApiSearchResult } from "@/services/api";
import StatusBadge from "@/components/StatusBadge";

interface GlobalSearchResult {
  id: string;
  type: "task" | "project" | "user" | "department" | "document";
  title: string;
  subtitle?: string;
  status?: string;
  avatar?: string;
  route: string;
}

const typeIcons: Record<string, typeof Search> = {
  task: CheckSquare,
  project: FolderKanban,
  user: Users,
  department: Building2,
  document: FileText,
};

const typeLabels: Record<string, string> = {
  task: "Tasks",
  project: "Projects",
  user: "Users",
  department: "Departments",
  document: "Documents",
};

interface GlobalSearchDropdownProps {
  query: string;
  onClose: () => void;
  variant?: "light" | "dark";
}

const GlobalSearchDropdown = ({ query, onClose, variant = "light" }: GlobalSearchDropdownProps) => {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const { tasks, projects, users } = useData();
  const q = query.toLowerCase().trim();
  const [apiResults, setApiResults] = useState<ApiSearchResult[]>([]);
  const [searchedQuery, setSearchedQuery] = useState("");

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Try backend search
  useEffect(() => {
    if (!q) return;
    const timer = setTimeout(() => {
      searchAll(q).then(r => { setApiResults(r); setSearchedQuery(q); }).catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  const results = useMemo<GlobalSearchResult[]>(() => {
    if (!q) return [];

    // If we have API results for this query, use them
    if (apiResults.length > 0 && searchedQuery === q) {
      return apiResults.map(r => ({
        id: r.id,
        type: r.type as any,
        title: r.title,
        subtitle: r.subtitle,
        status: r.status,
        avatar: r.avatar,
        route: r.route || (r.type === "task" ? "/tasks" : r.type === "project" ? "/projects" : r.type === "user" ? `/team/${r.id}` : "/files"),
      })).slice(0, 20);
    }

    // Fallback: client-side search from DataContext
    const out: GlobalSearchResult[] = [];

    tasks.forEach(t => {
      const match = t.title.toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q) ||
        t.project.toLowerCase().includes(q);
      if (match) out.push({ id: t.id, type: "task", title: t.title, subtitle: `${t.project} · ${t.dueDate}`, status: t.status, route: "/tasks" });
    });

    projects.forEach(p => {
      const match = p.name.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q);
      if (match) out.push({ id: p.id, type: "project", title: p.name, subtitle: p.dueDate || p.lastUpdated, status: p.status, route: "/projects" });
    });

    users.forEach(m => {
      const match = m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.department.toLowerCase().includes(q);
      if (match) out.push({ id: m.id, type: "user", title: m.name, subtitle: m.department, avatar: m.avatar, route: `/team/${m.id}` });
    });

    const DEPARTMENTS = [...new Set(users.map(m => m.department))];
    DEPARTMENTS.forEach(d => {
      if (d.toLowerCase().includes(q)) {
        const count = users.filter(m => m.department === d).length;
        out.push({ id: `dept-${d}`, type: "department", title: d, subtitle: `${count} member${count !== 1 ? "s" : ""}`, route: "/team" });
      }
    });

    return out.sort((a, b) => {
      const aTitle = a.title.toLowerCase().indexOf(q);
      const bTitle = b.title.toLowerCase().indexOf(q);
      if (aTitle !== -1 && bTitle === -1) return -1;
      if (aTitle === -1 && bTitle !== -1) return 1;
      return 0;
    }).slice(0, 20);
  }, [q, apiResults, searchedQuery, tasks, projects, users]);

  if (!q) return null;

  const grouped = results.reduce<Record<string, GlobalSearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

  const handleClick = (result: GlobalSearchResult) => {
    navigate(result.route);
    onClose();
  };

  const highlightMatch = (text: string) => {
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return <span>{text}</span>;
    return (
      <span>
        {text.slice(0, idx)}
        <span className="bg-primary/20 text-primary font-semibold rounded-sm px-0.5">{text.slice(idx, idx + q.length)}</span>
        {text.slice(idx + q.length)}
      </span>
    );
  };

  return (
    <div
      ref={ref}
      className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl max-h-[420px] overflow-y-auto z-[100] animate-fade-in"
    >
      {Object.keys(grouped).length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">No results found for "{query}"</p>
        </div>
      ) : (
        Object.entries(grouped).map(([type, items]) => {
          const Icon = typeIcons[type] || Search;
          return (
            <div key={type}>
              <div className="px-3 py-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/30 sticky top-0">
                <Icon size={12} />
                {typeLabels[type] || type}
                <span className="ml-auto text-muted-foreground/60">{items.length}</span>
              </div>
              {items.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleClick(item)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/40 transition-colors"
                >
                  {item.avatar ? (
                    <img src={item.avatar} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                      <Icon size={13} className="text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{highlightMatch(item.title)}</p>
                    {item.subtitle && <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>}
                  </div>
                  {item.status && <StatusBadge status={item.status} />}
                </button>
              ))}
            </div>
          );
        })
      )}
    </div>
  );
};

export default GlobalSearchDropdown;
