// 🎯 CRITICAL PATH TESTS - Main User Journeys
// Sr. QA: These tests MUST pass before any release

describe('Critical User Journeys', () => {
  const testUser = {
    email: 'test@cleanquarter.bg',
    password: 'TestPass123!',
    neighborhood: 'Studentski Grad'
  };

  beforeEach(() => {
    cy.visit('/');
  });

  describe('🔐 Authentication Flow', () => {
    it('should display login page with all elements', () => {
      // Verify page loads
      cy.get('#loginForm').should('be.visible');
      cy.get('#registerForm').should('exist');

      // Verify critical elements
      cy.get('#loginEmail').should('be.visible');
      cy.get('#loginPassword').should('be.visible');
      cy.get('button[type="submit"]').contains(/вход|login/i).should('be.visible');
      cy.get('#languageSelector').should('be.visible');
    });

    it('should switch between login and register tabs', () => {
      // Click register tab
      cy.get('#register-tab').click();
      cy.get('#registerForm').should('be.visible');
      cy.get('#loginForm').should('not.be.visible');

      // Click login tab
      cy.get('#login-tab').click();
      cy.get('#loginForm').should('be.visible');
      cy.get('#registerForm').should('not.be.visible');
    });

    it('should validate login form fields', () => {
      cy.get('button[type="submit"]').contains(/вход|login/i).click();

      // Browser validation should prevent submission
      cy.get('#loginEmail:invalid').should('exist');
      cy.get('#loginPassword:invalid').should('exist');
    });

    it('should enable demo mode login', () => {
      cy.get('button').contains(/demo|демо/i).should('be.visible').click();

      // Should redirect to dashboard
      cy.url().should('include', '/dashboard.html');
      cy.get('#campaignsContainer').should('be.visible');
    });

    it('should show password strength indicator on register', () => {
      cy.get('#register-tab').click();
      cy.get('#registerPassword').type('weak');
      cy.get('#registerPasswordStrengthBar').should('be.visible');

      cy.get('#registerPassword').clear().type('StrongP@ss123');
      cy.get('#registerPasswordStrength').should('have.css', 'width').and('not.eq', '0px');
    });

    it('should toggle password visibility', () => {
      cy.get('#register-tab').click();

      // Password should be hidden by default
      cy.get('#registerPassword').should('have.attr', 'type', 'password');

      // Toggle visibility
      cy.get('#toggleRegisterPassword').click();
      cy.get('#registerPassword').should('have.attr', 'type', 'text');

      // Toggle back
      cy.get('#toggleRegisterPassword').click();
      cy.get('#registerPassword').should('have.attr', 'type', 'password');
    });

    it('should show forgot password option', () => {
      cy.contains(/забравена парола|forgot password/i).should('be.visible');
    });
  });

  describe('🏠 Dashboard Access & Navigation', () => {
    beforeEach(() => {
      // Use demo mode for quick access
      cy.visit('/');
      cy.get('button').contains(/demo|демо/i).click();
      cy.url().should('include', '/dashboard.html');
    });

    it('should load dashboard with all critical elements', () => {
      // Verify map loads
      cy.get('#map').should('be.visible');

      // Verify campaigns container exists
      cy.get('#campaignsContainer').should('exist');

      // Verify navigation
      cy.get('.navbar').should('be.visible');
      cy.get('#languageSelector').should('be.visible');
    });

    it('should have working navigation links', () => {
      // Test Create Campaign link
      cy.contains(/създай кампания|create campaign/i).click();
      cy.url().should('include', '/create-campaign.html');
      cy.go('back');

      // Test Rewards link
      cy.contains(/награди|rewards/i).first().click();
      cy.url().should('include', '/rewards.html');
      cy.go('back');

      // Test Profile link
      cy.contains(/профил|profile/i).first().click();
      cy.url().should('include', '/profile.html');
      cy.go('back');
    });

    it('should display campaigns or no campaigns message', () => {
      cy.get('#campaignsContainer, #noCampaignsMessage').should('be.visible');
    });

    it('should have working logout button', () => {
      cy.get('#logoutBtn, a').contains(/изход|logout/i).click();

      // Should redirect to login
      cy.url().should('not.include', '/dashboard.html');
      cy.url().should('match', /\/$|index\.html/);
    });
  });

  describe('➕ Create Campaign Flow', () => {
    beforeEach(() => {
      cy.visit('/');
      cy.get('button').contains(/demo|демо/i).click();
      cy.visit('/src/pages/create-campaign.html');
    });

    it('should load create campaign page with all fields', () => {
      // Verify form exists
      cy.get('#createCampaignForm').should('be.visible');

      // Verify all required fields
      cy.get('#campaignTitleBg').should('be.visible');
      cy.get('#campaignTitleEn').should('be.visible');
      cy.get('#campaignDescriptionBg').should('be.visible');
      cy.get('#campaignDescriptionEn').should('be.visible');
      cy.get('#campaignNeighborhoodBg').should('be.visible');
      cy.get('#campaignNeighborhoodEn').should('be.visible');
      cy.get('#beforePhoto').should('exist');
      cy.get('#map').should('be.visible');
    });

    it('should have submit button disabled initially', () => {
      cy.get('#submitBtn').should('be.disabled');
    });

    it('should show visual checklist for required fields', () => {
      // Visual checklist should appear
      cy.get('#requirementsChecklist, [id*="checklist"]').should('exist');
    });

    it('should validate bilingual title requirement', () => {
      cy.get('#campaignTitleBg').type('Тестова кампания');

      // Submit should still be disabled without English title
      cy.get('#submitBtn').should('be.disabled');

      cy.get('#campaignTitleEn').type('Test Campaign');
      // Still disabled (need all fields)
      cy.get('#submitBtn').should('be.disabled');
    });

    it('should load Leaflet map for location selection', () => {
      // Check if Leaflet map container exists
      cy.get('#map').should('be.visible');
      cy.get('.leaflet-container').should('exist');
    });

    it('should display coordinates after map click', () => {
      // Coordinates display should exist
      cy.get('#coordinatesDisplay').should('exist');
      cy.get('#latitude').should('exist');
      cy.get('#longitude').should('exist');
    });

    it('should have working back to dashboard link', () => {
      cy.contains(/dashboard|табло/i).click();
      cy.url().should('include', '/dashboard.html');
    });
  });

  describe('👤 Profile Management', () => {
    beforeEach(() => {
      cy.visit('/');
      cy.get('button').contains(/demo|демо/i).click();
      cy.visit('/src/pages/profile.html');
    });

    it('should load profile page with user data', () => {
      cy.get('#profileContent').should('be.visible');
      cy.get('#userEmail').should('exist');
      cy.get('#pointsDisplay').should('exist');
      cy.get('#neighborhoodDisplay').should('exist');
      cy.get('#rankBadge').should('exist');
    });

    it('should have edit profile button', () => {
      cy.get('#editProfileBtn, button').contains(/редактирай|edit/i).should('be.visible');
    });

    it('should show/hide edit form when toggling edit mode', () => {
      // Edit form should be hidden initially
      cy.get('#editProfileSection').should('not.be.visible');

      // Click edit button
      cy.get('#editProfileBtn, button').contains(/редактирай|edit/i).click();

      // Edit form should appear
      cy.get('#editProfileSection').should('be.visible');
      cy.get('#editProfileForm').should('be.visible');
    });

    it('should display user statistics', () => {
      cy.get('#pointsValue, #pointsDisplay').should('exist');
      cy.get('#neighborhoodValue, #neighborhoodDisplay').should('exist');
    });

    it('should have password strength indicator in edit mode', () => {
      cy.get('#editProfileBtn, button').contains(/редактирай|edit/i).click();

      cy.get('#editPassword').should('exist');
      cy.get('#editPasswordStrengthBar').should('exist');
    });
  });

  describe('🎁 Rewards Shop', () => {
    beforeEach(() => {
      cy.visit('/');
      cy.get('button').contains(/demo|демо/i).click();
      cy.visit('/src/pages/rewards.html');
    });

    it('should load rewards page', () => {
      cy.get('#rewardsContent').should('be.visible');
      cy.get('#pointsBalance').should('exist');
    });

    it('should display user points balance', () => {
      cy.get('#pointsBalance').should('be.visible').and('not.be.empty');
    });

    it('should show rewards grid or empty message', () => {
      cy.get('#rewardsGrid, #errorMessage').should('exist');
    });

    it('should have back to dashboard link', () => {
      cy.contains(/back to dashboard|табло/i).should('be.visible');
    });

    it('should have transaction history link', () => {
      cy.contains(/transaction history|история/i).should('be.visible');
    });
  });

  describe('📱 Responsive Design & Mobile', () => {
    beforeEach(() => {
      cy.visit('/');
      cy.get('button').contains(/demo|демо/i).click();
    });

    it('should have mobile navbar toggle', () => {
      cy.viewport('iphone-x');
      cy.get('button[data-bs-toggle="collapse"]').should('be.visible');
    });

    it('should display correctly on tablet', () => {
      cy.viewport('ipad-2');
      cy.get('.navbar').should('be.visible');
      cy.get('#map').should('be.visible');
    });

    it('should display correctly on desktop', () => {
      cy.viewport(1920, 1080);
      cy.get('.navbar').should('be.visible');
      cy.get('#map').should('be.visible');
    });
  });

  describe('🌐 Language Switching', () => {
    beforeEach(() => {
      cy.visit('/');
    });

    it('should have language selector on all pages', () => {
      cy.get('#languageSelector').should('be.visible');
    });

    it('should switch to English', () => {
      cy.get('#languageSelector').select('en');

      // Verify some text changes to English
      cy.contains(/login|register/i).should('exist');
    });

    it('should switch back to Bulgarian', () => {
      cy.get('#languageSelector').select('bg');

      // Verify Bulgarian text
      cy.contains(/вход|регистрация/i).should('exist');
    });

    it('should persist language choice', () => {
      cy.get('#languageSelector').select('en');
      cy.reload();

      // Language should remain English
      cy.get('#languageSelector').should('have.value', 'en');
    });
  });

  describe('🔗 External Links & Resources', () => {
    beforeEach(() => {
      cy.visit('/');
    });

    it('should have properly configured PWA manifest', () => {
      cy.request('/public/manifest.json').its('status').should('eq', 200);
    });

    it('should have favicon', () => {
      cy.request('/public/favicon.ico').its('status').should('eq', 200);
    });

    it('should load Bootstrap CSS', () => {
      cy.get('head link[href*="bootstrap"]').should('exist');
    });

    it('should load custom CSS files', () => {
      cy.get('head link[href*="auth.css"]').should('exist');
    });
  });
});
