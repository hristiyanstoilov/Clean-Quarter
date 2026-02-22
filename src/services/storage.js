import supabase from "./supabase.js";
import { handleError } from "../utils/helpers.js";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Upload an image to the 'campaign-photos' bucket
 * @param {File} file - The image file to upload
 * @param {string} folderName - Optional folder name inside the bucket (e.g., 'before', 'after')
 * @returns {Promise<string>} The public URL of the uploaded image
 */
export async function uploadCampaignPhoto(file, folderName = "photos") {
  try {
    if (!file) {
      throw new Error("No file provided");
    }
    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error("Invalid file type. Allowed: JPEG, PNG, WebP");
    }
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error("File too large. Maximum size: 5MB");
    }
    // Generate unique filename with timestamp and sanitized name
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const safeName = (file.name || "photo").replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 50);
    const fileName = `${timestamp}-${randomString}-${safeName}`;
    const filePath = `${folderName}/${fileName}`;
    // Upload file to Supabase Storage
    const { error } = await supabase.storage.from("campaign-photos").upload(filePath, file);
    if (error) throw new Error(`Upload failed: ${error.message}`);
    // Get public URL
    const { data: publicUrlData } = supabase.storage.from("campaign-photos").getPublicUrl(filePath);
    if (!publicUrlData || !publicUrlData.publicUrl) return undefined;
    return publicUrlData.publicUrl;
  } catch (error) {
    await handleError("uploadCampaignPhoto", error, "Failed to upload photo. Please try again.");
    throw error;
  }
}

/**
 * Delete an image from the 'campaign-photos' bucket
 * @param {string} filePath - The file path to delete (e.g., 'photos/1234567-abc123-image.jpg')
 * @returns {Promise<void>}
 */
export async function deleteCampaignPhoto(filePath) {
  try {
    const { error } = await supabase.storage.from("campaign-photos").remove([filePath]);
    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
    return true;
  } catch (error) {
    await handleError("deleteCampaignPhoto", error, "Failed to delete photo. Please try again.");
    throw error;
  }
}

/**
 * Upload a profile avatar to the 'avatars' bucket
 * @param {File} file - The image file to upload
 * @param {string} userId - The user's UUID
 * @returns {Promise<string>} The public URL of the uploaded avatar
 */
export async function uploadAvatar(file, userId) {
  try {
    if (!file) {
      throw new Error("No file provided");
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error("Invalid file type. Allowed: JPEG, PNG, WebP");
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error("File too large. Maximum size: 5MB");
    }
    const ext = file.name?.split(".").pop() || "jpg";
    const fileName = `${userId}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(fileName, file, {
      upsert: true,
    });
    if (error) throw new Error(`Upload failed: ${error.message}`);
    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
    if (!publicUrlData || !publicUrlData.publicUrl) return undefined;
    return publicUrlData.publicUrl;
  } catch (error) {
    await handleError("uploadAvatar", error, "Failed to upload avatar. Please try again.");
    throw error;
  }
}

export default {
  uploadCampaignPhoto,
  deleteCampaignPhoto,
  uploadAvatar,
};
