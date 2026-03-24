/**
 * Profile validation helpers
 */

import { NEIGHBORHOODS } from "../utils/constants.js";

export function validateUsername(username) {
  if (!username || username.length < 3) {
    return { valid: false, error: "Username must be at least 3 characters" };
  }
  if (username.length > 30) {
    return { valid: false, error: "Username cannot exceed 30 characters" };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return {
      valid: false,
      error: "Username can only contain letters, numbers, hyphens and underscores",
    };
  }
  return { valid: true };
}

export function validateNeighborhood(neighborhood) {
  if (!NEIGHBORHOODS.includes(neighborhood)) {
    return { valid: false, error: "Invalid neighborhood selected" };
  }
  return { valid: true };
}
