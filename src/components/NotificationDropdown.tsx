import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, FileText, FolderKanban, MessageSquare, CheckSquare, UserPlus, Loader2 } from "lucide-react";
import { fetchNotifications, markNotificationRead, markAllNotificationsRead, AppNotification } from "@/services/notificationApi";
import InvitesSection from "@/components/InvitesSection";

type Tab = "all" | "invites";

const iconMap: Record<string, React.ElementType> = {
  chat: MessageSquare,
  task: CheckSquare,
  project: FolderKanban,
  document: FileText,
  invite: UserPlus,
};

const NotificationDropdown = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const loadNotifications = useCallback(async () => {
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  }, []);

  // Load on mount, poll every 30s, and listen for external updates
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    const onUpdated = () => loadNotifications();
    window.addEventListener("notifications-updated", onUpdated);
    return () => {
      clearInterval(interval);
      window.removeEventListener("notifications-updated", onUpdated);
    };
  }, [loadNotifications]);

  // Refresh when dropdown opens
  useEffect(() => {
    if (open) loadNotifications();
  }, [open, loadNotifications]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {
      // Fallback to local-only
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
    window.dispatchEvent(new CustomEvent("notifications-updated"));
  };

  const handleNotificationClick = async (n: AppNotification) => {
    // Mark as read
    if (!n.read) {
      try {
        await markNotificationRead(n.id);
      } catch { /* ignore */ }
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
    }

    // Navigate to relevant chat
    if (n.contextType && n.contextId) {
      navigate(`/chats/${n.contextType}/${n.contextId}`);
      setOpen(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString("en-ZA");
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="hover:opacity-100 transition-colors duration-200 hover:scale-105 relative"
        style={{ color: "rgba(255,255,255,0.92)" }}
      >
        <Bell size={17} strokeWidth={1.8} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-[7px] h-[7px] bg-destructive rounded-full animate-pulse" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 rounded-lg z-50 animate-fade-in bg-card border border-border shadow-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <h3 className="text-[13px] font-semibold text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-semibold bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && activeTab === "all" && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                >
                  <Check size={12} />
                  Mark all read
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setActiveTab("all")}
                className={`flex-1 px-3 py-2 text-[11px] font-medium transition-colors border-b-2 -mb-px ${activeTab === "all" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab("invites")}
                className={`flex-1 px-3 py-2 text-[11px] font-medium transition-colors border-b-2 -mb-px flex items-center justify-center gap-1 ${activeTab === "invites" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                <UserPlus size={11} /> Invites
              </button>
            </div>

            {/* Content */}
            <div className="max-h-[340px] overflow-y-auto">
              {activeTab === "all" && notifications.length === 0 && !loading && (
                <div className="text-center py-8">
                  <Bell size={24} className="mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                </div>
              )}

              {activeTab === "all" && notifications.map((n) => {
                const Icon = iconMap[n.type] || MessageSquare;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                      !n.read ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className={`mt-0.5 w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                      !n.read ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[12px] font-medium ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>
                        {n.title}
                      </p>
                      {n.senderName && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          {n.senderName}{n.contextName ? ` · ${n.contextName}` : ""}
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground truncate">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">{formatTime(n.createdAt)}</p>
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    )}
                  </button>
                );
              })}

              {activeTab === "invites" && (
                <div className="p-3">
                  <InvitesSection compact />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-4 py-2.5">
              <button
                onClick={() => { setOpen(false); navigate("/notifications"); }}
                className="w-full text-[12px] font-medium text-primary hover:text-primary/80 transition-colors text-center"
              >
                View all notifications
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationDropdown;
