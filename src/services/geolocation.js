/**
 * Geolocation helper
 * Exposes a promise-based wrapper around navigator.geolocation.getCurrentPosition
 */
export function getCurrentPositionPromise(options = {}) {
  return new Promise((resolve, reject) => {
    if (
      typeof navigator === "undefined" ||
      !navigator.geolocation ||
      !navigator.geolocation.getCurrentPosition
    ) {
      console.error("❌ Geolocation API not available");
      const err = new Error("Geolocation not available");
      err.code = "GEOLOCATION_NOT_AVAILABLE";
      return reject(err);
    }

    console.log("📍 Attempting to get current position...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log("✅ Position obtained successfully:", pos.coords);
        resolve(pos);
      },
      (err) => {
        console.error("❌ Geolocation error:", err.code, err.message);

        // Check for specific error codes
        let errorMsg = err.message;
        let errorCode = err.code;

        // Fallback for common error messages
        if (!errorMsg || errorMsg.includes("disabled") || errorMsg.includes("permission")) {
          if (err.code === 1) {
            errorMsg = "PERMISSION_DENIED: User denied geolocation access";
            errorCode = "PERMISSION_DENIED";
          } else if (err.code === 2) {
            errorMsg = "POSITION_UNAVAILABLE: Unable to retrieve geolocation";
            errorCode = "POSITION_UNAVAILABLE";
          } else if (err.code === 3) {
            errorMsg = "TIMEOUT: Geolocation request took too long";
            errorCode = "TIMEOUT";
          } else {
            errorMsg =
              "PERMISSIONS_POLICY_BLOCKED: Geolocation has been disabled by browser permissions policy";
            errorCode = "PERMISSIONS_POLICY_BLOCKED";
          }
        }

        const error = new Error(errorMsg);
        error.code = errorCode;
        error.originalError = err;
        reject(error);
      },
      options
    );
  });
}

export default {
  getCurrentPositionPromise,
};
