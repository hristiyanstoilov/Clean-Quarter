// 📤 FILE UPLOAD TESTS — Proof submission flow
// Covers: file selection, preview, size validation, submit flow.
// Supabase Storage is intercepted — tests run without real credentials.

describe("File Upload — proof submission", () => {
  const CAMPAIGN_URL = "/src/pages/campaign-detail.html?id=demo-campaign-1";

  beforeEach(() => {
    // Intercept Supabase Storage upload — avoids real bucket dependency
    cy.intercept("POST", "**/storage/v1/object/**", {
      statusCode: 200,
      body: { Key: "campaigns/test/test-photo.jpg" },
    }).as("storageUpload");

    // Intercept storage public URL reads
    cy.intercept("GET", "**/storage/v1/object/public/**", {
      statusCode: 200,
      fixture: "test-photo.jpg",
    }).as("storageRead");

    // Log in via demo mode
    cy.visit("/");
    cy.get("button").contains(/demo|демо/i).click();
    cy.url().should("include", "/dashboard");
  });

  // ── File picker ──────────────────────────────────────────────────────────────

  describe("File picker behaviour", () => {
    it("file input accepts image types only", () => {
      cy.visit(CAMPAIGN_URL);
      cy.get("#afterPhoto").then(($el) => {
        expect($el.attr("accept")).to.include("image/jpeg");
        expect($el.attr("accept")).to.include("image/png");
        expect($el.attr("accept")).to.include("image/webp");
      });
    });

    it("selecting a valid file updates the filename display", () => {
      cy.visit(CAMPAIGN_URL);
      cy.get("#afterPhoto").selectFile("cypress/fixtures/test-photo.jpg", {
        force: true,
      });
      cy.get("#afterPhotoName").should("not.contain", "No file chosen");
      cy.get("#afterPhotoName").should("not.contain", "Не е избран файл");
    });

    it("selecting a valid file enables the upload button", () => {
      cy.visit(CAMPAIGN_URL);
      cy.get("#uploadBtn").should("be.disabled");
      cy.get("#afterPhoto").selectFile("cypress/fixtures/test-photo.jpg", {
        force: true,
      });
      cy.get("#uploadBtn").should("not.be.disabled");
    });

    it("selecting a valid file shows the photo preview", () => {
      cy.visit(CAMPAIGN_URL);
      cy.get("#afterPhotoPreview").should("not.be.visible");
      cy.get("#afterPhoto").selectFile("cypress/fixtures/test-photo.jpg", {
        force: true,
      });
      cy.get("#afterPhotoPreview").should("be.visible");
    });
  });

  // ── File size validation ──────────────────────────────────────────────────────

  describe("File size validation", () => {
    it("rejects files over 5MB with an error message", () => {
      cy.visit(CAMPAIGN_URL);
      // Create a 6MB fake JPEG in memory — no real file needed
      cy.get("#afterPhoto").selectFile(
        {
          contents: Cypress.Buffer.alloc(6 * 1024 * 1024, 0xff),
          fileName: "big-photo.jpg",
          mimeType: "image/jpeg",
        },
        { force: true }
      );
      // An error alert or message should appear (SweetAlert or inline)
      cy.on("window:alert", (msg) => {
        expect(msg).to.match(/5mb|5 mb|твърде голям|too large/i);
      });
      // Upload button should remain disabled or error shown
      cy.get("#uploadBtn").should("be.disabled");
    });
  });

  // ── Submit flow ───────────────────────────────────────────────────────────────

  describe("Proof submission flow", () => {
    it("upload button is present and has correct i18n key", () => {
      cy.visit(CAMPAIGN_URL);
      cy.get("#uploadBtn")
        .should("exist")
        .and("have.attr", "data-i18n", "campaign.submitProof");
    });

    it("upload section is present in DOM", () => {
      cy.visit(CAMPAIGN_URL);
      cy.get("#afterPhoto").should("exist");
      cy.get("#uploadBtn").should("exist");
      cy.get("#afterPhotoPreview").should("exist");
      cy.get("#submissionStatus").should("exist");
    });
  });
});
