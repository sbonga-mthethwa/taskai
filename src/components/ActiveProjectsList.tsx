import { useNavigate } from "react-router-dom";
import { useData } from "@/contexts/DataContext";
import StatusBadge from "@/components/StatusBadge";
import AvatarStack from "@/components/AvatarStack";

const ActiveProjectsList = () => {
  const navigate = useNavigate();
  const { projects } = useData();
  const activeProjects = projects.filter((p) => p.status === "in-progress" || p.status === "no-progress");

  return (
    <div className="bg-card rounded-lg card-shadow">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Active Projects</h2>
        <button
          onClick={() => navigate("/projects")}
          className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
        >
          View all
        </button>
      </div>
      <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
        {activeProjects.map((p) => {
          const progress = Math.round((p.tasksCompleted / p.tasksTotal) * 100);
          return (
            <button
              key={p.id}
              onClick={() => navigate(`/projects/${p.id}`)}
              className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors text-left group"
            >
              <span className="text-lg">{p.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {p.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 max-w-[120px] h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {p.tasksCompleted}/{p.tasksTotal}
                  </span>
                </div>
              </div>
              <AvatarStack initials={p.team} max={3} />
              <StatusBadge status={p.status} />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ActiveProjectsList;
