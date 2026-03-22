// 📱 MOBILE TOUCH TESTS — iPhone 13 viewport (390×844)
// Verifies that the app is fully usable on a small touch screen.
// Covers: hamburger menu, no horizontal scroll, language selector, campaign cards,
//         file input tap target, and form field usability.

describe("Mobile touch — iPhone 13 (390×844)", () => {
  beforeEach(() => {
    cy.viewport(390, 844);
  });

  // ── Login page ──────────────────────────────────────────────────────────────

  describe("Login page", () => {
    beforeEach(() => cy.visit("/"));

    it("no horizontal scroll on login page", () => {
      cy.document().then((doc) => {
        expect(doc.documentElement.scrollWidth).to.be.lte(390);
      });
    });

    it("email and password fields are visible and large enough to tap", () => {
      cy.get('input[type="email"]').should("be.visible").invoke("outerHeight").should("be.gte", 40);
      cy.get('input[type="password"]').first().should("be.visible").invoke("outerHeight").should("be.gte", 40);
    });

    it("login button is visible and spans a reasonable width", () => {
      cy.get("#loginBtn").should("be.visible").invoke("outerWidth").should("be.gte", 120);
    });

    it("language selector is tappable", () => {
      cy.get("#languageSelector").should("be.visible").invoke("outerHeight").should("be.gte", 36);
    });
  });

  // ── Dashboard — hamburger menu ───────────────────────────────────────────────

  describe("Dashboard — hamburger menu", () => {
    beforeEach(() => {
      cy.visit("/");
      cy.get("button").contains(/demo|демо/i).click();
      cy.url().should("include", "/dashboard");
    });

    it("hamburger button is visible on mobile", () => {
      cy.get(".navbar-toggler").should("be.visible");
    });

    it("nav links are hidden before menu open", () => {
      // The collapsible nav should not be expanded by default on mobile
      cy.get(".navbar-collapse").should("not.have.class", "show");
    });

    it("tapping hamburger opens the nav menu", () => {
      cy.get(".navbar-toggler").click();
      cy.get(".navbar-collapse").should("have.class", "show");
    });

    it("tapping hamburger again closes the nav menu", () => {
      cy.get(".navbar-toggler").click();
      cy.get(".navbar-collapse").should("have.class", "show");
      cy.get(".navbar-toggler").click();
      cy.get(".navbar-collapse").should("not.have.class", "show");
    });

    it("no horizontal scroll on dashboard", () => {
      cy.document().then((doc) => {
        expect(doc.documentElement.scrollWidth).to.be.lte(390);
      });
    });

    it("campaign cards do not overflow viewport width", () => {
      // Cards should fit within 390px
      cy.get(".campaign-card, .card").each(($card) => {
        cy.wrap($card).invoke("outerWidth").should("be.lte", 390);
      });
    });
  });

  // ── Campaign detail — file upload tap target ─────────────────────────────────

  describe("Campaign detail — file input on mobile", () => {
    beforeEach(() => {
      cy.visit("/");
      cy.get("button").contains(/demo|демо/i).click();
      cy.visit("/src/pages/campaign-detail.html?id=demo-campaign-1");
    });

    it("file upload label/button is visible and tappable (height ≥ 44px)", () => {
      // The label wrapping the file input is the tap target
      cy.get("#afterPhoto")
        .parent()
        .invoke("outerHeight")
        .should("be.gte", 44);
    });

    it("upload section does not overflow viewport", () => {
      cy.get("#afterPhoto").invoke("outerWidth").should("be.lte", 390);
    });
  });

  // ── Create Campaign form ─────────────────────────────────────────────────────

  describe("Create Campaign form on mobile", () => {
    beforeEach(() => {
      cy.visit("/");
      cy.get("button").contains(/demo|демо/i).click();
      cy.visit("/src/pages/create-campaign.html");
    });

    it("form fields are full-width on mobile (no horizontal overflow)", () => {
      cy.document().then((doc) => {
        expect(doc.documentElement.scrollWidth).to.be.lte(390);
      });
    });

    it("title input is tappable (height ≥ 40px)", () => {
      cy.get("#campaignTitle, input[name='title'], #title")
        .first()
        .should("be.visible")
        .invoke("outerHeight")
        .should("be.gte", 40);
    });

    it("submit button spans enough width to tap easily", () => {
      cy.get("button[type='submit']")
        .first()
        .should("be.visible")
        .invoke("outerWidth")
        .should("be.gte", 100);
    });
  });
});
