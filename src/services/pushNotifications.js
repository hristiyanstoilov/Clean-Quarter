import supabase from "./supabase.js";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

/**
 * Convert a base64url string to Uint8Array (required by pushManager.subscribe)
 */
export function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/**
 * Get current push notification permission + subscription status.
 * @returns {{ permission: NotificationPermission, subscribed: boolean }}
 */
export async function getPushStatus() {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return { permission: "unsupported", subscribed: false };
  }

  const permission = Notification.permission;

  if (permission !== "granted") {
    return { permission, subscribed: false };
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return { permission, subscribed: !!sub };
  } catch {
    return { permission, subscribed: false };
  }
}

/**
 * Subscribe the current user to push notifications.
 * Requests permission, subscribes via pushManager, saves to DB.
 * @param {string} userId - Supabase user id
 * @returns {{ success: boolean, error?: string }}
 */
export async function subscribeToPush(userId) {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return { success: false, error: "unsupported" };
  }

  if (!VAPID_PUBLIC_KEY) {
    return { success: false, error: "vapid_missing" };
  }

  // Request permission
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { success: false, error: "denied" };
  }

  try {
    const reg = await navigator.serviceWorker.ready;

    // Unsubscribe any existing subscription first (avoids duplicate endpoint)
    const existing = await reg.pushManager.getSubscription();
    if (existing) await existing.unsubscribe();

    // Subscribe
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    const json = subscription.toJSON();

    // Save to DB
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: userId,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      },
      { onConflict: "endpoint" }
    );

    if (error) throw error;

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || "subscribe_failed" };
  }
}

/**
 * Unsubscribe the current user from push notifications.
 * Removes from pushManager and deletes from DB.
 * @param {string} userId - Supabase user id
 * @returns {{ success: boolean, error?: string }}
 */
export async function unsubscribeFromPush(userId) {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();

    if (sub) {
      await sub.unsubscribe();

      // Remove from DB
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", userId)
        .eq("endpoint", sub.endpoint);
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || "unsubscribe_failed" };
  }
}

/**
 * Call the send-push-notification Edge Function to deliver a push to a user.
 * Safe to call — fails silently if user has no subscription.
 * @param {{ userId: string, title: string, body: string, url?: string }} opts
 */
export async function sendPushToUser({ userId, title, body, url = "/dashboard" }) {
  try {
    const { error } = await supabase.functions.invoke("send-push-notification", {
      body: { user_id: userId, title, body, url },
    });
    if (error) throw error;
  } catch (err) {
    // Non-critical: push delivery failure must not break the main flow
    console.warn("[push] Failed to send push notification:", err?.message);
  }
}
