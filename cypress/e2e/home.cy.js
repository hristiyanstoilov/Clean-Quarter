// cypress/e2e/home.cy.js
// E2E test: отваря началната страница и проверява за login форма/бутон

describe('Начална страница (index.html)', () => {
  it('Трябва да се вижда login форма или бутон', () => {
    cy.visit('/');
    // Проверка за форма с input за email/парола или бутон за вход
    cy.get('form').should('exist');
    cy.get('button, input[type=submit]').contains(/вход|login|sign in/i).should('exist');
  });
});
