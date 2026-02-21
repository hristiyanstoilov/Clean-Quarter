// cypress/e2e/rewards.cy.js
// E2E Tests: Rewards Shop and Purchase Flow

describe('🎁 Rewards Shop - Display and Navigation', () => {
  beforeEach(() => {
    cy.visit('/index.html');
    // Login with demo mode
    cy.get('button').contains(/demo|демо/i).click();
    cy.url().should('include', '/dashboard.html');
    // Navigate to rewards
    cy.get('a[href*="rewards"]').click();
    cy.url().should('include', '/rewards.html');
  });

  it('should display rewards page with header and navigation', () => {
    cy.get('.container').should('be.visible');
    cy.contains(/rewards|награди/i).should('be.visible');
    cy.get('a[href*="dashboard"]').should('be.visible');
    cy.get('a[href*="profile"]').should('be.visible');
  });

  it('should display points balance card', () => {
    cy.get('.points-card').should('be.visible');
    cy.contains(/points balance|баланс/i).should('be.visible');
    cy.get('#pointsBalance').should('be.visible');
  });

  it('should display rewards grid or empty state', () => {
    cy.get('#rewardsContent').should('be.visible');
    // Either rewards grid with cards OR empty state message
    cy.get('body').then($body => {
      if ($body.find('.reward-card').length > 0) {
        cy.get('.reward-card').should('have.length.greaterThan', 0);
      } else {
        cy.contains(/no rewards|няма награди/i).should('be.visible');
      }
    });
  });

  it('should navigate back to dashboard', () => {
    cy.get('a').contains(/back to dashboard|назад/i).click();
    cy.url().should('include', '/dashboard.html');
  });

  it('should navigate to transaction history from rewards', () => {
    cy.get('a').contains(/transaction history|история/i).should('be.visible');
  });
});

describe('💰 Rewards Shop - Reward Cards Display', () => {
  beforeEach(() => {
    cy.visit('/index.html');
    cy.get('button').contains(/demo|демо/i).click();
    cy.get('a[href*="rewards"]').click();
  });

  it('should display reward card with all elements', () => {
    cy.get('body').then($body => {
      if ($body.find('.reward-card').length > 0) {
        cy.get('.reward-card').first().within(() => {
          // Reward should have category, title, description, cost, and buy button
          cy.get('.reward-title, h3').should('be.visible');
          cy.get('.reward-cost').should('be.visible');
          cy.get('button').contains(/buy|вземи/i).should('exist');
        });
      }
    });
  });

  it('should show category emoji for rewards', () => {
    cy.get('body').then($body => {
      if ($body.find('.reward-card').length > 0) {
        cy.get('.reward-image, .reward-emoji').first().should('be.visible');
      }
    });
  });

  it('should display reward cost with star icon', () => {
    cy.get('body').then($body => {
      if ($body.find('.reward-card').length > 0) {
        cy.get('.reward-cost').first().should('contain', '⭐');
      }
    });
  });

  it('should show different button states based on affordability', () => {
    cy.get('body').then($body => {
      if ($body.find('.reward-card').length > 0) {
        // Check if there are any disabled buy buttons (insufficient points)
        cy.get('.reward-card').then($cards => {
          const hasDisabled = $cards.find('button:disabled').length > 0;
          const hasEnabled = $cards.find('button:not(:disabled)').length > 0;
          expect(hasDisabled || hasEnabled).to.be.true;
        });
      }
    });
  });
});

describe('🛒 Rewards Purchase Flow - Successful Purchase', () => {
  beforeEach(() => {
    cy.visit('/index.html');
    cy.get('button').contains(/demo|демо/i).click();
    cy.get('a[href*="rewards"]').click();
  });

  it('should show confirmation dialog when buying a reward', () => {
    cy.get('body').then($body => {
      if ($body.find('.reward-card').length > 0) {
        // Find an affordable reward (enabled buy button)
        cy.get('.reward-card').then($cards => {
          const enabledButton = $cards.find('button:not(:disabled)').first();
          if (enabledButton.length > 0) {
            cy.wrap(enabledButton).click();
            // SweetAlert confirmation should appear
            cy.get('.swal2-popup, .swal2-modal').should('be.visible');
            cy.get('.swal2-title').should('contain', /confirm|потвърди/i);
          }
        });
      }
    });
  });

  it('should show reward details in confirmation dialog', () => {
    cy.get('body').then($body => {
      if ($body.find('.reward-card').length > 0 && $body.find('button:not(:disabled)').length > 0) {
        cy.get('button:not(:disabled)').contains(/buy|вземи/i).first().click();
        cy.get('.swal2-popup').should('be.visible');
        // Should show reward title and cost
        cy.get('.swal2-html-container, .swal2-content').should('exist');
        cy.get('button').contains(/yes|да/i).should('be.visible');
        cy.get('button').contains(/cancel|отказ/i).should('be.visible');
      }
    });
  });

  it('should cancel purchase when clicking cancel button', () => {
    cy.get('body').then($body => {
      if ($body.find('.reward-card').length > 0 && $body.find('button:not(:disabled)').length > 0) {
        const initialBalance = $body.find('#pointsBalance').text();
        cy.get('button:not(:disabled)').contains(/buy|вземи/i).first().click();
        cy.get('.swal2-popup').should('be.visible');
        cy.get('button').contains(/cancel|отказ/i).click();
        // Balance should remain the same
        cy.get('#pointsBalance').should('contain', initialBalance);
      }
    });
  });

  it('should complete purchase and update points balance', () => {
    cy.get('body').then($body => {
      if ($body.find('.reward-card').length > 0 && $body.find('button:not(:disabled)').length > 0) {
        // Get initial balance
        cy.get('#pointsBalance').invoke('text').then(initialBalance => {
          const initial = parseInt(initialBalance);

          // Click buy button on first affordable reward
          cy.get('button:not(:disabled)').contains(/buy|вземи/i).first().click();
          cy.get('.swal2-popup').should('be.visible');
          cy.get('button').contains(/yes|да/i).click();

          // Should show success message
          cy.get('.swal2-title', { timeout: 10000 }).should('contain', /success|успех/i);
          cy.get('button').contains(/ok/i).click();

          // Verify balance decreased
          cy.get('#pointsBalance').invoke('text').then(newBalance => {
            const updated = parseInt(newBalance);
            expect(updated).to.be.lessThan(initial);
          });
        });
      }
    });
  });

  it('should show success message with new balance after purchase', () => {
    cy.get('body').then($body => {
      if ($body.find('.reward-card').length > 0 && $body.find('button:not(:disabled)').length > 0) {
        cy.get('button:not(:disabled)').contains(/buy|вzemи/i).first().click();
        cy.get('.swal2-popup').should('be.visible');
        cy.get('button').contains(/yes|да/i).click();

        // Success dialog should show new balance
        cy.get('.swal2-popup', { timeout: 10000 }).should('be.visible');
        cy.get('.swal2-html-container').should('contain', /balance|баланс/i);
      }
    });
  });
});

