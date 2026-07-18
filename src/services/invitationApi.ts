import { API_BASE_URL, apiFetch } from "./apiBase";
import { getStoredIdToken } from "./cognitoAuth";

/**
 * Invite endpoints on the backend require the Cognito **ID token** (which
 * contains the user's email claim) rather than the access token used by
 * most other endpoints.  This thin wrapper mirrors apiFetch but swaps the
 * Authorization header accordingly.
 *
 * All requests go directly to AWS API Gateway.
 */
async function inviteFetch<T>(path: string, options?: RequestInit, retries = 2): Promise<T> {
  const method = (options?.method || "GET").toUpperCase();
  const url = `${API_BASE_URL}${path}`;

  const idToken = getStoredIdToken();
  const isFormData = typeof FormData !== "undefined" && options?.body instanceof FormData;
  const shouldIncludeJson = method !== "GET" && method !== "HEAD" && options?.body !== undefined && !isFormData;

  const headers: Record<string, string> = {};
  if (shouldIncludeJson) headers["Content-Type"] = "application/json";
  if (idToken) headers["Authorization"] = `Bearer ${idToken}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { ...options, headers: { ...headers, ...options?.headers } });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed: ${res.status}`);
      }
      if (res.status === 204) return undefined as T;
      const text = await res.text();
      return (text ? JSON.parse(text) : undefined) as T;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw new Error("Request failed after retries");
}

// ─── Types ───────────────────────────────────

export interface Invitation {
  id: string;
  token: string;
  workspace_name: string;
  workspace_id?: string;
  project_id?: string;
  invited_email: string;
  invited_role: string;
  invited_department: string | null;
  invited_by_user_id: string;
  invited_by_name: string;
  message: string | null;
  status: "pending" | "accepted" | "declined" | "expired" | "revoked";
  created_at: string;
  updated_at: string;
  expires_at: string;
  accepted_at: string | null;
  declined_at: string | null;
  revoked_at: string | null;
  used_at: string | null;
  accepted_by_user_id: string | null;
  accepted_by_email: string | null;
  full_name: string | null;
  employee_number: string | null;
}

export interface InviteValidation {
  id: string;
  workspace_name: string;
  invited_email: string;
  invited_role: string;
  invited_department: string | null;
  invited_by_name: string;
  message: string | null;
  status: string;
  expires_at: string;
  is_valid: boolean;
  requires_auth: boolean;
}

export interface InviteSummary {
  pending: number;
  accepted: number;
  declined: number;
  expired: number;
}

// ─── Normalisation ───────────────────────────────────
// The backend may return camelCase OR snake_case fields.
// We normalise every invite record to the snake_case Invitation shape
// so the rest of the frontend can rely on one format.

function normalizeInvite(raw: any): Invitation {
  return {
    id: raw.id ?? raw.inviteId ?? "",
    token: raw.token ?? "",
    workspace_name: raw.workspace_name ?? raw.workspaceName ?? "",
    workspace_id: raw.workspace_id ?? raw.workspaceId ?? undefined,
    project_id: raw.project_id ?? raw.projectId ?? undefined,
    invited_email: (raw.invited_email ?? raw.invitedEmail ?? "").trim().toLowerCase(),
    invited_role: raw.invited_role ?? raw.invitedRole ?? "member",
    invited_department: raw.invited_department ?? raw.invitedDepartment ?? null,
    invited_by_user_id: raw.invited_by_user_id ?? raw.invitedByUserId ?? "",
    invited_by_name: raw.invited_by_name ?? raw.invitedByName ?? "",
    message: raw.message ?? null,
    status: raw.status ?? "pending",
    created_at: raw.created_at ?? raw.createdAt ?? "",
    updated_at: raw.updated_at ?? raw.updatedAt ?? "",
    expires_at: raw.expires_at ?? raw.expiresAt ?? "",
    accepted_at: raw.accepted_at ?? raw.acceptedAt ?? null,
    declined_at: raw.declined_at ?? raw.declinedAt ?? null,
    revoked_at: raw.revoked_at ?? raw.revokedAt ?? null,
    used_at: raw.used_at ?? raw.usedAt ?? null,
    accepted_by_user_id: raw.accepted_by_user_id ?? raw.acceptedByUserId ?? null,
    accepted_by_email: raw.accepted_by_email ?? raw.acceptedByEmail ?? null,
    full_name: raw.full_name ?? raw.fullName ?? null,
    employee_number: raw.employee_number ?? raw.employeeNumber ?? null,
  };
}

