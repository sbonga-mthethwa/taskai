import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Search, Settings, User, LogOut, MessageSquare,
  Home, FolderKanban, FileText, BarChart3, CheckSquare, Users,
} from "lucide-react";
import NotificationDropdown from "@/components/NotificationDropdown";
import GlobalSearchDropdown from "@/components/GlobalSearchDropdown";
import { useAuth } from "@/contexts/AuthContext";
import { fetchNotifications, AppNotification } from "@/services/notificationApi";

const pageTitles: Record<string, { label: string; icon: React.ElementType }> = {
  "/": { label: "Home", icon: Home },
  "/projects": { label: "Projects", icon: FolderKanban },
  "/tasks": { label: "Tasks", icon: CheckSquare },
  "/files": { label: "Documents", icon: FileText },
  
  "/settings": { label: "Settings", icon: Settings },
  "/admin/users": { label: "Team Members", icon: Users },
  "/team": { label: "Team Members", icon: Users },
};

const MainTopbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const initials = user?.name?.split(" ").map(n => n[0]).join("") || "?";
  const avatarUrl = user?.avatarUrl || "";

  const currentPage = Object.entries(pageTitles).find(([path]) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  });

  const showDropdown = searchFocused && searchQuery.trim().length > 0;

  // Poll for unread chat notifications to show badge
  const checkUnread = useCallback(async () => {
    try {
      const notifs = await fetchNotifications();
      const chatUnread = notifs.filter(
        (n: AppNotification) => !n.read && (n.type === "chat" || n.type === "chat_message" || n.type === "message"),
      ).length;
      setUnreadMsgCount(chatUnread);
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    checkUnread();
    const interval = setInterval(checkUnread, 30000);
    const onUpdated = () => checkUnread();
    window.addEventListener("notifications-updated", onUpdated);
    return () => {
      clearInterval(interval);
      window.removeEventListener("notifications-updated", onUpdated);
    };
  }, [checkUnread]);

  return (
    <nav
      className="h-16 flex items-center justify-between px-6 relative z-40 border-b border-transparent navbar-gradient"
    >
      {/* LEFT — Taskai Logo */}
      <div className="flex items-center gap-2">
        <img
          src="/logo.png"
          alt="TaskAI"
          onClick={() => navigate("/dashboard")}
          className="h-20 md:h-35 w-auto cursor-pointer hover:opacity-90 transition-opacity"
        />
      </div>

      {/* CENTER — Search */}
      <div className="hidden sm:block flex-1 max-w-[400px] mx-6" ref={searchContainerRef}>
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.45)" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search tasks, projects, files, or team members..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            className="w-full h-9 pl-9 pr-20 text-[13px] rounded-[10px] transition-all duration-200 outline-none placeholder:text-white/40"
            style={{
              background: "rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.95)",
              border: `1px solid ${searchFocused ? "#6D5EF8" : "rgba(255,255,255,0.15)"}`,
              boxShadow: searchFocused ? "0 0 0 3px rgba(109,94,248,0.15)" : "none",
            }}
          />
          {!searchQuery && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-white/25 pointer-events-none hidden md:inline">
              {navigator.platform?.includes("Mac") ? "⌘K" : "Ctrl+K"}
            </span>
          )}
          {searchQuery && (
            <button
              onMouseDown={e => { e.preventDefault(); setSearchQuery(""); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
            >
              ✕
            </button>
          )}
          {showDropdown && (
            <GlobalSearchDropdown
              query={searchQuery}
              onClose={() => { setSearchFocused(false); setSearchQuery(""); }}
            />
          )}
        </div>
      </div>

      {/* RIGHT — Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Messages icon — navigates to Messages page */}
        <button
          onClick={() => navigate("/chats")}
          className="relative hidden sm:block hover:opacity-100 transition-all duration-180 hover:scale-105"
          style={{ color: "rgba(255,255,255,0.92)" }}
        >
          <MessageSquare size={17} strokeWidth={1.8} />
          {unreadMsgCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center leading-none">
              {unreadMsgCount > 9 ? "9+" : unreadMsgCount}
            </span>
          )}
        </button>

        <button
          onClick={() => navigate("/settings")}
          className="hidden sm:block hover:opacity-100 transition-all duration-180 hover:scale-105"
          style={{ color: "rgba(255,255,255,0.92)" }}
        >
          <Settings size={17} strokeWidth={1.8} />
        </button>

        <NotificationDropdown />

        {/* Avatar + Dropdown */}
        <div className="relative">
          <button
            onClick={() => setAvatarOpen(!avatarOpen)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold cursor-pointer hover:scale-105 transition-transform overflow-hidden"
            style={{
              background: avatarUrl ? "transparent" : "rgba(109,94,248,0.3)",
              color: "rgba(255,255,255,0.9)",
              border: `1px solid ${avatarUrl ? "rgba(255,255,255,0.2)" : "rgba(109,94,248,0.4)"}`,
            }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={user?.name || ""} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </button>
          {avatarOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setAvatarOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-52 rounded-lg py-1 z-50 animate-fade-in bg-card border border-border shadow-lg">
                <div className="px-3 py-2.5 border-b border-border mb-1">
                  <p className="text-[13px] font-medium text-foreground">{user?.name}</p>
                  <p className="text-[11px] text-muted-foreground">{user?.email}</p>
                </div>
                <button
                  onClick={() => { navigate("/profile"); setAvatarOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <User size={14} /> Profile
                </button>
                <button
                  onClick={() => { navigate("/settings"); setAvatarOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Settings size={14} /> Settings
                </button>
                <div className="border-t border-border my-1" />
                <button
                  onClick={() => { logout(); navigate("/login"); setAvatarOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-destructive hover:bg-muted transition-colors"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default MainTopbar;
