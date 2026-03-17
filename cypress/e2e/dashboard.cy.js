// cypress/e2e/dashboard.cy.js
// E2E тест: отваря dashboard и проверява за основни елементи

describe('Dashboard страница', () => {
  it('Трябва да се вижда заглавие и основни секции', () => {
    cy.visit('/src/pages/dashboard.html');
    cy.get('.navbar').should('exist');
    cy.get('#map').should('exist');
    cy.get('#campaignsContainer').should('exist');
    cy.get('[data-i18n="dashboard.nearYou"]').should('exist');
  });
});
