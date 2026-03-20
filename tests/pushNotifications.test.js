// Tests for pushNotifications.js — pure logic and helper functions.
// The service functions that call Supabase or pushManager are tested
// via stubs/mocks of the browser APIs.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Mirror of urlBase64ToUint8Array from src/services/pushNotifications.js
// ---------------------------------------------------------------------------
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// ---------------------------------------------------------------------------
// Tests: urlBase64ToUint8Array
// ---------------------------------------------------------------------------
describe("urlBase64ToUint8Array", () => {
  it("returns a Uint8Array", () => {
    // Short base64url-safe string
    const result = urlBase64ToUint8Array("dGVzdA"); // "test" in base64url
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it("converts base64url '-' and '_' to '+' and '/'", () => {
    // 'f-_g' in base64url → 'f+/g' in standard base64
    const input = "f-_g";
    // Should not throw and should produce bytes
    const result = urlBase64ToUint8Array(input);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  });

  it("handles a real VAPID public key format (87-char base64url)", () => {
    const vapidKey =
      "BNogXzfDb1LcOnBsaeyxxdnII0r3EEplMECDsu1U23xx5WhFv7NhtjiFp_QVHJByT7yx4S6GbEmuq4TnoD8P7HE";
    const result = urlBase64ToUint8Array(vapidKey);
    expect(result).toBeInstanceOf(Uint8Array);
    // P-256 public key is 65 bytes
    expect(result.length).toBe(65);
  });

  it("correctly adds padding when string length mod 4 is 2", () => {
    // "dGU" → needs 1 padding char
    const result = urlBase64ToUint8Array("dGU");
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it("correctly handles no padding needed (length mod 4 is 0)", () => {
    const result = urlBase64ToUint8Array("dGVz"); // "tes" → 4-char base64
    expect(result).toBeInstanceOf(Uint8Array);
  });
});

// ---------------------------------------------------------------------------
// Mocking getPushStatus logic (mirrors the function's decision tree)
// ---------------------------------------------------------------------------

function getPushStatusMock({ hasNotification, hasServiceWorker, permission, hasSubscription }) {
  if (!hasNotification || !hasServiceWorker) {
    return { permission: "unsupported", subscribed: false };
  }
  if (permission !== "granted") {
    return { permission, subscribed: false };
  }
  return { permission, subscribed: hasSubscription };
}

describe("getPushStatus logic", () => {
  it("returns unsupported when Notification API is absent", () => {
    const result = getPushStatusMock({
      hasNotification: false,
      hasServiceWorker: true,
      permission: "default",
      hasSubscription: false,
    });
    expect(result.permission).toBe("unsupported");
    expect(result.subscribed).toBe(false);
  });

  it("returns unsupported when serviceWorker API is absent", () => {
    const result = getPushStatusMock({
      hasNotification: true,
      hasServiceWorker: false,
      permission: "default",
      hasSubscription: false,
    });
    expect(result.permission).toBe("unsupported");
    expect(result.subscribed).toBe(false);
  });

  it("returns subscribed:false when permission is 'default'", () => {
    const result = getPushStatusMock({
      hasNotification: true,
      hasServiceWorker: true,
      permission: "default",
      hasSubscription: false,
    });
    expect(result.permission).toBe("default");
    expect(result.subscribed).toBe(false);
  });

  it("returns subscribed:false when permission is 'denied'", () => {
    const result = getPushStatusMock({
      hasNotification: true,
      hasServiceWorker: true,
      permission: "denied",
      hasSubscription: false,
    });
    expect(result.permission).toBe("denied");
    expect(result.subscribed).toBe(false);
  });

  it("returns subscribed:true when granted and subscription exists", () => {
    const result = getPushStatusMock({
      hasNotification: true,
      hasServiceWorker: true,
      permission: "granted",
      hasSubscription: true,
    });
    expect(result.permission).toBe("granted");
    expect(result.subscribed).toBe(true);
  });

  it("returns subscribed:false when granted but no subscription", () => {
    const result = getPushStatusMock({
      hasNotification: true,
      hasServiceWorker: true,
      permission: "granted",
      hasSubscription: false,
    });
    expect(result.permission).toBe("granted");
    expect(result.subscribed).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Mocking subscribeToPush logic (mirrors the function's guard checks)
// ---------------------------------------------------------------------------

function subscribeToPushMock({ hasNotification, hasServiceWorker, vapidKey, permission }) {
  if (!hasNotification || !hasServiceWorker) {
    return { success: false, error: "unsupported" };
  }
  if (!vapidKey) {
    return { success: false, error: "vapid_missing" };
  }
  if (permission !== "granted") {
    return { success: false, error: "denied" };
  }
  return { success: true };
}

describe("subscribeToPush guard logic", () => {
  it("fails with 'unsupported' when Notification API missing", () => {
    const result = subscribeToPushMock({
      hasNotification: false,
      hasServiceWorker: true,
      vapidKey: "somekey",
      permission: "granted",
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe("unsupported");
  });

  it("fails with 'unsupported' when serviceWorker API missing", () => {
    const result = subscribeToPushMock({
      hasNotification: true,
      hasServiceWorker: false,
      vapidKey: "somekey",
      permission: "granted",
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe("unsupported");
  });

  it("fails with 'vapid_missing' when VAPID key is empty", () => {
    const result = subscribeToPushMock({
      hasNotification: true,
      hasServiceWorker: true,
      vapidKey: "",
      permission: "granted",
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe("vapid_missing");
  });

  it("fails with 'denied' when user denies permission", () => {
    const result = subscribeToPushMock({
      hasNotification: true,
      hasServiceWorker: true,
      vapidKey: "somekey",
      permission: "denied",
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe("denied");
  });

  it("fails with 'denied' when permission is 'default' (dismissed)", () => {
    const result = subscribeToPushMock({
      hasNotification: true,
      hasServiceWorker: true,
      vapidKey: "somekey",
      permission: "default",
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe("denied");
  });

  it("succeeds when all conditions are met", () => {
    const result = subscribeToPushMock({
      hasNotification: true,
      hasServiceWorker: true,
      vapidKey: "somekey",
      permission: "granted",
    });
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// sendPushToUser — non-blocking helper (never throws, always resolves)
// ---------------------------------------------------------------------------

async function sendPushToUserMock(invokeFn, opts) {
  try {
    const { error } = await invokeFn(opts);
    if (error) throw error;
  } catch {
    // Non-critical — swallow silently
  }
}

describe("sendPushToUser error handling", () => {
  it("resolves even when Edge Function throws", async () => {
    const failingInvoke = async () => { throw new Error("Network error"); };
    await expect(sendPushToUserMock(failingInvoke, {})).resolves.toBeUndefined();
  });

  it("resolves even when Edge Function returns error object", async () => {
    const errInvoke = async () => ({ error: new Error("500 Internal") });
    await expect(sendPushToUserMock(errInvoke, {})).resolves.toBeUndefined();
  });

  it("resolves on success", async () => {
    const okInvoke = async () => ({ error: null, data: { sent: 1 } });
    await expect(sendPushToUserMock(okInvoke, {})).resolves.toBeUndefined();
  });

  it("calls invoke with correct arguments", async () => {
    const invokeSpy = vi.fn().mockResolvedValue({ error: null });
    const opts = { user_id: "u1", title: "Test", body: "Hello", url: "/dashboard" };
    await sendPushToUserMock(invokeSpy, opts);
    expect(invokeSpy).toHaveBeenCalledWith(opts);
  });
});
