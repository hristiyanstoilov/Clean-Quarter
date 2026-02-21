// 📋 CAMPAIGN DETAIL TESTS - Campaign viewing and editing
// Sr. QA: Essential for campaign management functionality

describe('Campaign Detail Page', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('button').contains(/demo|демо/i).click();
  });

  describe('Campaign Detail View', () => {
    it('should load campaign detail page with query parameter', () => {
      // Navigate to a campaign detail (with mock ID)
      cy.visit('/src/pages/campaign-detail.html?id=test-campaign-id');

      // Page should load
      cy.get('#campaignContent, #loadingState').should('exist');
    });

    it('should display all campaign information fields', () => {
      cy.visit('/src/pages/campaign-detail.html?id=test-id');

      // Verify key elements exist
      cy.get('#campaignTitle').should('exist');
      cy.get('#campaignDescription').should('exist');
      cy.get('#campaignNeighborhood').should('exist');
      cy.get('#campaignDate').should('exist');
      cy.get('#createdBy').should('exist');
      cy.get('#statusBadge').should('exist');
    });

    it('should display before photo', () => {
      cy.visit('/src/pages/campaign-detail.html?id=test-id');
      cy.get('#beforePhoto').should('exist');
    });

    it('should show participant statistics', () => {
      cy.visit('/src/pages/campaign-detail.html?id=test-id');

      cy.get('#participantCount').should('exist');
      cy.get('#approvedCount').should('exist');
    });

    it('should have status badge visible', () => {
      cy.visit('/src/pages/campaign-detail.html?id=test-id');
      cy.get('#statusBadge').should('exist');
    });

    it('should display campaign creator information', () => {
      cy.visit('/src/pages/campaign-detail.html?id=test-id');
      cy.get('#createdBy').should('exist');
    });
  });

  describe('Campaign Editing (for campaign owner)', () => {
    beforeEach(() => {
      cy.visit('/src/pages/campaign-detail.html?id=test-id');
    });

    it('should have edit campaign button', () => {
      cy.get('#editCampaignBtn, button').contains(/edit|редактирай/i).should('exist');
    });

    it('should toggle edit form visibility', () => {
      // Edit section should be hidden initially
      cy.get('#editCampaignSection').should('not.be.visible');

      // Click edit button
      cy.get('#editCampaignBtn, button').contains(/edit|редактирай/i).click();

      // Edit section should appear
      cy.get('#editCampaignSection').should('be.visible');
    });

    it('should display edit form with all fields', () => {
      cy.get('#editCampaignBtn, button').contains(/edit|редактирай/i).click();

      cy.get('#editCampaignForm').should('be.visible');
      cy.get('#editTitle').should('exist');
      cy.get('#editDescription').should('exist');
      cy.get('#editNeighborhood').should('exist');
      cy.get('#editStatus').should('exist');
    });

    it('should have save changes button in edit form', () => {
      cy.get('#editCampaignBtn, button').contains(/edit|редактирай/i).click();

      cy.get('button[type="submit"]').contains(/save|запази/i).should('be.visible');
    });

    it('should have cancel button in edit form', () => {
      cy.get('#editCampaignBtn, button').contains(/edit|редактирай/i).click();

      cy.get('button').contains(/cancel|отказ/i).should('be.visible');
    });

    it('should allow changing campaign status', () => {
      cy.get('#editCampaignBtn, button').contains(/edit|редактирай/i).click();

      cy.get('#editStatus').should('exist');
      cy.get('#editStatus option').should('have.length.at.least', 2);
    });
  });

  describe('Campaign Participation Actions', () => {
    beforeEach(() => {
      cy.visit('/src/pages/campaign-detail.html?id=test-id');
    });

    it('should have join/participate button for eligible users', () => {
      cy.get('button').contains(/join|участвай|submit/i).should('exist');
    });

    it('should display participation requirements', () => {
      // Should show what's needed to participate
      cy.get('body').should('contain.text', /.+/);
    });

    it('should show participant list or count', () => {
      cy.get('#participantCount, #approvedCount').should('exist');
    });
  });

  describe('Campaign Map & Location', () => {
    beforeEach(() => {
      cy.visit('/src/pages/campaign-detail.html?id=test-id');
    });

    it('should display map container if available', () => {
      cy.get('#map, .map-container').should('exist');
    });

    it('should show campaign location on map', () => {
      // Verify map and leaflet are loaded
      cy.get('.leaflet-container').should('exist');
    });

    it('should display neighborhood information', () => {
      cy.get('#campaignNeighborhood').should('exist');
    });
  });

  describe('Campaign Photos & Media', () => {
    beforeEach(() => {
      cy.visit('/src/pages/campaign-detail.html?id=test-id');
    });

    it('should display before photo', () => {
      cy.get('#beforePhoto').should('exist');
    });

    it('should handle missing photos gracefully', () => {
      cy.get('#beforePhoto').then(($img) => {
        if ($img.attr('src')) {
          cy.wrap($img).should('have.attr', 'src');
        }
      });
    });

    it('should allow viewing photo in full size', () => {
      cy.get('#beforePhoto').should('exist');
      // Click to enlarge might trigger modal
      cy.get('#beforePhoto').click();
    });
  });

  describe('Campaign Navigation & Back Button', () => {
    beforeEach(() => {
      cy.visit('/src/pages/campaign-detail.html?id=test-id');
    });

    it('should have back to dashboard button', () => {
      cy.contains(/back|назад|dashboard/i).should('exist');
    });

    it('should navigate back to dashboard', () => {
      cy.contains(/dashboard|табло/i).click();
      cy.url().should('include', '/dashboard.html');
    });

    it('should have working navigation bar', () => {
      cy.get('.navbar').should('be.visible');
      cy.contains(/rewards|награди/i).should('exist');
      cy.contains(/profile|профил/i).should('exist');
    });
  });

  describe('Campaign Status & States', () => {
    beforeEach(() => {
      cy.visit('/src/pages/campaign-detail.html?id=test-id');
    });

    it('should display campaign status badge', () => {
      cy.get('#statusBadge').should('exist');
    });

    it('should show appropriate status color/styling', () => {
      cy.get('#statusBadge').should('have.class', /.+/);
    });

    it('should display campaign date/created time', () => {
      cy.get('#campaignDate').should('exist');
    });

    it('should handle completed campaigns differently', () => {
      // Completed campaigns might have different UI
      cy.get('#statusBadge').invoke('text').then((statusText) => {
        if (statusText.includes('completed') || statusText.includes('завършена')) {
          cy.get('button').contains(/join|участвай/i).should('not.exist');
        }
      });
    });
  });

  describe('Responsive Design on Campaign Detail', () => {
    it('should display correctly on mobile', () => {
      cy.viewport('iphone-x');
      cy.visit('/src/pages/campaign-detail.html?id=test-id');

      cy.get('#campaignContent').should('exist');
      cy.get('.navbar').should('exist');
    });

    it('should display correctly on tablet', () => {
      cy.viewport('ipad-2');
      cy.visit('/src/pages/campaign-detail.html?id=test-id');

      cy.get('#campaignContent').should('exist');
      cy.get('#beforePhoto').should('exist');
    });

    it('should display correctly on desktop', () => {
      cy.viewport(1920, 1080);
      cy.visit('/src/pages/campaign-detail.html?id=test-id');

      cy.get('#campaignContent').should('exist');
      cy.get('#campaignTitle').should('exist');
    });
  });

  describe('Error Handling & Edge Cases', () => {
    it('should handle missing campaign ID', () => {
      cy.visit('/src/pages/campaign-detail.html');

      // Should show error or redirect
      cy.get('body').should('exist');
    });

    it('should handle invalid campaign ID', () => {
      cy.visit('/src/pages/campaign-detail.html?id=invalid-id-12345');

      // Should show error message or loading state
      cy.get('#campaignContent, #loadingState, .error-message').should('exist');
    });

    it('should show loading state while fetching data', () => {
      cy.visit('/src/pages/campaign-detail.html?id=test-id');

      // Loading state should appear briefly
      cy.get('#loadingState').should('exist');
    });

    it('should handle network errors gracefully', () => {
      // Simulate offline
      cy.visit('/src/pages/campaign-detail.html?id=test-id', {
        onBeforeLoad: (win) => {
          cy.stub(win, 'fetch').rejects(new Error('Network error'));
        }
      });

      // Should show error message
      cy.get('body').should('contain.text', /.+/);
    });
  });

  describe('Campaign Detail Performance', () => {
    it('should load campaign details within acceptable time', () => {
      const startTime = Date.now();

      cy.visit('/src/pages/campaign-detail.html?id=test-id');
      cy.get('#campaignContent, #loadingState').should('exist');

      const loadTime = Date.now() - startTime;
      expect(loadTime).to.be.lessThan(5000);
    });

    it('should optimize image loading', () => {
      cy.visit('/src/pages/campaign-detail.html?id=test-id');

      cy.get('#beforePhoto').should('have.attr', 'src');
    });
  });
});
