// cypress/e2e/profile.cy.js
// E2E тест: проверка на профил страница

describe('Профил страница', () => {
  it('Показва основна информация за потребителя', () => {
    cy.visit('/src/pages/profile.html');
    cy.contains(/profile|профил/i).should('exist');
    cy.get('.container').should('exist');
    cy.get('h1, h2, h3').contains(/profile|профил/i, { matchCase: false });
    // Проверка за точки, квартал или други ключови елементи
    cy.contains(/points|точки/i);
    cy.contains(/neighborhood|квартал/i);
  });

  it('Позволява редакция на профил (UI)', () => {
    cy.visit('/src/pages/profile.html');
    // Търси бутон/линк за редакция
    cy.get('button, a').contains(/edit|редакция|редактирай/i).click({force: true});
    // Проверка за форма за редакция
    cy.get('form').should('exist');
    // Попълва поле и съхранява
    cy.get('input, textarea').first().type('Тест редакция', {force: true});
    cy.get('button, input[type=submit]').contains(/save|запази/i).click({force: true});
    // Проверка за съобщение за успех
    cy.contains(/успешно|запазен|saved/i).should('exist');
  });

  it('Показва история на точки (UI)', () => {
    cy.visit('/src/pages/profile.html');
    // Проверка за таблица/списък с транзакции
    cy.get('table, .points-history, .list-group').should('exist');
    cy.contains(/earned|spent|спечелени|изразходвани|транзакция/i);
  });
});
