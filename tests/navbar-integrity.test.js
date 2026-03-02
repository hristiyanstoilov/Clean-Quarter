/**
 * Navbar Integrity Tests
 *
 * Guards against the class of HTML bugs where:
 *  - navbar-nav is accidentally changed from <ul> to <div>
 *  - nav items use <div class="nav-item"> instead of <li class="nav-item">
 *  - the language selector or logout mechanism is missing
 *  - the admin nav item is absent from pages that need it
 *
 * These bugs cause Bootstrap's navbar to break visually and can make
 * JS selectors (getElementById) fail at runtime.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, it, expect } from "vitest";

const ROOT = resolve(process.cwd());

const pages = [
  {
    name: "Dashboard",
    html: "src/pages/dashboard.html",
    hasAdminNavItem: true,
  },
  {
    name: "Create Campaign",
    html: "src/pages/create-campaign.html",
    hasAdminNavItem: true,
  },
  {
    name: "Campaign Detail",
    html: "src/pages/campaign-detail.html",
    hasAdminNavItem: true,
  },
  {
    name: "Profile",
    html: "src/pages/profile.html",
    hasAdminNavItem: true,
  },
  {
    name: "Rewards",
    html: "src/pages/rewards.html",
    hasAdminNavItem: true,
  },
  {
    name: "Admin",
    html: "src/pages/admin.html",
    hasAdminNavItem: false, // Admin page itself doesn't need the admin nav item
  },
];

describe("Navbar Integrity", () => {
  for (const { name, html: htmlPath, hasAdminNavItem } of pages) {
    describe(name, () => {
      const html = readFileSync(resolve(ROOT, htmlPath), "utf-8");
      // Extract just the <nav>…</nav> block for stricter scoped checks
      const navBlock = html.match(/<nav[\s\S]*?<\/nav>/)?.[0] ?? "";

      it("has <nav class=\"navbar\">", () => {
        expect(html).toMatch(/class="navbar\b/);
      });

      it("navbar-nav is a <ul>, not a <div>", () => {
        // Must have <ul class="navbar-nav ...">
        expect(navBlock).toMatch(/<ul[^>]*class="[^"]*navbar-nav/);
        // Must NOT have <div class="navbar-nav ..."> or <div class="ms-auto ...">
        expect(navBlock).not.toMatch(/<div[^>]*class="[^"]*navbar-nav/);
        expect(navBlock).not.toMatch(/<div[^>]*class="[^"]*ms-auto/);
      });

      it("nav items are <li>, not <div>", () => {
        // Must have at least one <li class="nav-item">
        expect(navBlock).toMatch(/<li[^>]*class="[^"]*nav-item/);
        // Must NOT have <div class="nav-item">
        expect(navBlock).not.toMatch(/<div[^>]*class="[^"]*nav-item/);
      });

      it("has .navbar-brand link", () => {
        expect(navBlock).toMatch(/class="navbar-brand"/);
      });

      it("has #languageSelector inside navbar", () => {
        expect(navBlock).toMatch(/id="languageSelector"/);
      });

      it("has a logout mechanism (id=\"logoutBtn\" or onclick=\"handleLogout()\")", () => {
        const hasLogoutBtn = /id="logoutBtn"/.test(navBlock);
        const hasHandleLogout = /onclick="handleLogout\(\)"/.test(navBlock);
        expect(hasLogoutBtn || hasHandleLogout).toBe(true);
      });

      if (hasAdminNavItem) {
        it("has #adminNavItem (hidden by default)", () => {
          expect(navBlock).toMatch(/id="adminNavItem"/);
        });
      }
    });
  }
});
