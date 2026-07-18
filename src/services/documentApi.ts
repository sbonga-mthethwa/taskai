import { getAuthHeaders, API_BASE_URL } from "./apiBase";

function isPreviewEnvironment(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host.includes("id-preview--") || host.endsWith(".lovableproject.com");
}

function isNetworkFetchError(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  if (error instanceof Error) return /failed to fetch|networkerror/i.test(error.message);
  return false;
}

function isMissingDocumentIdError(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const payload = body as { error?: unknown; message?: unknown };
  const text = [payload.error, payload.message]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();
  return text.includes("missing documentid");
}


export interface ApiDocument {
  documentId: string;
  fileName: string;
  category: string;
  ownerUserId: string;
  uploadedBy: string;
  fileType: string;
  visibility: string;
  sharedWith?: string[];
  editableBy?: string[];
  projectId?: string;
  folderId?: string | null;
  bucketKey?: string;
  tags?: { label: string; color: string }[];
  createdAt?: string;
}

export interface UploadUrlRequest {
  fileName: string;
  contentType: string;
  category?: string;
  fileType?: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  bucketKey: string;
  documentId?: string;
}

export interface CreateDocumentRequest {
  documentId?: string;
  fileName: string;
  category: string;
  ownerUserId: string;
  uploadedBy: string;
  fileType: string;
  visibility: string;
  sharedWith?: string[];
  editableBy?: string[];
  projectId?: string;
  bucketKey: string;
  tags?: { label: string; color: string }[];
}

type RawApiDocument = Record<string, unknown>;

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value.filter((item): item is string => typeof item === "string" && item.length > 0);
  return items.length > 0 ? items : undefined;
}

function normalizeTags(value: unknown): { label: string; color: string }[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const tags = value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const tag = entry as { label?: unknown; name?: unknown; color?: unknown };
    const label = asNonEmptyString(tag.label) ?? asNonEmptyString(tag.name);
    if (!label) return [];

    return [{
      label,
      color: asNonEmptyString(tag.color) ?? "#94a3b8",
    }];
  });

  return tags.length > 0 ? tags : undefined;
}

function normalizeCreatedAt(value: unknown): string | undefined {
  if (typeof value === "string" && value) return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  return undefined;
}

function extractDocumentArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const data = payload as Record<string, unknown>;
  const candidates = [data.documents, data.items, data.records, data.data, data.results];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (candidate && typeof candidate === "object") {
      const nested = candidate as Record<string, unknown>;
      if (Array.isArray(nested.items)) return nested.items;
      if (Array.isArray(nested.records)) return nested.records;
      if (Array.isArray(nested.documents)) return nested.documents;
    }
  }

  return [];
}

