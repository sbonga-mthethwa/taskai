import { getAuthHeaders, API_BASE_URL } from "./apiBase";

interface AvatarUploadUrlApiResponse {
  uploadUrl?: string;
  upload_url?: string;
  avatarUrl?: string;
  avatar_url?: string;
  fileUrl?: string;
  file_url?: string;
  publicUrl?: string;
  public_url?: string;
  url?: string;
}

export interface AvatarUploadUrlResponse {
  uploadUrl: string;
  avatarUrl?: string;
}

function pickString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) return value;
  }
  return undefined;
}

function proxyUrl(targetPath: string): string {
  return `${API_BASE_URL}${targetPath}`;
}

async function parseJsonSafe<T>(res: Response): Promise<T | null> {
  const text = await res.text().catch(() => "");
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function requestAvatarUploadUrl(fileName: string, contentType: string): Promise<AvatarUploadUrlResponse> {
  const res = await fetch(`${API_BASE_URL}/users/avatar/upload-url`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(true),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fileName, contentType }),
  });

  const data = await parseJsonSafe<AvatarUploadUrlApiResponse & { error?: string; details?: string }>(res);

  if (!res.ok) {
    throw new Error(data?.details || data?.error || `Failed to get avatar upload URL (${res.status})`);
  }

  const uploadUrl = pickString(data?.uploadUrl, data?.upload_url, data?.url);
  if (!uploadUrl) {
    throw new Error("Avatar upload URL was not returned by the backend.");
  }

  return {
    uploadUrl,
    avatarUrl: pickString(
      data?.avatarUrl,
      data?.avatar_url,
      data?.fileUrl,
      data?.file_url,
      data?.publicUrl,
      data?.public_url,
    ),
  };
}

export function resolveAvatarUrl(response: AvatarUploadUrlResponse): string {
  return response.avatarUrl || response.uploadUrl.split("?")[0] || "";
}

export async function uploadAvatarToS3(uploadUrl: string, file: Blob, contentType: string): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType || "image/jpeg",
    },
    body: file,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`S3 avatar upload failed (${res.status}): ${text || "Unknown upload error"}`);
  }
}

export async function saveUserAvatar(userId: string, avatarUrl: string): Promise<void> {
  const res = await fetch(proxyUrl(`/users/${userId}/avatar`), {
    method: "PUT",
    headers: {
      ...getAuthHeaders(true),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ avatarUrl }),
  });

  const data = await parseJsonSafe<{ error?: string; details?: string }>(res);

  if (!res.ok) {
    throw new Error(data?.details || data?.error || `Failed to save avatar (${res.status})`);
  }
}
