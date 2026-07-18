import { API_BASE_URL, getAuthHeaders } from "./apiBase";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  senderName?: string;
  senderAvatar?: string;
  contextType?: "task" | "project";
  contextId?: string;
  contextName?: string;
  read: boolean;
  createdAt: string;
  conversationId?: string;
  notificationId?: string;
}

export interface NotificationsResponse {
  success: boolean;
  notifications: AppNotification[];
  unreadCount?: number;
}

// ─── Internal proxy fetch helper ─────────────────────────────────────────────

async function proxyFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const method = (options?.method || "GET").toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD" && options?.body !== undefined;

  const res = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(hasBody),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toBooleanRead(value: any): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return Boolean(value);
}

function toCreatedAtString(value: any): string {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number") return String(value);
  return String(Date.now());
}

function normalizeNotification(n: any): AppNotification {
  let conversationId: string | undefined = n.conversationId || n.conversation_id;

  let contextType: "task" | "project" | undefined = n.contextType || n.context_type;

  let contextId: string | undefined = n.contextId || n.context_id;

  if ((!contextType || !contextId) && typeof conversationId === "string") {
    if (conversationId.startsWith("task#")) {
      contextType = "task";
      contextId = conversationId.replace("task#", "");
    } else if (conversationId.startsWith("project#")) {
      contextType = "project";
      contextId = conversationId.replace("project#", "");
    }
  }

  // Derive conversationId from contextType+contextId if backend didn't send it
  if (!conversationId && contextType && contextId) {
    conversationId = `${contextType}#${contextId}`;
  }

  const read =
    n.read !== undefined
      ? toBooleanRead(n.read)
      : n.isRead !== undefined
        ? toBooleanRead(n.isRead)
        : n.is_read !== undefined
          ? toBooleanRead(n.is_read)
          : Boolean(n.readAt || n.read_at);

  return {
    id: n.id || n.notificationId || n.notification_id || "",
    notificationId: n.notificationId || n.notification_id,
    type: n.type || "",
    title: n.title || "",
    message: n.message || n.messagePreview || n.message_preview || n.content || "",
    senderName: n.senderName || n.sender_name,
    senderAvatar: n.senderAvatar || n.sender_avatar,
    contextType,
    contextId,
    contextName: n.contextName || n.context_name || n.title,
    read,
    createdAt: toCreatedAtString(n.createdAt || n.created_at),
    conversationId,
  };
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

/** Fetch notifications for the current user */
export async function fetchNotifications(): Promise<AppNotification[]> {
  const data = await proxyFetch<NotificationsResponse | AppNotification[]>("/notifications");

  if (Array.isArray(data)) {
    return data.map(normalizeNotification);
  }

  return (data?.notifications || []).map(normalizeNotification);
}

/** Mark a single notification as read */
export async function markNotificationRead(notificationId: string, createdAt?: string | number): Promise<void> {
  await proxyFetch(`/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: "POST",
    body: JSON.stringify(createdAt !== undefined ? { createdAt } : {}),
  });
}

/** Mark all notifications as read */
export async function markAllNotificationsRead(): Promise<void> {
  await proxyFetch("/notifications/read-all", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

/** Mark all chat notifications for a specific conversation as read */
export async function markConversationNotificationsRead(conversationId: string): Promise<void> {
  await proxyFetch("/notifications/read-conversation", {
    method: "POST",
    body: JSON.stringify({ conversationId }),
  });
}
