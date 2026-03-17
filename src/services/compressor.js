/**
 * Image Compressor Service
 * Provides a promise-based `compressImage` function that resizes an input File
 * using an HTML5 canvas and returns a compressed JPEG `File`.
 */

/**
 * Compress an image File using canvas.
 * @param {File} file - Input image file from an <input type="file"> element.
 * @param {number} maxWidth - Maximum width for the output image (px). Defaults to 1024.
 * @param {number} quality - JPEG quality between 0 and 1. Defaults to 0.7.
 * @returns {Promise<File>} - A new File object containing the compressed JPEG image.
 */
export async function compressImage(file, maxWidth = 1024, quality = 0.7) {
  if (!(file instanceof File)) throw new TypeError("compressImage expects a File");
  if (!file.type || !file.type.startsWith("image/"))
    throw new TypeError("compressImage expects an image File");

  // Create an HTMLImageElement and load the file
  const objectUrl = URL.createObjectURL(file);
  const img = new Image();
  img.src = objectUrl;

  await new Promise((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load image for compression"));
  });

  try {
    let { naturalWidth: width, naturalHeight: height } = img;

    // If image is already smaller than maxWidth, keep original dimensions
    if (width > maxWidth) {
      const ratio = maxWidth / width;
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // Draw the resized image into the canvas
    ctx.drawImage(img, 0, 0, width, height);

    // Convert canvas to Blob (JPEG)
    const blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/jpeg", Math.max(0, Math.min(1, quality)));
    });

    if (!blob) throw new Error("Image compression failed (toBlob returned null)");

    // Build a new filename (use original base name, force .jpg extension)
    const originalName = file.name || "image";
    const base = originalName.includes(".") ? originalName.replace(/\.[^/.]+$/, "") : originalName;
    const newName = `${base}.jpg`;

    const compressedFile = new File([blob], newName, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });

    return compressedFile;
  } finally {
    // Cleanup object URL
    URL.revokeObjectURL(objectUrl);
  }
}

export default compressImage;
