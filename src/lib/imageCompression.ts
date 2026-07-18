import imageCompression from "browser-image-compression";

/**
 * Compress an image file/blob for avatar upload.
 * Targets 512×512 max and ~200KB output.
 */
export async function compressAvatarImage(file: File | Blob): Promise<File> {
  const asFile =
    file instanceof File
      ? file
      : new File([file], "avatar.jpg", { type: file.type || "image/jpeg" });

  const compressed = await imageCompression(asFile, {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 512,
    useWebWorker: true,
    fileType: "image/jpeg",
  });

  return new File([compressed], "avatar.jpg", { type: "image/jpeg" });
}
