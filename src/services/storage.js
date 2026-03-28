import supabase from "./supabase.js";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Upload an image to the 'campaign-photos' bucket
 * @param {File} file - The image file to upload
 * @param {string} folderName - Optional folder name inside the bucket (e.g., 'before', 'after')
 * @returns {Promise<{url: string, path: string}>} The public URL and storage path of the uploaded image
 */
export async function uploadCampaignPhoto(file, folderName = "photos") {
  if (!file) {
    throw new Error("[uploadCampaignPhoto] No file provided");
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("[uploadCampaignPhoto] Invalid file type. Allowed: JPEG, PNG, WebP");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("[uploadCampaignPhoto] File too large. Maximum size: 5MB");
  }
  // Generate unique filename with cryptographic UUID and sanitized name
  const safeName = (file.name || "photo").replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 50);
  const fileName = `${crypto.randomUUID()}-${safeName}`;
  const filePath = `${folderName}/${fileName}`;
  const { error } = await supabase.storage.from("campaign-photos").upload(filePath, file);
  if (error) throw new Error(`[uploadCampaignPhoto] Upload failed: ${error.message}`);
  const { data: publicUrlData } = supabase.storage.from("campaign-photos").getPublicUrl(filePath);
  if (!publicUrlData?.publicUrl)
    throw new Error("[uploadCampaignPhoto] Upload succeeded but URL is missing");
  // Return both url and path so callers can delete the file if a subsequent operation fails
  return { url: publicUrlData.publicUrl, path: filePath };
}

/**
 * Delete an image from the 'campaign-photos' bucket
 * @param {string} filePath - The file path to delete (e.g., 'photos/1234567-abc123-image.jpg')
 * @returns {Promise<void>}
 */
export async function deleteCampaignPhoto(filePath) {
  const { error } = await supabase.storage.from("campaign-photos").remove([filePath]);
  if (error) throw new Error(`[deleteCampaignPhoto] Delete failed: ${error.message}`);
  return true;
}

/**
 * Upload a profile avatar to the 'avatars' bucket
 * @param {File} file - The image file to upload
 * @param {string} userId - The user's UUID
 * @returns {Promise<string>} The public URL of the uploaded avatar
 */
export async function uploadAvatar(file, userId) {
  if (!file) throw new Error("[uploadAvatar] No file provided");
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("[uploadAvatar] Invalid file type. Allowed: JPEG, PNG, WebP");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("[uploadAvatar] File too large. Maximum size: 5MB");
  }
  const ext = file.name?.includes(".") ? file.name.split(".").pop() : "jpg";
  const fileName = `${userId}/${userId}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("avatars").upload(fileName, file, { upsert: true });
  if (error) throw new Error(`[uploadAvatar] Upload failed: ${error.message}`);
  const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
  if (!publicUrlData?.publicUrl)
    throw new Error("[uploadAvatar] Upload succeeded but URL is missing");
  return publicUrlData.publicUrl;
}

export default {
  uploadCampaignPhoto,
  deleteCampaignPhoto,
  uploadAvatar,
};
