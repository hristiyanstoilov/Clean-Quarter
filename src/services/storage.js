// Named exports for testability (mock implementations for integration tests)
export async function uploadFile(file, filename) {
  return 'https://mocked-storage-url/' + filename;
}
export async function deleteFile(filename) {
  return true;
}
import supabase from "./supabase.js";
import { handleError } from "../utils/helpers.js";

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

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileName = `${timestamp}-${randomString}-${file.name}`;
    const filePath = `${folderName}/${fileName}`;

    // Upload file to Supabase Storage
    const { error } = await supabase.storage.from("campaign-photos").upload(filePath, file);

    if (error) throw new Error(`Upload failed: ${error.message}`);

    // Get public URL
    const { data: publicUrlData } = supabase.storage.from("campaign-photos").getPublicUrl(filePath);

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
  } catch (error) {
    await handleError("deleteCampaignPhoto", error, "Failed to delete photo. Please try again.");
    throw error;
  }
}
