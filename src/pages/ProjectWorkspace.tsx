import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PriorityIndicator from "@/components/PriorityIndicator";
import AvatarStack from "@/components/AvatarStack";
import StatusBadge from "@/components/StatusBadge";
import { useData } from "@/contexts/DataContext";
import { Task } from "@/types";
import { Plus, ArrowLeft, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

const columns = [
  { id: "backlog", label: "Backlog" },
  { id: "todo", label: "To Do" },
  { id: "in-progress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
];

const ProjectWorkspace = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, tasks } = useData();
  const [activeTab, setActiveTab] = useState("Tasks");
  const pageTabs = ["Overview", "Tasks", "Chat", "Files", "Team", "Activity"];

  const project = projects.find((p) => p.id === id) || projects[0];
  const projectTasks = project ? tasks.filter((t) => t.project === project.name) : [];

  const getColumnTasks = (status: string): Task[] =>
    projectTasks.filter((t) => t.status === status);

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6">
        <button
          onClick={() => navigate("/projects")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft size={14} />
          Back to Projects
        </button>
        <div className="flex items-center gap-3">
          <span className="text-lg">{project.icon}</span>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold tracking-tight-custom text-foreground">
              {project.name}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <StatusBadge status={project.status} />
              <AvatarStack initials={project.team} max={4} />
              <span className="text-xs text-muted-foreground tabular-nums">
                {project.tasksCompleted}/{project.tasksTotal} tasks
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6 border-b border-border">
        {pageTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card rounded-lg card-shadow p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Progress</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all"
                  style={{ width: `${(project.tasksCompleted / project.tasksTotal) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-foreground tabular-nums">
                {Math.round((project.tasksCompleted / project.tasksTotal) * 100)}%
              </span>
            </div>
          </div>
          <div className="bg-card rounded-lg card-shadow p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Team</h3>
            <AvatarStack initials={project.team} max={6} />
          </div>
        </div>
      )}

      {activeTab === "Tasks" && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => {
            const colTasks = getColumnTasks(col.id);
            return (
              <div key={col.id} className="w-[280px] flex-shrink-0">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{col.label}</span>
                    <span className="text-[11px] text-muted-foreground tabular-nums bg-muted px-1.5 py-0.5 rounded-full">
                      {colTasks.length}
                    </span>
                  </div>
                  <button className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <Plus size={14} />
                  </button>
                </div>
                <div className="space-y-2.5">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-card p-3.5 rounded-[10px] card-shadow hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-start gap-2">
                        <PriorityIndicator priority={task.priority} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground leading-snug">
                            {task.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {task.project}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-semibold">
                          {task.assignee}
                        </div>
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          {task.dueDate}
                        </span>
                      </div>
                    </div>
                  ))}
                  {colTasks.length === 0 && (
                    <div className="border-2 border-dashed border-border rounded-[10px] p-6 text-center">
                      <p className="text-xs text-muted-foreground">No tasks</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "Chat" && project && (
        <div className="bg-card rounded-lg card-shadow p-5 text-center">
          <MessageSquare size={24} className="mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            Open the project chat to collaborate with your team.
          </p>
          <Button size="sm" className="gap-1.5" onClick={() => navigate(`/chats/project/${project.id}`)}>
            <MessageSquare size={14} /> Open Chat
          </Button>
        </div>
      )}

      {(activeTab === "Files" || activeTab === "Team" || activeTab === "Activity") && (
        <div className="bg-card rounded-lg card-shadow p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {activeTab} view coming soon
          </p>
        </div>
      )}
    </div>
  );
};

export default ProjectWorkspace;
