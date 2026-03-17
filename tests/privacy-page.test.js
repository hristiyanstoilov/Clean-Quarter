import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";

const privacyHtml = readFileSync("src/pages/privacy.html", "utf-8");
const indexHtml = readFileSync("index.html", "utf-8");
const netlifyToml = readFileSync("netlify.toml", "utf-8");
const viteConfig = readFileSync("vite.config.js", "utf-8");

describe("Privacy page — file structure", () => {
  it("privacy.html exists and is not empty", () => {
    expect(privacyHtml.length).toBeGreaterThan(100);
  });

  it("privacy.html has correct DOCTYPE", () => {
    expect(privacyHtml.toLowerCase()).toContain("<!doctype html>");
  });

  it("privacy.html has a <title>", () => {
    expect(privacyHtml).toMatch(/<title>.+<\/title>/);
  });

  it("privacy.html contains Terms content (BG)", () => {
    expect(privacyHtml).toContain("Общи условия");
  });

  it("privacy.html contains Privacy Policy content (BG)", () => {
    expect(privacyHtml).toContain("Поверителност");
  });

  it("privacy.html contains GDPR mention", () => {
    expect(privacyHtml.toLowerCase()).toMatch(/gdpr|регламент/i);
  });
});

describe("Privacy page — routing", () => {
  it("netlify.toml has /privacy redirect", () => {
    expect(netlifyToml).toContain('from = "/privacy"');
    expect(netlifyToml).toContain('to = "/src/pages/privacy.html"');
  });

  it("vite.config.js includes privacy as build entry", () => {
    expect(viteConfig).toContain("privacy");
    expect(viteConfig).toContain("privacy.html");
  });
});

describe("Privacy page — registration link", () => {
  it("index.html links to /privacy (not a modal)", () => {
    expect(indexHtml).toContain('href="/privacy"');
  });

  it("index.html does NOT use showTermsModal for the privacy link", () => {
    expect(indexHtml).not.toContain('onclick="showTermsModal(event)"');
  });

  it("privacy link opens in new tab", () => {
    expect(indexHtml).toContain('href="/privacy" target="_blank"');
  });
});
