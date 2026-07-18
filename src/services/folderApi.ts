import { getAuthHeaders, API_BASE_URL } from "./apiBase";

export interface ApiFolder {
  folderId: string;
  name: string;
  parentFolderId: string | null;
  projectId?: string | null;
  visibility?: string;
  ownerUserId?: string;
  createdBy?: string;
  sharedWith?: string[];
  path?: string;
  createdAt?: number | string;
  updatedAt?: number | string;
}

export interface CreateFolderPayload {
  name: string;
  projectId?: string | null;
  parentFolderId?: string | null;
  visibility?: "private" | "project" | "shared" | string;
  sharedWith?: string[];
}

export interface UpdateFolderPayload {
  name?: string;
  parentFolderId?: string | null;
  visibility?: string;
  sharedWith?: string[];
}

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function proxyUrl(targetPath: string): string {
  return `${API_BASE_URL}${targetPath}`;
}

function normalizeFolder(raw: unknown): ApiFolder | null {
  if (!raw || typeof raw !== "object") return null;

  const f = raw as Record<string, unknown>;
  const folderId = asNonEmptyString(f.folderId) ?? asNonEmptyString(f.folder_id) ?? asNonEmptyString(f.id);

  const name = asNonEmptyString(f.name) ?? asNonEmptyString(f.folderName);

  if (!folderId || !name) return null;

  return {
    folderId,
    name,
    parentFolderId:
      asNonEmptyString(f.parentFolderId) ??
      asNonEmptyString(f.parent_folder_id) ??
      asNonEmptyString(f.parentId) ??
      null,
    projectId: asNonEmptyString(f.projectId) ?? asNonEmptyString(f.project_id) ?? null,
    visibility: asNonEmptyString(f.visibility) ?? "private",
    ownerUserId: asNonEmptyString(f.ownerUserId) ?? asNonEmptyString(f.owner_user_id) ?? undefined,
    createdBy: asNonEmptyString(f.createdBy) ?? asNonEmptyString(f.created_by) ?? undefined,
    sharedWith: Array.isArray(f.sharedWith)
      ? (f.sharedWith as string[])
      : Array.isArray(f.shared_with)
        ? (f.shared_with as string[])
        : [],
    path: asNonEmptyString(f.path),
    createdAt:
      typeof f.createdAt === "number" || typeof f.createdAt === "string"
        ? (f.createdAt as number | string)
        : typeof f.created_at === "number" || typeof f.created_at === "string"
          ? (f.created_at as number | string)
          : undefined,
    updatedAt:
      typeof f.updatedAt === "number" || typeof f.updatedAt === "string"
        ? (f.updatedAt as number | string)
        : typeof f.updated_at === "number" || typeof f.updated_at === "string"
          ? (f.updated_at as number | string)
          : undefined,
  };
}

function extractFolderArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const data = payload as Record<string, unknown>;
  for (const c of [data.folders, data.items, data.records, data.data, data.results]) {
    if (Array.isArray(c)) return c;
  }
  return [];
}

function extractSingleFolder(payload: unknown): ApiFolder | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;

  if (data.folder) {
    return normalizeFolder(data.folder);
  }

  return normalizeFolder(data);
}

// POST /folders — direct to AWS
export async function createFolder(payload: CreateFolderPayload): Promise<ApiFolder> {
  const res = await fetch(`${API_BASE_URL}/folders`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Failed to create folder (${res.status}): ${text}`);
  }

  try {
    const parsed = text ? JSON.parse(text) : {};
    const normalized = extractSingleFolder(parsed);
    if (!normalized) throw new Error("Folder response missing folder data");
    return normalized;
  } catch (err: any) {
    throw new Error(err?.message || "Folder created but response could not be parsed");
  }
}

// GET /folders
export async function fetchFolders(params?: {
  projectId?: string | null;
  parentFolderId?: string | null;
}): Promise<ApiFolder[]> {
  const qs = new URLSearchParams();

  if (params?.projectId) qs.set("projectId", params.projectId);

  if (params && "parentFolderId" in params) {
    qs.set("parentFolderId", params.parentFolderId ?? "null");
  }

  const path = `/folders${qs.toString() ? `?${qs.toString()}` : ""}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    cache: "no-store",
    headers: {
      ...getAuthHeaders(),
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });

  const text = await res.text();

  if (!res.ok) {
    console.error("GET /folders failed:", res.status, text);
    throw new Error(text || "Unable to load folders. Please try again.");
  }

  const data = text ? JSON.parse(text) : {};
  console.log("Raw folders API response:", data);

  return extractFolderArray(data)
    .map(normalizeFolder)
    .filter((f): f is ApiFolder => f !== null);
}

// PUT /folders/{folderId} — through proxy
export async function updateFolder(folderId: string, payload: UpdateFolderPayload): Promise<ApiFolder> {
  const res = await fetch(proxyUrl(`/folders/${folderId}`), {
    method: "PUT",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Failed to update folder (${res.status}): ${text}`);
  }

  try {
    const parsed = text ? JSON.parse(text) : {};
    const normalized = extractSingleFolder(parsed);
    if (!normalized) throw new Error("Folder update response missing folder data");
    return normalized;
  } catch (err: any) {
    throw new Error(err?.message || "Folder updated but response could not be parsed");
  }
}

// DELETE /folders/{folderId} — through proxy
export async function deleteFolder(folderId: string): Promise<void> {
  const res = await fetch(proxyUrl(`/folders/${folderId}`), {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to delete folder (${res.status}): ${text}`);
  }
}

// PUT /documents/{documentId}/folder — through proxy
export async function moveDocumentToFolder(documentId: string, folderId: string | null): Promise<void> {
  const res = await fetch(proxyUrl(`/documents/${documentId}/folder`), {
    method: "PUT",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ folderId }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to move document (${res.status}): ${text}`);
  }
}
