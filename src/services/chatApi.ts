import { apiFetch } from "./apiBase";

// ─── Types ───
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  createdAt: string;
  contextType: "task" | "project";
  contextId: string;
}

export interface ChatResponse {
  success: boolean;
  messages: unknown[];
}

/**
 * Normalize a raw backend message object into our client ChatMessage shape.
 * Handles field name differences: messageId→id, message→content, timeStamp→createdAt, etc.
 */
function normalizeMessage(raw: any, fallbackContextType?: "task" | "project", fallbackContextId?: string): ChatMessage {
  return {
    id: raw.id || raw.messageId || raw._id || crypto.randomUUID(),
    senderId: raw.senderId || raw.sender_id || raw.userId || raw.user_id || "",
    senderName: raw.senderName || raw.sender_name || raw.userName || raw.user_name || "Unknown",
    senderAvatar: raw.senderAvatar || raw.sender_avatar || raw.avatarUrl || raw.avatar_url || undefined,
    content: raw.content || raw.message || raw.text || raw.body || "",
    createdAt: raw.createdAt || raw.created_at || raw.timeStamp || raw.timestamp || raw.sentAt || new Date().toISOString(),
    contextType: raw.contextType || raw.context_type || fallbackContextType || "task",
    contextId: raw.contextId || raw.context_id || fallbackContextId || "",
  };
}

// ─── Endpoints ───

/** Extract raw messages array from any backend shape */
function extractMessages(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.messages)) return data.messages;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

/** Fetch chat messages for a task */
export async function fetchTaskChat(taskId: string): Promise<ChatMessage[]> {
  const data = await apiFetch<any>(`/chats/task/${encodeURIComponent(taskId)}`);
  return extractMessages(data).map((m: any) => normalizeMessage(m, "task", taskId));
}

/** Fetch chat messages for a project */
export async function fetchProjectChat(projectId: string): Promise<ChatMessage[]> {
  const data = await apiFetch<any>(`/chats/project/${encodeURIComponent(projectId)}`);
  return extractMessages(data).map((m: any) => normalizeMessage(m, "project", projectId));
}

/** Send a message to a task chat — no retries to prevent duplicates */
export async function sendTaskChatMessage(taskId: string, content: string): Promise<ChatMessage> {
  const data = await apiFetch<{ success: boolean; message: any }>(
    `/chats/task/${encodeURIComponent(taskId)}/messages`,
    { method: "POST", body: JSON.stringify({ message: content }) },
  );
  return normalizeMessage(data.message || data, "task", taskId);
}

/** Send a message to a project chat — no retries to prevent duplicates */
export async function sendProjectChatMessage(projectId: string, content: string): Promise<ChatMessage> {
  const data = await apiFetch<{ success: boolean; message: any }>(
    `/chats/project/${encodeURIComponent(projectId)}/messages`,
    { method: "POST", body: JSON.stringify({ message: content }) },
  );
  return normalizeMessage(data.message || data, "project", projectId);
}
