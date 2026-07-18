import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, FileText, FolderKanban, MessageSquare, CheckSquare, UserPlus, Loader2 } from "lucide-react";
import { fetchNotifications, markNotificationRead, markAllNotificationsRead, AppNotification } from "@/services/notificationApi";
import { Button } from "@/components/ui/button";

const iconMap: Record<string, React.ElementType> = {
  chat: MessageSquare,
  task: CheckSquare,
  project: FolderKanban,
  document: FileText,
  invite: UserPlus,
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("unread");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const displayed = filter === "unread" ? notifications.filter(n => !n.read) : notifications;

  const handleMarkAllRead = async () => {
    try { await markAllNotificationsRead(); } catch { /* ignore */ }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClick = async (n: AppNotification) => {
    if (!n.read) {
      try { await markNotificationRead(n.id); } catch { /* ignore */ }
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
    }
    if (n.contextType && n.contextId) {
      navigate(`/chats/${n.contextType}/${n.contextId}`);
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
    <div className="p-6 max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleMarkAllRead}>
            <Check size={13} /> Mark all read
          </Button>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        {(["unread", "all"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "unread" ? `Unread (${unreadCount})` : "All"}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && displayed.length === 0 && (
        <div className="text-center py-16 bg-card rounded-lg card-shadow">
          <Bell size={32} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            {filter === "unread" ? "No unread notifications" : "No notifications yet"}
          </p>
        </div>
      )}

      {!loading && displayed.length > 0 && (
        <div className="bg-card rounded-lg card-shadow overflow-hidden divide-y divide-border">
          {displayed.map(n => {
            const Icon = iconMap[n.type] || MessageSquare;
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full flex items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/50 ${
                  !n.read ? "bg-primary/5" : ""
                }`}
              >
                <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  !n.read ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>
                    {n.title}
                  </p>
                  {n.senderName && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {n.senderName}{n.contextName ? ` · ${n.contextName}` : ""}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-1">{formatTime(n.createdAt)}</p>
                </div>
                {!n.read && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary mt-2 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
