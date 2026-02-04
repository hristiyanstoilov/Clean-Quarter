// cypress/e2e/admin.cy.js
// E2E тест: проверка на админ панел

describe('Админ панел', () => {
  it('Показва админ секции и заявки за одобрение', () => {
    cy.visit('/src/pages/admin.html');
    cy.contains(/admin|админ|одобрение|approval/i).should('exist');
    cy.get('.container').should('exist');
    cy.get('h1, h2, h3').contains(/admin|админ/i, { matchCase: false });
    // Проверка за списък със заявки или таблица
    cy.get('table, .request-list, .card, .list-group').should('exist');
  });

  it('Може да одобри или откаже заявка (UI)', () => {
    cy.visit('/src/pages/admin.html');
    // Търси бутон за одобрение и отказ (ако има заявки)
    cy.get('button, .btn').contains(/одобри|approve/i).first().click({force: true});
    // Проверка за промяна на статус или съобщение (ако има)
    // (Това е пример, адаптирай според реалния UI)
    cy.contains(/одобрена|approved|успешно/i).should('exist');

    cy.get('button, .btn').contains(/откажи|reject|refuse/i).first().click({force: true});
    cy.contains(/отказана|rejected|отказ/i).should('exist');
  });

  it('Не позволява достъп до админ панел без админ права (UI)', () => {
    // Симулира липса на админ роля (например чрез localStorage)
    cy.clearLocalStorage();
    cy.visit('/src/pages/admin.html');
    // Очаква съобщение за грешка, пренасочване или липса на съдържание
    cy.contains(/достъп отказан|access denied|нямате права|not authorized|forbidden|грешка/i).should('exist');
  });
});
