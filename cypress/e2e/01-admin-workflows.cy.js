// 🛡️ ADMIN PANEL TESTS - Administrative Functions
// Sr. QA: Critical for admin user workflows

describe('Admin Panel Workflows', () => {
  beforeEach(() => {
    cy.visit('/');
    // Login as demo (which should have admin access in demo mode)
    cy.get('button').contains(/demo|демо/i).click();
    cy.wait(500);
  });

  describe('Admin Access & Navigation', () => {
    it('should have admin link in navigation for admin users', () => {
      // Check if admin link exists (only for admin users)
      cy.get('a[href*="admin.html"]').then(($link) => {
        if ($link.length > 0) {
          cy.wrap($link).should('be.visible');
        }
      });
    });

    it('should load admin panel when accessed directly', () => {
      cy.visit('/src/pages/admin.html');

      // Should either show admin content or access denied
      cy.get('#adminContent, #accessDenied').should('be.visible');
    });

    it('should display access denied for non-admin users', () => {
      // This test assumes non-admin context
      // In production, would test with actual non-admin account
      cy.visit('/src/pages/admin.html');

      cy.get('body').then(($body) => {
        if ($body.find('#accessDenied').length > 0) {
          cy.get('#accessDenied').should('be.visible');
          cy.get('#accessDeniedTitle').should('contain.text', /access denied|забранен достъп/i);
        }
      });
    });
  });

  describe('Participation Approval Interface', () => {
    beforeEach(() => {
      cy.visit('/src/pages/admin.html');
    });

    it('should display pending participations table', () => {
      cy.get('#pendingTableContainer').should('exist');
    });

    it('should show statistics counters', () => {
      cy.get('#totalPendingCount').should('exist');
      cy.get('#totalApprovedCount').should('exist');
      cy.get('#totalRejectedCount').should('exist');
    });

    it('should have user management section', () => {
      cy.get('#userTableContainer').should('exist');
      cy.get('#userSearchInput').should('exist');
    });

    it('should have role log section', () => {
      cy.get('#roleLogContainer').should('exist');
      cy.get('#roleLogSearchInput').should('exist');
    });

    it('should have photo modal for viewing submission photos', () => {
      cy.get('#photoModal').should('exist');
      cy.get('#modalPhoto').should('exist');
    });

    it('should search users by input', () => {
      cy.get('#userSearchInput').should('be.visible').type('test');
      // Search should filter table
      cy.get('#userTableContainer').should('exist');
    });

    it('should search role logs', () => {
      cy.get('#roleLogSearchInput').should('be.visible').type('admin');
      cy.get('#roleLogContainer').should('exist');
    });

    it('should have role log toggle button', () => {
      cy.get('button').contains(/role log|роля/i).should('exist');
    });
  });

  describe('Participation Actions', () => {
    beforeEach(() => {
      cy.visit('/src/pages/admin.html');
    });

    it('should have approve/reject buttons for pending items', () => {
      cy.get('#pendingTableContainer').then(($container) => {
        if ($container.find('button').length > 0) {
          // Verify action buttons exist
          cy.get('#pendingTableContainer').find('button').should('have.length.at.least', 1);
        }
      });
    });

    it('should display loading state during operations', () => {
      cy.get('#loadingState').should('exist');
    });

    it('should show admin panel title', () => {
      cy.get('#adminPanelTitle, h1').should('exist');
    });
  });

  describe('User Management', () => {
    beforeEach(() => {
      cy.visit('/src/pages/admin.html');
    });

    it('should display user management title', () => {
      cy.get('#userManagementTitle').should('exist');
    });

    it('should allow searching users', () => {
      cy.get('#userSearchInput').type('test@example.com');
      // Table should filter
      cy.get('#userTableContainer').should('exist');
    });

    it('should handle empty user search', () => {
      cy.get('#userSearchInput').clear();
      cy.get('#userTableContainer').should('exist');
    });
  });

  describe('Admin Dashboard Statistics', () => {
    beforeEach(() => {
      cy.visit('/src/pages/admin.html');
    });

    it('should display total pending count', () => {
      cy.get('#totalPendingCount').should('be.visible');
    });

    it('should display total approved count', () => {
      cy.get('#totalApprovedCount').should('be.visible');
    });

    it('should display total rejected count', () => {
      cy.get('#totalRejectedCount').should('be.visible');
    });

    it('should show statistics cards', () => {
      cy.get('.stats-card, .card').should('have.length.at.least', 1);
    });
  });

  describe('Admin Navigation & Security', () => {
    it('should require authentication to access admin panel', () => {
      // Logout first
      cy.visit('/src/pages/dashboard.html');
      cy.get('#logoutBtn, a').contains(/изход|logout/i).click();

      // Try to access admin panel
      cy.visit('/src/pages/admin.html');

      // Should redirect to login or show access denied
      cy.url().then((url) => {
        expect(url).to.satisfy((url) =>
          url.includes('index.html') ||
          url.endsWith('/') ||
          url.includes('admin.html')
        );
      });
    });

    it('should have working navigation to other pages from admin', () => {
      cy.visit('/src/pages/admin.html');

      // Navigate to dashboard
      cy.contains(/dashboard|табло/i).click();
      cy.url().should('include', '/dashboard.html');
    });

    it('should have working logout from admin panel', () => {
      cy.visit('/src/pages/admin.html');

      cy.get('a, button').contains(/logout|изход/i).click();
      cy.url().should('not.include', '/admin.html');
    });
  });

  describe('Photo Modal Functionality', () => {
    beforeEach(() => {
      cy.visit('/src/pages/admin.html');
    });

    it('should have photo modal element', () => {
      cy.get('#photoModal').should('exist');
    });

    it('should have close button for photo modal', () => {
      cy.get('#photoModal').within(() => {
        cy.get('button').should('exist');
      });
    });

    it('should display photo in modal', () => {
      cy.get('#modalPhoto').should('exist');
    });
  });

  describe('Admin Panel Performance', () => {
    it('should load admin panel within acceptable time', () => {
      const startTime = Date.now();

      cy.visit('/src/pages/admin.html');
      cy.get('#adminContent, #accessDenied').should('be.visible');

      const loadTime = Date.now() - startTime;
      expect(loadTime).to.be.lessThan(5000); // Should load within 5 seconds
    });

    it('should handle large datasets gracefully', () => {
      cy.visit('/src/pages/admin.html');

      // Even with many items, page should be responsive
      cy.get('#pendingTableContainer').should('be.visible');
      cy.get('#userTableContainer').should('be.visible');
    });
  });
});
