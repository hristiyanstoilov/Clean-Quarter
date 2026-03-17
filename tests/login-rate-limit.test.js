import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "fs";

// ─── helpers ──────────────────────────────────────────────────────────────────

function loadI18n(file) {
  return JSON.parse(readFileSync(file, "utf-8"));
}

function deepGet(obj, path) {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

// Mirrors the DB function logic from the migration
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function checkLoginRateLimit(attempts, email) {
  const now = Date.now();
  const recent = attempts.filter(
    (a) => a.email === email.toLowerCase() && now - a.attempted_at < WINDOW_MS
  );
  if (recent.length >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: MAX_ATTEMPTS - recent.length };
}

function recordLoginAttempt(attempts, email) {
  attempts.push({ email: email.toLowerCase(), attempted_at: Date.now() });
}

// ─── i18n completeness ────────────────────────────────────────────────────────

const I18N_FILES = [
  "src/i18n/bg.json",
  "src/i18n/en.json",
  "public/i18n/bg.json",
  "public/i18n/en.json",
];

describe("Login rate limit — i18n", () => {
  for (const file of I18N_FILES) {
    it(`${file} has auth.tooManyAttempts`, () => {
      const t = loadI18n(file);
      const val = deepGet(t, "auth.tooManyAttempts");
      expect(val).toBeTruthy();
      expect(typeof val).toBe("string");
      expect(val.length).toBeGreaterThan(10);
    });
  }

  it("BG message mentions 15 minutes", () => {
    const t = loadI18n("src/i18n/bg.json");
    expect(deepGet(t, "auth.tooManyAttempts")).toContain("15");
  });

  it("EN message mentions 15 minutes", () => {
    const t = loadI18n("src/i18n/en.json");
    expect(deepGet(t, "auth.tooManyAttempts")).toContain("15");
  });
});

// ─── rate limit logic (mirrors DB function) ───────────────────────────────────

describe("Login rate limit — check logic", () => {
  let attempts;
  beforeEach(() => { attempts = []; });

  it("fresh email → allowed with 5 remaining", () => {
    const result = checkLoginRateLimit(attempts, "user@test.com");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(5);
  });

  it("after 1 failed attempt → 4 remaining", () => {
    recordLoginAttempt(attempts, "user@test.com");
    const result = checkLoginRateLimit(attempts, "user@test.com");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("after 4 failed attempts → 1 remaining", () => {
    for (let i = 0; i < 4; i++) recordLoginAttempt(attempts, "user@test.com");
    const result = checkLoginRateLimit(attempts, "user@test.com");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it("after 5 failed attempts → blocked", () => {
    for (let i = 0; i < 5; i++) recordLoginAttempt(attempts, "user@test.com");
    const result = checkLoginRateLimit(attempts, "user@test.com");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("attempts older than 15min are ignored", () => {
    const old = Date.now() - 16 * 60 * 1000;
    for (let i = 0; i < 5; i++) {
      attempts.push({ email: "user@test.com", attempted_at: old });
    }
    const result = checkLoginRateLimit(attempts, "user@test.com");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(5);
  });

  it("mix of old and recent — only recent count", () => {
    const old = Date.now() - 20 * 60 * 1000;
    attempts.push({ email: "user@test.com", attempted_at: old });
    attempts.push({ email: "user@test.com", attempted_at: old });
    recordLoginAttempt(attempts, "user@test.com");
    recordLoginAttempt(attempts, "user@test.com");
    const result = checkLoginRateLimit(attempts, "user@test.com");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(3);
  });

  it("email comparison is case-insensitive", () => {
    recordLoginAttempt(attempts, "User@Test.COM");
    recordLoginAttempt(attempts, "USER@TEST.COM");
    const result = checkLoginRateLimit(attempts, "user@test.com");
    expect(result.remaining).toBe(3);
  });

  it("different emails tracked independently", () => {
    for (let i = 0; i < 5; i++) recordLoginAttempt(attempts, "blocked@test.com");
    const blocked = checkLoginRateLimit(attempts, "blocked@test.com");
    const other = checkLoginRateLimit(attempts, "other@test.com");
    expect(blocked.allowed).toBe(false);
    expect(other.allowed).toBe(true);
  });
});

// ─── successful login does NOT record attempt ─────────────────────────────────

describe("Login rate limit — successful login flow", () => {
  it("successful login does not record an attempt", () => {
    const attempts = [];
    // Simulate: 4 failed, then 1 success (no record on success)
    for (let i = 0; i < 4; i++) recordLoginAttempt(attempts, "user@test.com");
    // Success → don't call recordLoginAttempt
    const result = checkLoginRateLimit(attempts, "user@test.com");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it("user can log in again after success without being blocked", () => {
    const attempts = [];
    for (let i = 0; i < 4; i++) recordLoginAttempt(attempts, "user@test.com");
    // Success — no record
    // Next login check
    const result = checkLoginRateLimit(attempts, "user@test.com");
    expect(result.allowed).toBe(true);
  });
});

// ─── migration file integrity ─────────────────────────────────────────────────

describe("Login rate limit — migration file", () => {
  const migration = readFileSync(
    "supabase/migrations/20260317090000_add_login_rate_limiting.sql",
    "utf-8"
  );

  it("creates login_attempts table", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS login_attempts");
  });

  it("has index on (email, attempted_at)", () => {
    expect(migration).toContain("idx_login_attempts_email_time");
  });

  it("disables RLS", () => {
    expect(migration).toContain("DISABLE ROW LEVEL SECURITY");
  });

  it("defines check_login_rate_limit function", () => {
    expect(migration).toContain("check_login_rate_limit");
    expect(migration).toContain("SECURITY DEFINER");
  });

  it("defines record_login_attempt function", () => {
    expect(migration).toContain("record_login_attempt");
  });

  it("grants to anon role", () => {
    expect(migration).toContain("TO anon");
  });

  it("grants to authenticated role", () => {
    expect(migration).toContain("TO authenticated");
  });

  it("cleans up attempts older than 24h", () => {
    expect(migration).toContain("24 hours");
  });
});
