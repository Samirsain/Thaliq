const MAX_DIMENSION = 900;
const QUALITY = 0.82;

/**
 * Downscales and re-encodes an image in the browser before upload.
 *
 * A phone camera photo is typically 3–6 MB; menu thumbnails are displayed at
 * a few hundred pixels. Compressing here rather than uploading the original
 * keeps a restaurant's whole menu comfortably inside Supabase's 1 GB free
 * storage tier, and keeps served bytes (bandwidth quota) small too.
 *
 * WebP where the browser supports it, JPEG otherwise.
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  const bitmap = await createImageBitmap(file);

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process the image in this browser.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const supportsWebp = canvas.toDataURL("image/webp").startsWith("data:image/webp");
  const mime = supportsWebp ? "image/webp" : "image/jpeg";
  const extension = supportsWebp ? "webp" : "jpg";

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mime, QUALITY),
  );
  if (!blob) throw new Error("Could not process the image.");

  return new File([blob], `image.${extension}`, { type: mime });
}
