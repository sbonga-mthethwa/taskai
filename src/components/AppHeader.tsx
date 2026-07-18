import { useState, useRef, useEffect } from "react";
import { Search, Bell, Plus, ChevronDown, User, Settings, LogOut, ArrowLeftRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import GlobalSearchDropdown from "@/components/GlobalSearchDropdown";
import { useAuth } from "@/contexts/AuthContext";

const AppHeader = () => {
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isImpersonating = !!localStorage.getItem("taskai_impersonating");

  const stopImpersonating = () => {
    const original = localStorage.getItem("taskai_impersonating");
    if (original) {
      localStorage.setItem("taskai_user", original);
      localStorage.removeItem("taskai_impersonating");
      window.location.reload();
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setAvatarOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = user?.name?.split(" ").map(n => n[0]).join("") || "?";
  const showDropdown = searchFocused && searchQuery.trim().length > 0;

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-card/80 backdrop-blur-md sticky top-0 z-50 border-b border-border">
      {isImpersonating && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-warning" />
      )}

      <div className="flex items-center gap-3">
        <span onClick={() => navigate("/dashboard")} className="text-base font-semibold tracking-tight-custom text-foreground cursor-pointer hover:opacity-80 transition-opacity">Taskai</span>
        <button className="hidden md:flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted">
          Acme Corp
          <ChevronDown size={14} />
        </button>
        {isImpersonating && (
          <button
            onClick={stopImpersonating}
            className="flex items-center gap-1.5 text-xs font-medium text-warning bg-warning/10 border border-warning/20 px-2.5 py-1 rounded-md hover:bg-warning/20 transition-colors"
          >
            <ArrowLeftRight size={12} />
            Viewing as {user?.name} — Switch back
          </button>
        )}
      </div>
      <div className="hidden md:block flex-1 max-w-md mx-8">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search projects, tasks, documents..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            className="w-full h-9 pl-9 pr-10 text-sm bg-muted/50 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-muted-foreground/60"
          />
          {searchQuery ? (
            <button
              onMouseDown={e => { e.preventDefault(); setSearchQuery(""); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>
          ) : (
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground bg-card border border-border px-1.5 py-0.5 rounded">⌘K</kbd>
          )}
          {showDropdown && (
            <GlobalSearchDropdown
              query={searchQuery}
              onClose={() => { setSearchFocused(false); setSearchQuery(""); }}
            />
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="w-9 h-9 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 hover:scale-105 relative">
          <Bell size={18} strokeWidth={1.8} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full animate-pulse" />
        </button>
        <Button size="sm" className="h-9 gap-1.5 text-sm font-medium hover:scale-105 transition-transform">
          <Plus size={16} />
          <span className="hidden sm:inline">New</span>
        </Button>
        <ThemeToggle />
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setAvatarOpen(!avatarOpen)}
            className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold ml-1 hover:scale-105 transition-transform cursor-pointer"
          >
            {initials}
          </button>
          {avatarOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-popover border border-border rounded-lg shadow-lg py-1 animate-fade-in z-50">
            <div className="px-3 py-2 border-b border-border mb-1">
                <p className="text-sm font-medium text-foreground">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <button
                onClick={() => { navigate("/profile"); setAvatarOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <User size={15} /> Profile
              </button>
              <button
                onClick={() => { navigate("/settings"); setAvatarOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Settings size={15} /> Settings
              </button>
              <div className="border-t border-border my-1" />
              <button
                onClick={() => { logout(); navigate("/login"); setAvatarOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-danger hover:bg-muted transition-colors"
              >
                <LogOut size={15} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
