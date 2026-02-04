// cypress/e2e/user-history.cy.js
// E2E тест: история на кампании и участия на потребителя (UI ниво)

describe('История на кампании и участия', () => {
  it('Профилът показва списък с минали кампании и участия', () => {
    cy.visit('/src/pages/profile.html');
    // Проверка за секция/таблица/списък с кампании
    cy.get('.campaign-history, .participation-history, table, .list-group').should('exist');
    cy.contains(/участие|кампания|campaign|participation/i);
    // Проверка за поне един ред/елемент
    cy.get('.campaign-history tr, .participation-history tr, .list-group-item').should('have.length.greaterThan', 0);
  });
});
