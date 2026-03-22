/**
 * HIBP (Have I Been Pwned) — k-anonymity password breach check.
 *
 * Uses the Pwned Passwords Range API:
 *   1. SHA-1 hash the password
 *   2. Send only the first 5 hex chars (prefix) — never the full hash
 *   3. HIBP returns all suffix hashes that start with that prefix
 *   4. Check locally if the remaining 35 chars appear in the response
 *
 * Privacy: the plain password and full hash never leave the browser.
 */

/**
 * Returns the number of times the password has appeared in known data breaches.
 * Returns 0 if the password is safe or if the API call fails (fail-open).
 *
 * @param {string} password
 * @returns {Promise<number>}
 */
export async function getPwnedCount(password) {
  try {
    const hash = await sha1Hex(password);
    const prefix = hash.slice(0, 5).toUpperCase();
    const suffix = hash.slice(5).toUpperCase();

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" }, // prevents traffic-analysis side-channels
    });

    if (!res.ok) return 0; // fail-open — never block on network error

    const text = await res.text();
    for (const line of text.split("\r\n")) {
      const [lineSuffix, count] = line.split(":");
      if (lineSuffix === suffix) return parseInt(count, 10);
    }
    return 0;
  } catch {
    return 0; // fail-open — network unavailable, ad blocker, etc.
  }
}

/**
 * Returns true when the password appears in at least one breach.
 *
 * @param {string} password
 * @returns {Promise<boolean>}
 */
export async function isPasswordPwned(password) {
  return (await getPwnedCount(password)) > 0;
}

// ── internal ──────────────────────────────────────────────────────────────────

async function sha1Hex(str) {
  const encoded = new TextEncoder().encode(str);
  const buffer = await crypto.subtle.digest("SHA-1", encoded);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