function normalizeInviteValidation(raw: any): InviteValidation {
  return {
    id: raw.id ?? raw.inviteId ?? "",
    workspace_name: raw.workspace_name ?? raw.workspaceName ?? "",
    invited_email: (raw.invited_email ?? raw.invitedEmail ?? "").trim().toLowerCase(),
    invited_role: raw.invited_role ?? raw.invitedRole ?? "member",
    invited_department: raw.invited_department ?? raw.invitedDepartment ?? null,
    invited_by_name: raw.invited_by_name ?? raw.invitedByName ?? "",
    message: raw.message ?? null,
    status: raw.status ?? "pending",
    expires_at: raw.expires_at ?? raw.expiresAt ?? "",
    is_valid: raw.is_valid ?? raw.isValid ?? false,
    requires_auth: raw.requires_auth ?? raw.requiresAuth ?? false,
  };
}

function normalizeInvites(rawList: any): Invitation[] {
  if (!rawList) return [];
  const arr = Array.isArray(rawList) ? rawList : [];
  return arr.map(normalizeInvite);
}

// ─── Admin endpoints ───────────────────────────────────

export async function createInvitation(params: {
  invited_email: string;
  invited_role?: string;
  invited_department?: string;
  invited_by_user_id: string;
  invited_by_name: string;
  message?: string;
  full_name?: string;
  employee_number?: string;
  workspace_id?: string;
  workspace_name?: string;
  project_id?: string;
  project_name?: string;
}): Promise<{ success: boolean; invite: Invitation; invite_url: string }> {
  const body = {
    projectId: params.project_id,
    projectName: params.project_name,
    invitedEmail: params.invited_email.trim().toLowerCase(),
    invitedRole: params.invited_role || "member",
    invitedByUserId: params.invited_by_user_id,
    invitedByName: params.invited_by_name,
    message: params.message,
    fullName: params.full_name,
    employeeNumber: params.employee_number,
    workspaceName: params.workspace_name || "TaskAI",
    workspaceId: params.workspace_id,
  };
  console.log("[invite] POST", `${API_BASE_URL}/invites`, body);
  const result = await apiFetch<any>("/invites", {
    method: "POST",
    body: JSON.stringify(body),
  });
  console.log("[invite] POST /invites response", result);
  return {
    success: result.success ?? true,
    invite: normalizeInvite(result.invite ?? result),
    invite_url: result.invite_url ?? result.inviteUrl ?? "",
  };
}

export async function fetchSentInvitations(): Promise<{ success: boolean; invites: Invitation[] }> {
  const result = await inviteFetch<any>("/invites/sent");
  return {
    success: result.success ?? true,
    invites: normalizeInvites(result.invites ?? result),
  };
}

export async function resendInvitation(inviteId: string): Promise<{ success: boolean; invite: Invitation }> {
  const result = await inviteFetch<any>(`/invites/${inviteId}/resend`, { method: "POST", body: JSON.stringify({}) });
  return { success: result.success ?? true, invite: normalizeInvite(result.invite ?? result) };
}

export async function revokeInvitation(inviteId: string): Promise<{ success: boolean; invite: Invitation }> {
  const result = await inviteFetch<any>(`/invites/${inviteId}/revoke`, { method: "POST", body: JSON.stringify({}) });
  return { success: result.success ?? true, invite: normalizeInvite(result.invite ?? result) };
}

// ─── Public/semi-public endpoints ──────────────────────

export async function fetchInvitationByToken(token: string): Promise<{ success: boolean; invite: InviteValidation }> {
  const result = await inviteFetch<any>(`/invites/token/${encodeURIComponent(token)}`);
  return {
    success: result.success ?? true,
    invite: normalizeInviteValidation(result.invite ?? result),
  };
}

// ─── Authenticated user endpoints ──────────────────────

export async function fetchMyInvitations(): Promise<{ success: boolean; invites: Invitation[]; summary: InviteSummary }> {
  const result = await inviteFetch<any>("/invites/me");
  return {
    success: result.success ?? true,
    invites: normalizeInvites(result.invites ?? result),
    summary: result.summary ?? { pending: 0, accepted: 0, declined: 0, expired: 0 },
  };
}

export async function acceptInvitation(inviteId: string): Promise<{ success: boolean; invite: Invitation; membership: any }> {
  const result = await inviteFetch<any>(`/invites/${inviteId}/accept`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  return {
    success: result.success ?? true,
    invite: normalizeInvite(result.invite ?? result),
    membership: result.membership ?? null,
  };
}

export async function declineInvitation(inviteId: string): Promise<{ success: boolean; invite: Invitation }> {
  const result = await inviteFetch<any>(`/invites/${inviteId}/decline`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  return { success: result.success ?? true, invite: normalizeInvite(result.invite ?? result) };
}

// ─── Legacy (backward compat) ──────────────────────────

export async function fetchInvitations(): Promise<Invitation[]> {
  const result = await fetchMyInvitations();
  return result.invites;
}

export function getInviteUrl(token: string): string {
  return `${window.location.origin}/invite/${token}`;
}