function normalizeDocument(raw: unknown): ApiDocument | null {
  if (!raw || typeof raw !== "object") return null;

  const doc = raw as RawApiDocument;
  const documentId = asNonEmptyString(doc.documentId) ?? asNonEmptyString(doc.document_id) ?? asNonEmptyString(doc.id);
  const fileName = asNonEmptyString(doc.fileName) ?? asNonEmptyString(doc.file_name) ?? asNonEmptyString(doc.name);

  if (!documentId || !fileName) return null;

  const category = (
    asNonEmptyString(doc.category) ??
    asNonEmptyString(doc.folder) ??
    asNonEmptyString(doc.folderId) ??
    asNonEmptyString(doc.folder_id) ??
    "uploads"
  ).toLowerCase();

  return {
    documentId,
    fileName,
    category,
    ownerUserId:
      asNonEmptyString(doc.ownerUserId) ??
      asNonEmptyString(doc.owner_user_id) ??
      asNonEmptyString(doc.userId) ??
      asNonEmptyString(doc.user_id) ??
      "",
    uploadedBy:
      asNonEmptyString(doc.uploadedBy) ??
      asNonEmptyString(doc.uploaded_by) ??
      asNonEmptyString(doc.createdBy) ??
      asNonEmptyString(doc.created_by) ??
      asNonEmptyString(doc.ownerUserId) ??
      asNonEmptyString(doc.owner_user_id) ??
      "Unknown",
    fileType:
      asNonEmptyString(doc.fileType) ??
      asNonEmptyString(doc.file_type) ??
      asNonEmptyString(doc.contentType) ??
      asNonEmptyString(doc.content_type) ??
      "application/octet-stream",
    visibility: asNonEmptyString(doc.visibility) ?? asNonEmptyString(doc.access) ?? "project",
    sharedWith: asStringArray(doc.sharedWith) ?? asStringArray(doc.shared_with),
    editableBy: asStringArray(doc.editableBy) ?? asStringArray(doc.editable_by),
    projectId: asNonEmptyString(doc.projectId) ?? asNonEmptyString(doc.project_id),
    folderId:
      asNonEmptyString(doc.folderId) ??
      asNonEmptyString(doc.folder_id) ??
      asNonEmptyString(doc.parentFolderId) ??
      asNonEmptyString(doc.parent_folder_id) ??
      null,
    bucketKey:
      asNonEmptyString(doc.bucketKey) ??
      asNonEmptyString(doc.bucket_key) ??
      asNonEmptyString(doc.objectKey) ??
      asNonEmptyString(doc.object_key),
    tags: normalizeTags(doc.tags),
    createdAt: normalizeCreatedAt(doc.createdAt ?? doc.created_at),
  };
}

// Helper to build direct AWS URL
function proxyUrl(targetPath: string): string {
  return `${API_BASE_URL}${targetPath}`;
}

