import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Plus, Home, FolderKanban, CheckSquare,
  FileText, User, Users,
  Upload, X, Settings
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

const NavigationRail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const permissions = usePermissions();
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const topItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: FolderKanban, label: "Projects", path: "/projects" },
    { icon: CheckSquare, label: "Tasks", path: "/tasks" },
    { icon: FileText, label: "Documents", path: "/files" },
    { icon: Users, label: "Team", path: "/team" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const createOptions = [
    { icon: FolderKanban, label: "New Project", action: () => { navigate("/projects?new=1"); setShowCreateMenu(false); } },
    { icon: CheckSquare, label: "New Task", action: () => { navigate("/tasks?new=1"); setShowCreateMenu(false); } },
    { icon: Upload, label: "Upload Document", action: () => { navigate("/files?upload=1"); setShowCreateMenu(false); } },
  ];

  return (
    <nav className="hidden md:flex w-[72px] flex-col items-center py-4 bg-background border-r border-border shrink-0">
      <div className="flex flex-col items-center gap-1 flex-1">
        {/* Create button */}
        <div className="relative mb-2">
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setShowCreateMenu(!showCreateMenu)}
                className="w-10 h-10 rounded-md flex items-center justify-center bg-primary text-primary-foreground hover:opacity-90 active:scale-95 transition-all duration-200"
              >
                <Plus size={20} strokeWidth={2} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">Create</TooltipContent>
          </Tooltip>

          {showCreateMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowCreateMenu(false)} />
              <div className="fixed left-[80px] top-[16px] w-48 rounded-lg py-1 z-50 animate-fade-in bg-card border border-border shadow-lg">
                <div className="px-3 py-2 border-b border-border mb-1">
                  <p className="text-[12px] font-semibold text-foreground">Create New</p>
                </div>
                {createOptions.map(opt => (
                  <button
                    key={opt.label}
                    onClick={opt.action}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <opt.icon size={14} /> {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {topItems.map((item) => {
          const isActive = item.path && location.pathname === item.path;
          return (
            <Tooltip key={item.label} delayDuration={300}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => item.path && navigate(item.path)}
                  className={`w-10 h-10 rounded-md flex items-center justify-center transition-all duration-200 ${
                    isActive
                      ? "bg-card card-shadow text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">{item.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
      <div className="flex flex-col items-center gap-1 pb-2">
        <ThemeToggle />
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <button
              onClick={() => navigate("/profile")}
              className="w-10 h-10 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <User size={20} strokeWidth={1.8} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">Profile</TooltipContent>
        </Tooltip>
      </div>
    </nav>
  );
};

export default NavigationRail;
