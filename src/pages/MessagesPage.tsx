import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Send, ArrowLeft, CheckSquare, FolderKanban, Loader2, MessageSquare, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import {
  markConversationNotificationsRead,
  fetchNotifications,
  type AppNotification,
} from "@/services/notificationApi";
import {
  fetchTaskChat,
  fetchProjectChat,
  sendTaskChatMessage,
  sendProjectChatMessage,
  ChatMessage,
} from "@/services/chatApi";
import { toast } from "sonner";
import { format, isToday, isYesterday } from "date-fns";

type ChatApiMessage = {
  id?: string;
  messageId?: string;
  content?: string;
  message?: string;
  createdAt?: number;
  timeStamp?: number;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string | null;
  type?: string;
};

type ChatApiResponse = {
  success?: boolean;
  conversation?: unknown;
  messages?: ChatApiMessage[];
};

const extractMessages = (data: unknown, contextType: "task" | "project", contextId: string): ChatMessage[] => {
  if (!data) return [];

  let rawMessages: any[] = [];

  if (Array.isArray(data)) {
    rawMessages = data;
  } else if (typeof data === "object" && "messages" in data && Array.isArray((data as any).messages)) {
    rawMessages = (data as any).messages;
  }

  return rawMessages.map((m) => ({
    id: m.id || m.messageId || "",
    content: m.content || m.message || "",
    createdAt: m.createdAt || m.timeStamp || Date.now(),
    senderId: m.senderId || "",
    senderName: m.senderName || "Unknown User",
    senderAvatar: m.senderAvatar || undefined,
    contextType,
    contextId,
  }));
};