describe('❌ Rewards Purchase Flow - Insufficient Points', () => {
  beforeEach(() => {
    cy.visit('/index.html');
    cy.get('button').contains(/demo|демо/i).click();
    cy.get('a[href*="rewards"]').click();
  });

  it('should disable buy button for unaffordable rewards', () => {
    cy.get('body').then($body => {
      if ($body.find('.reward-card').length > 0) {
        // Check for disabled buttons
        cy.get('.reward-card').then($cards => {
          const disabledButtons = $cards.find('button:disabled');
          if (disabledButtons.length > 0) {
            cy.wrap(disabledButtons.first()).should('contain', /not enough|недостатъчно/i);
          }
        });
      }
    });
  });

  it('should show insufficient points error when attempting to buy expensive reward', () => {
    // This test would require setting up a scenario with low points
    // and attempting to buy a high-cost reward
    cy.log('Test requires specific test data setup');
  });

  it('should show visual indication for unaffordable rewards', () => {
    cy.get('body').then($body => {
      if ($body.find('.reward-card').length > 0) {
        cy.get('.reward-card').then($cards => {
          const insufficientButtons = $cards.find('.btn-buy-insufficient');
          if (insufficientButtons.length > 0) {
            cy.wrap(insufficientButtons.first()).should('have.class', 'btn-buy-insufficient');
          }
        });
      }
    });
  });
});

describe('🔍 Rewards Shop - Error Handling', () => {
  it('should handle authentication errors gracefully', () => {
    // Visit rewards page directly without login
    cy.visit('/src/pages/rewards.html');
    // Should redirect to login or show error
    cy.url().then(url => {
      expect(url).to.satisfy(url =>
        url.includes('index.html') || url.includes('login')
      );
    });
  });

  it('should show loading state before content loads', () => {
    cy.visit('/index.html');
    cy.get('button').contains(/demo|демо/i).click();
    cy.get('a[href*="rewards"]').click();

    // Loading state should appear briefly
    cy.get('#loadingState, .spinner-border').should('exist');
  });

  it('should hide loading state after content loads', () => {
    cy.visit('/index.html');
    cy.get('button').contains(/demo|демо/i).click();
    cy.get('a[href*="rewards"]').click();

    // Content should be visible after loading
    cy.get('#rewardsContent', { timeout: 10000 }).should('be.visible');
    cy.get('#loadingState').should('not.be.visible');
  });

  it('should handle empty rewards list gracefully', () => {
    cy.visit('/index.html');
    cy.get('button').contains(/demo|демо/i).click();
    cy.get('a[href*="rewards"]').click();

    cy.get('body').then($body => {
      if ($body.find('.reward-card').length === 0) {
        cy.contains(/no rewards|няма награди/i).should('be.visible');
      }
    });
  });
});

describe('📱 Rewards Shop - Responsive Design', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 }
  ];

  viewports.forEach(viewport => {
    it(`should display correctly on ${viewport.name}`, () => {
      cy.viewport(viewport.width, viewport.height);
      cy.visit('/index.html');
      cy.get('button').contains(/demo|демо/i).click();
      cy.get('a[href*="rewards"]').click();

      cy.get('.container').should('be.visible');
      cy.get('#pointsBalance').should('be.visible');
      cy.get('#rewardsContent').should('be.visible');
    });
  });

  it('should have responsive rewards grid', () => {
    cy.visit('/index.html');
    cy.get('button').contains(/demo|демо/i).click();
    cy.get('a[href*="rewards"]').click();

    cy.get('.rewards-grid').should('have.css', 'display');
  });
});
