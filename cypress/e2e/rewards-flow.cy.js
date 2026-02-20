/**
 * Rewards E2E tests
 */

describe('Rewards Flow', () => {
  beforeEach(() => {
    cy.visit('/rewards.html');
  });
  
  it('should display rewards catalog', () => {
    cy.get('[data-cy="reward-card"]').should('have.length.at.least', 1);
  });
  
  it('should show user points balance', () => {
    cy.get('[data-cy="points-balance"]').should('be.visible');
  });
  
  it('should disable purchase button if insufficient points', () => {
    cy.get('[data-cy="reward-card"]').first().within(() => {
      cy.get('[data-reward-cost]').invoke('attr', 'data-reward-cost').then(cost => {
        cy.get('[data-cy="points-balance"]').invoke('text').then(balance => {
          if (parseInt(balance) < parseInt(cost)) {
            cy.get('[data-cy="purchase-btn"]').should('be.disabled');
          }
        });
      });
    });
  });
});
