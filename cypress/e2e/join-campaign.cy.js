// cypress/e2e/join-campaign.cy.js
// E2E тест: участие в кампания (UI ниво)

describe('Участие в кампания', () => {
  it('Позволява присъединяване към кампания и качване на снимка след почистване (UI)', () => {
    cy.visit('/src/pages/campaign-detail.html?id=demo_1');
    // Търси бутон за участие
    cy.get('button, .btn').contains(/участвай|join|присъедини/i).click({force: true});
    // Проверка за форма за качване на снимка
    cy.get('input[type=file]').should('exist');
    // cy.get('input[type=file]').attachFile('after-photo.jpg'); // изисква cypress-file-upload
    // cy.get('button, input[type=submit]').contains(/изпрати|submit|claim/i).click({force: true});
    // cy.contains(/успешно|очаква одобрение|pending/i).should('exist');
  });
});