function dedup(msgs: ChatMessage[]): ChatMessage[] {
  const seen = new Set<string>();
  return msgs.filter((m) => {
    if (!m.id) return true;
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
}

function groupByDate(msgs: ChatMessage[]): { label: string; messages: ChatMessage[] }[] {
  const groups: { label: string; messages: ChatMessage[] }[] = [];
  let current: { label: string; messages: ChatMessage[] } | null = null;

  for (const m of msgs) {
    const d = new Date(m.createdAt);
    const label = isToday(d) ? "Today" : isYesterday(d) ? "Yesterday" : format(d, "MMMM d, yyyy");

    if (!current || current.label !== label) {
      current = { label, messages: [] };
      groups.push(current);
    }

    current.messages.push(m);
  }

  return groups;
}

interface ConversationEntry {
  type: "task" | "project";
  id: string;
  name: string;
  icon: "task" | "project";
}

const MessagesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tasks, projects, users: teamMembers } = useData();
  const { contextType, contextId } = useParams<{ contextType: string; contextId: string }>();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentUserId = (user as any)?.userId || (user as any)?.id || "";
  const currentUserName = (user as any)?.name || "";

  const isTask = contextType === "task";
  const isProject = contextType === "project";
  const hasContext = !!(contextType && contextId && (isTask || isProject));

  const refreshNotifications = useCallback(async () => {
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to refresh notifications:", err);
    }
  }, []);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  useEffect(() => {
    const handler = () => {
      refreshNotifications();
    };

    window.addEventListener("notifications-updated", handler);
    return () => window.removeEventListener("notifications-updated", handler);
  }, [refreshNotifications]);

  const visibleProjects = useMemo(() => {
    if (!currentUserId) return [];
    return projects.filter(
      (p) =>
        p.ownerUserId === currentUserId ||
        p.createdBy === currentUserId ||
        (p.assignedUsers && p.assignedUsers.includes(currentUserId)) ||
        (p.team && p.team.includes(currentUserId)) ||
        (p.team && p.team.includes(currentUserName)) ||
        (p.assignedUsers && p.assignedUsers.includes(currentUserName)),
    );
  }, [projects, currentUserId, currentUserName]);

  const visibleTasks = useMemo(() => {
    if (!currentUserId) return [];
    const visibleProjectIds = new Set(visibleProjects.map((p) => p.id));
    return tasks.filter(
      (t) =>
        t.createdBy === currentUserId ||
        (t.assignedUsers && t.assignedUsers.includes(currentUserId)) ||
        (t.assignedUsers && t.assignedUsers.includes(currentUserName)) ||
        t.assignee === currentUserId ||
        t.assignee === currentUserName ||
        (t.projectId && visibleProjectIds.has(t.projectId)),
    );
  }, [tasks, currentUserId, currentUserName, visibleProjects]);

  const contextItem = isTask
    ? visibleTasks.find((t) => t.id === contextId)
    : visibleProjects.find((p) => p.id === contextId);

  const contextName = contextItem ? (isTask ? (contextItem as any).title : (contextItem as any).name) : contextId || "";

  const conversations = useMemo<ConversationEntry[]>(() => {
    const entries: ConversationEntry[] = [];

    for (const p of visibleProjects) {
      entries.push({
        type: "project",
        id: p.id,
        name: p.name,
        icon: "project",
      });
    }

    for (const t of visibleTasks) {
      entries.push({
        type: "task",
        id: t.id,
        name: t.title,
        icon: "task",
      });
    }

    return entries;
  }, [visibleProjects, visibleTasks]);

  const filteredConversations = useMemo(() => {
    if (!sidebarSearch.trim()) return conversations;
    const q = sidebarSearch.toLowerCase();
    return conversations.filter((c) => c.name.toLowerCase().includes(q));
  }, [conversations, sidebarSearch]);

  const unreadConversationMap = useMemo(() => {
    const map = new Map<string, number>();

    notifications
      .filter((n) => {
        if (n.read) return false;
        const isChat = n.type === "chat_message" || n.type === "chat" || n.type?.startsWith("chat");
        return isChat && !!n.conversationId;
      })
      .forEach((n) => {
        const key = n.conversationId as string;
        map.set(key, (map.get(key) || 0) + 1);
      });

    return map;
  }, [notifications]);

  useEffect(() => {
    setMessages([]);
    setDraft("");
    setLoading(true);
  }, [contextType, contextId]);

  const loadMessages = useCallback(async () => {
    if (!contextId || (!isTask && !isProject)) return;

    setLoading(true);

    try {
      const data = isTask ? await fetchTaskChat(contextId) : await fetchProjectChat(contextId);

      const extracted = extractMessages(data, isTask ? "task" : "project", contextId);

      setMessages(dedup(extracted));

      const conversationId = isTask ? `task#${contextId}` : `project#${contextId}`;

      try {
        await markConversationNotificationsRead(conversationId);

        setNotifications((prev) =>
          prev.map((n) =>
            n.conversationId === conversationId && n.type === "chat_message" ? { ...n, read: true } : n,
          ),
        );

        await refreshNotifications();
        window.dispatchEvent(new CustomEvent("notifications-updated"));
      } catch (err) {
        console.error("Failed to mark conversation notifications as read:", err);
      }
    } catch (err) {
      console.error("Failed to load chat:", err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [contextId, isTask, isProject, refreshNotifications]);

  useEffect(() => {
    if (hasContext) {
      loadMessages();
    }
  }, [hasContext, loadMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (!hasContext) return;

    let interval: ReturnType<typeof setInterval>;

    const start = () => {
      interval = setInterval(loadMessages, 12000);
    };

    const stop = () => clearInterval(interval);

    const onVis = () => {
      document.hidden ? stop() : start();
    };

    start();
    document.addEventListener("visibilitychange", onVis);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [hasContext, loadMessages]);

  const handleSend = async () => {
    if (!draft.trim() || !contextId || sending) return;

    setSending(true);

    try {
      await (isTask ? sendTaskChatMessage(contextId, draft.trim()) : sendProjectChatMessage(contextId, draft.trim()));

      setDraft("");
      await loadMessages();
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const getMemberAvatar = (senderId: string) => {
    const member = teamMembers.find((m) => m.id === senderId);
    return (member as any)?.avatar;
  };

  const getMemberName = (senderId: string) => {
    const member = teamMembers.find((m) => m.id === senderId);
    return member?.name;
  };

  const getInitials = (name: string) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  const renderEmptyState = () => (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
          <MessageSquare size={28} className="text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Your messages</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Select a project or task conversation from the sidebar to start chatting with your team.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/tasks")}>
            <CheckSquare size={14} /> Go to Tasks
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/projects")}>
            <FolderKanban size={14} /> Go to Projects
          </Button>
        </div>
      </div>
    </div>
  );

  const renderSidebar = () => (
    <div className="w-72 lg:w-80 border-r border-border bg-card flex flex-col shrink-0 hidden md:flex">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground mb-3">Conversations</h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={sidebarSearch}
            onChange={(e) => setSidebarSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full h-8 pl-9 pr-3 text-xs rounded-lg bg-muted/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none">
        {filteredConversations.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">No conversations found</p>
        )}

        {["project", "task"].map((type) => {
          const items = filteredConversations.filter((c) => c.type === type);
          if (items.length === 0) return null;

          return (
            <div key={type}>
              <div className="px-4 pt-3 pb-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  {type === "project" ? "Projects" : "Tasks"}
                </p>
              </div>

              {items.map((c) => {
                const isActive = c.type === contextType && c.id === contextId;
                const conversationKey = `${c.type}#${c.id}`;
                const unreadCount = unreadConversationMap.get(conversationKey) || 0;
                const isUnread = unreadCount > 0;

                return (
                  <button
                    key={`${c.type}-${c.id}`}
                    onClick={() => navigate(`/chats/${c.type}/${c.id}`)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      isActive
                        ? "bg-primary/8 border-r-2 border-primary"
                        : isUnread
                          ? "bg-primary/5 hover:bg-primary/8"
                          : "hover:bg-muted/50"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive ? "bg-primary/15" : isUnread ? "bg-primary/10" : "bg-muted"
                      }`}
                    >
                      {c.type === "project" ? (
                        <FolderKanban
                          size={14}
                          className={isActive || isUnread ? "text-primary" : "text-muted-foreground"}
                        />
                      ) : (
                        <CheckSquare
                          size={14}
                          className={isActive || isUnread ? "text-primary" : "text-muted-foreground"}
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[13px] truncate ${
                          isUnread
                            ? "font-semibold text-foreground"
                            : isActive
                              ? "font-medium text-foreground"
                              : "font-medium text-foreground/80"
                        }`}
                      >
                        {c.name}
                      </p>
                      <p
                        className={`text-[11px] capitalize ${
                          isUnread ? "text-foreground/80" : "text-muted-foreground"
                        }`}
                      >
                        {c.type} chat
                      </p>
                    </div>

                    {isUnread && (
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        {unreadCount > 0 && (
                          <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderChat = () => (
    <div key={`${contextType}-${contextId}`} className="flex-1 flex flex-col min-w-0">
      <div className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-border bg-card shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground md:hidden"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          {isTask ? (
            <CheckSquare size={16} className="text-primary" />
          ) : (
            <FolderKanban size={16} className="text-primary" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{contextName}</p>
          <p className="text-[11px] text-muted-foreground">{isTask ? "Task" : "Project"} Chat</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-muted flex items-center justify-center">
                <MessageSquare size={20} className="text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">No messages yet</p>
              <p className="text-xs text-muted-foreground">Start the conversation with your team</p>
            </div>
          </div>
        )}

        {!loading && messages.length > 0 && (
          <div className="space-y-1">
            {groupByDate(messages).map((group) => (
              <div key={group.label}>
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] font-medium text-muted-foreground px-2">{group.label}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <div className="space-y-3">
                  {group.messages.map((m, idx) => {
                    const isMe = m.senderId === currentUserId;
                    const avatar = m.senderAvatar || getMemberAvatar(m.senderId);
                    const displayName = getMemberName(m.senderId) || m.senderName;
                    const prevMsg = idx > 0 ? group.messages[idx - 1] : null;
                    const isSameSender = prevMsg?.senderId === m.senderId;

                    return (
                      <div
                        key={m.id}
                        className={`flex ${isMe ? "justify-end" : "justify-start"} gap-2.5 ${
                          isSameSender ? "mt-0.5" : "mt-3"
                        }`}
                      >
                        {!isMe && (
                          <div className="w-7 shrink-0">
                            {!isSameSender ? (
                              avatar ? (
                                <img src={avatar} alt={displayName} className="w-7 h-7 rounded-full object-cover" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                                  {getInitials(displayName)}
                                </div>
                              )
                            ) : null}
                          </div>
                        )}

                        <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
                          {!isMe && !isSameSender && (
                            <p className="text-[11px] font-medium text-muted-foreground mb-1 ml-1">{displayName}</p>
                          )}

                          <div
                            className={`rounded-2xl px-4 py-2.5 ${
                              isMe
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-muted text-foreground rounded-bl-md"
                            }`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                            <p
                              className={`text-[10px] mt-1 ${
                                isMe ? "text-primary-foreground/50" : "text-muted-foreground/70"
                              }`}
                            >
                              {format(new Date(m.createdAt), "h:mm a")}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <div className="border-t border-border px-4 md:px-6 py-3 bg-card shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 px-4 py-2.5 text-sm bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none text-foreground placeholder:text-muted-foreground"
          />
          <Button
            size="sm"
            className="h-10 w-10 p-0 rounded-xl"
            onClick={handleSend}
            disabled={sending || !draft.trim()}
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-56px)] animate-fade-in bg-background">
      {renderSidebar()}
      {hasContext ? renderChat() : renderEmptyState()}
    </div>
  );
};

export default MessagesPage;
