// cypress/e2e/approve-participation.cy.js
// E2E тест: одобрение на участие от админ (UI ниво)

describe('Одобрение на участие от админ', () => {
  it('Админ вижда заявка за участие и я одобрява (UI)', () => {
    cy.visit('/src/pages/admin.html');
    // Търси заявка със статус "очаква одобрение"
    cy.get('tr, .request-list, .card, .list-group-item').contains(/очаква|pending/i).parents('tr, .card, .list-group-item').within(() => {
      cy.get('button, .btn').contains(/одобри|approve/i).click({force: true});
    });
    // Проверка за промяна на статус или съобщение за успех
    cy.contains(/одобрена|approved|успешно/i).should('exist');
  });
});
