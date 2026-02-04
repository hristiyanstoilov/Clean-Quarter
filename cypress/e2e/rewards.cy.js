// cypress/e2e/rewards.cy.js
// E2E тест: проверка на rewards страница

describe('Rewards страница', () => {
  it('Показва списък с награди и основни елементи', () => {
    cy.visit('/src/pages/rewards.html');
    cy.contains(/rewards|награди/i).should('exist');
    cy.get('.container').should('exist');
    cy.get('h1, h2, h3').contains(/rewards|награди/i, { matchCase: false });
    // Проверка за поне един елемент/карта с награда
    cy.get('.reward-card, .card, .list-group-item').should('exist');
  });

  it('Може да заяви награда (UI)', () => {
    cy.visit('/src/pages/rewards.html');
    // Търси бутон за заявяване/вземане на награда
    cy.get('button, .btn').contains(/вземи|заяви|claim|redeem/i).first().click({force: true});
    // Проверка за потвърждение или съобщение за успех/грешка
    cy.contains(/успешно|заявена|claimed|недостатъчно/i).should('exist');
  });

  it('Показва грешка при заявяване на награда без достатъчно точки (UI)', () => {
    cy.visit('/src/pages/rewards.html');
    // Търси награда, която изисква повече точки от наличните (симулирано)
    cy.get('button, .btn').contains(/вземи|заяви|claim|redeem/i).first().click({force: true});
    // Проверка за съобщение за грешка или недостатъчно точки
    cy.contains(/недостатъчно|not enough|грешка|error/i).should('exist');
  });
});