// GET all documents
export async function fetchDocuments(): Promise<ApiDocument[]> {
  const res = await fetch(proxyUrl("/documents"), {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    if (res.status === 400 || res.status === 404) {
      try {
        const body = await res.json().catch(() => ({}));
        if (isMissingDocumentIdError(body)) return [];
      } catch {
        // ignore parse errors
      }
      // Return empty list for any 400 from the list endpoint —
      // the backend may not yet support listing without documentId
      return [];
    }
    throw new Error("Something went wrong while loading your documents. Please try again.");
  }
  const data = await res.json();
  return extractDocumentArray(data)
    .map(normalizeDocument)
    .filter((doc): doc is ApiDocument => doc !== null);
}

// POST request upload URL (presigned S3 URL)
export async function requestUploadUrl(params: UploadUrlRequest): Promise<UploadUrlResponse> {
  const res = await fetch(proxyUrl("/documents/upload-url"), {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Unable to prepare your upload. Please try again.");
  return res.json();
}

// PUT file to S3 using presigned URL
export async function uploadFileToS3(uploadUrl: string, file: File, contentType?: string): Promise<void> {
  const resolvedType = contentType || file.type || "application/octet-stream";
  console.log("[S3 Upload Debug] PUT request:", { url: uploadUrl.substring(0, 120) + "...", contentType: resolvedType, fileSize: file.size, fileName: file.name });

  try {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": resolvedType },
      body: file,
    });

    if (!res.ok) {
      // Attempt to read S3 XML error body
      const errorBody = await res.text().catch(() => "");
      console.error("[S3 Upload Debug] S3 error response:", { status: res.status, statusText: res.statusText, body: errorBody });
      throw new Error(`S3 upload failed (${res.status}): ${errorBody || res.statusText}`);
    }
    console.log("[S3 Upload Debug] Upload successful, status:", res.status);
  } catch (error) {
    if (isNetworkFetchError(error)) {
      console.error("[S3 Upload Debug] Network/CORS error:", error);
      if (isPreviewEnvironment() && uploadUrl.includes("amazonaws.com")) {
        const origin = typeof window !== "undefined" ? window.location.origin : "the current origin";
        throw new Error(`Upload is blocked by S3 CORS for ${origin}. Add this exact origin to S3 CORS AllowedOrigins, then retry.`);
      }
      throw new Error("Unable to reach file storage. Please check your connection and try again.");
    }
    throw error;
  }
}

// POST create document metadata
export async function createDocument(params: CreateDocumentRequest): Promise<ApiDocument> {
  const payload = {
    ...params,
    contentType: params.fileType,
  };
  console.log("[createDocument] POST /documents payload:", JSON.stringify(payload));
  const res = await fetch(proxyUrl("/documents"), {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const responseText = await res.text();
  console.log("[createDocument] Response status:", res.status, "body:", responseText);
  if (!res.ok) throw new Error(`Your file was uploaded but we couldn't save its details (${res.status}): ${responseText}`);
  try {
    return JSON.parse(responseText);
  } catch {
    return { documentId: params.documentId || "", fileName: params.fileName, category: params.category, ownerUserId: params.ownerUserId, uploadedBy: params.uploadedBy, fileType: params.fileType, visibility: params.visibility, bucketKey: params.bucketKey } as ApiDocument;
  }
}

// PUT update document metadata
export async function updateDocumentMetadata(
  documentId: string,
  updates: Partial<CreateDocumentRequest & { projectId: string }>
): Promise<ApiDocument> {
  const res = await fetch(proxyUrl(`/documents/${documentId}`), {
    method: "PUT",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update document");
  return res.json();
}

export async function getDownloadUrl(documentId: string): Promise<string> {
  const res = await fetch(proxyUrl(`/documents/${documentId}/download-url`), {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Unable to open file. Please try again.");
  const data = await res.json();
  return data.downloadUrl ?? data.url ?? "";
}

// Map category string to folder id used in the UI
const CATEGORY_TO_FOLDER: Record<string, string> = {
  contracts: "contracts",
  finance: "finance",
  hr: "hr",
  projects: "projects",
  uploads: "uploads",
  personal: "personal",
};

// Map folder id back to API category
export const FOLDER_TO_CATEGORY: Record<string, string> = {
  contracts: "contracts",
  finance: "finance",
  hr: "hr",
  projects: "projects",
  uploads: "uploads",
  personal: "personal",
};

// Convert API document to the DocFile shape used by FilesPage
export function apiDocToDocFile(doc: ApiDocument): {
  id: string;
  name: string;
  folderId: string | null;
  uploadedBy: string;
  date: string;
  type: string;
  tags: { label: string; color: string }[];
} {
  const ext = doc.fileName.split(".").pop()?.toLowerCase() || "";
  let type = "document";
  if (ext === "pdf") type = "pdf";
  else if (["xlsx", "xls", "csv"].includes(ext)) type = "spreadsheet";
  else if (["fig", "figma"].includes(ext)) type = "figma";
  else if (["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(ext)) type = "figma";
  else if (["yaml", "yml", "json", "js", "ts", "md"].includes(ext)) type = "code";

  const dateStr = doc.createdAt
    ? new Date(doc.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Mar 17, 2026";

  const normalizedCategory = doc.category?.toLowerCase() ?? "";
  const normalizedProjectId = doc.projectId?.toLowerCase();

  // Priority 1: explicit folderId from backend (set when document moved into a custom folder)
  // Priority 2: projectId acting as folder reference
  // Priority 3: known category mapping
  const defaultFolderId = CATEGORY_TO_FOLDER[normalizedCategory] ?? null;
  const projectFolderId = doc.projectId
    ? (CATEGORY_TO_FOLDER[normalizedProjectId ?? ""] ? normalizedProjectId ?? null : doc.projectId)
    : null;
  const folderId = doc.folderId ?? projectFolderId ?? defaultFolderId ?? "uploads";

  return {
    id: doc.documentId,
    name: doc.fileName,
    folderId,
    uploadedBy: doc.uploadedBy,
    date: dateStr,
    type,
    tags: doc.tags ?? [],
  };
}
