// Tests for forgot-password and reset-password flows.
// Pure logic is tested via mirrored helpers — no DOM or Supabase needed.

import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(process.cwd());

// ---------------------------------------------------------------------------
// Forgot password — logic mirrors forgot-password.js
// ---------------------------------------------------------------------------

async function sendResetEmailMock(resetFn, email) {
  if (!email || !email.trim()) return { sent: false, error: "empty_email" };
  await resetFn(email);
  // Always return success (never reveal if email exists)
  return { sent: true };
}

describe("sendResetEmail logic", () => {
  it("returns sent:false for empty email", async () => {
    const fn = vi.fn();
    const result = await sendResetEmailMock(fn, "");
    expect(result.sent).toBe(false);
    expect(result.error).toBe("empty_email");
    expect(fn).not.toHaveBeenCalled();
  });

  it("calls resetFn and returns sent:true for valid email", async () => {
    const fn = vi.fn().mockResolvedValue({});
    const result = await sendResetEmailMock(fn, "user@test.com");
    expect(fn).toHaveBeenCalledWith("user@test.com");
    expect(result.sent).toBe(true);
  });

  it("returns sent:true even when resetFn throws (security: no email enumeration)", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("User not found"));
    // The real forgot-password.js swallows Supabase errors and always shows success.
    // We mirror that by not surfacing the error:
    const result = await sendResetEmailMock(async (email) => {
      try { await fn(email); } catch { /* swallow */ }
    }, "unknown@test.com");
    expect(result.sent).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Reset password — validation logic mirrors reset-password.js
// ---------------------------------------------------------------------------

function validatePasswords(newPassword, confirmPassword) {
  if (newPassword !== confirmPassword) return { valid: false, error: "mismatch" };
  if (newPassword.length < 8)          return { valid: false, error: "too_short" };
  if (!/[A-Z]/.test(newPassword))      return { valid: false, error: "no_uppercase" };
  if (!/[a-z]/.test(newPassword))      return { valid: false, error: "no_lowercase" };
  if (!/[0-9]/.test(newPassword))      return { valid: false, error: "no_digit" };
  return { valid: true };
}

describe("validatePasswords", () => {
  it("fails when passwords do not match", () => {
    const r = validatePasswords("Abcde1!", "Different1!");
    expect(r.valid).toBe(false);
    expect(r.error).toBe("mismatch");
  });

  it("fails when password is too short (< 8 chars)", () => {
    const r = validatePasswords("Ab1!", "Ab1!");
    expect(r.valid).toBe(false);
    expect(r.error).toBe("too_short");
  });

  it("fails when password has no uppercase letter", () => {
    const r = validatePasswords("abcde123", "abcde123");
    expect(r.valid).toBe(false);
    expect(r.error).toBe("no_uppercase");
  });

  it("fails when password has no lowercase letter", () => {
    const r = validatePasswords("ABCDE123", "ABCDE123");
    expect(r.valid).toBe(false);
    expect(r.error).toBe("no_lowercase");
  });

  it("fails when password has no digit", () => {
    const r = validatePasswords("Abcdefgh", "Abcdefgh");
    expect(r.valid).toBe(false);
    expect(r.error).toBe("no_digit");
  });

  it("passes with a strong valid password", () => {
    const r = validatePasswords("Secure123", "Secure123");
    expect(r.valid).toBe(true);
    expect(r.error).toBeUndefined();
  });

  it("passes with special characters in the password", () => {
    const r = validatePasswords("P@ssw0rd!", "P@ssw0rd!");
    expect(r.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// HTML integrity — forgot-password.html and reset-password.html
// ---------------------------------------------------------------------------

describe("forgot-password.html integrity", () => {
  const html = readFileSync(resolve(ROOT, "src/pages/forgot-password.html"), "utf-8");

  it("loads the correct script (forgot-password.js)", () => {
    expect(html).toContain("../scripts/forgot-password.js");
    expect(html).not.toContain("modules/forgotPasswordModule");
  });

  it("back link points to / (not relative ../../index.html)", () => {
    expect(html).toContain('href="/"');
    expect(html).not.toContain('href="../../index.html"');
  });

  it("form has id=forgotPasswordForm", () => {
    expect(html).toContain('id="forgotPasswordForm"');
  });

  it("email input is present and required", () => {
    expect(html).toContain('id="email"');
    expect(html).toContain("required");
  });
});

describe("reset-password.html integrity", () => {
  const html = readFileSync(resolve(ROOT, "src/pages/reset-password.html"), "utf-8");

  it("loads the correct script (reset-password.js)", () => {
    expect(html).toContain("../scripts/reset-password.js");
    expect(html).not.toContain("modules/resetPasswordModule");
  });

  it("back link points to / (not relative ../../index.html)", () => {
    expect(html).toContain('href="/"');
    expect(html).not.toContain('href="../../index.html"');
  });

  it("form has id=resetPasswordForm", () => {
    expect(html).toContain('id="resetPasswordForm"');
  });

  it("has newPassword and confirmPassword inputs", () => {
    expect(html).toContain('id="newPassword"');
    expect(html).toContain('id="confirmPassword"');
  });
});

// ---------------------------------------------------------------------------
// index.html — Forgot Password link
// ---------------------------------------------------------------------------

describe("index.html — Forgot Password link", () => {
  const html = readFileSync(resolve(ROOT, "index.html"), "utf-8");

  it("Forgot Password link points to /forgot-password", () => {
    expect(html).toContain('href="/forgot-password"');
  });

  it("Forgot Password link does NOT use onclick handler", () => {
    // Should navigate directly, not call handleForgotPassword()
    expect(html).not.toContain('onclick="handleForgotPassword');
  });
});

// ---------------------------------------------------------------------------
// netlify.toml — redirects exist
// ---------------------------------------------------------------------------

describe("netlify.toml — forgot/reset redirects", () => {
  const toml = readFileSync(resolve(ROOT, "netlify.toml"), "utf-8");

  it('has redirect for /forgot-password → forgot-password.html', () => {
    expect(toml).toContain('from = "/forgot-password"');
    expect(toml).toContain('to = "/src/pages/forgot-password.html"');
  });

  it('has redirect for /reset-password → reset-password.html', () => {
    expect(toml).toContain('from = "/reset-password"');
    expect(toml).toContain('to = "/src/pages/reset-password.html"');
  });
});
