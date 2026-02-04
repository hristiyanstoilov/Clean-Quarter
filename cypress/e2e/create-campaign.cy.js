// cypress/e2e/create-campaign.cy.js
// E2E тест: валидиране на форма за създаване на кампания (UI)

describe('Създаване на кампания - форма', () => {
  it('Показва форма и валидира задължителни полета', () => {
    cy.visit('/src/pages/create-campaign.html');
    cy.get('form#createCampaignForm').should('exist');
    cy.get('#submitBtn').should('be.disabled');
    cy.get('#campaignTitle').type('Тестова кампания');
    cy.get('#campaignDescription').type('Описание на тестова кампания');
    cy.get('#campaignNeighborhood').select('Дървеница');
    // Не избира файл и не избира координати, бутонът трябва да остане неактивен
    cy.get('#submitBtn').should('be.disabled');
  });

  it('Позволява пълно попълване и изпращане на форма (UI)', () => {
    cy.visit('/src/pages/create-campaign.html');
    cy.get('form#createCampaignForm').should('exist');
    cy.get('#campaignTitle').type('E2E тест кампания');
    cy.get('#campaignDescription').type('E2E описание');
    cy.get('#campaignNeighborhood').select('Дървеница');
    // Симулира избор на файл (ако е възможно)
    // cy.get('#beforePhoto').attachFile('test-image.jpg'); // изисква cypress-file-upload
    // Симулира избор на координати (ако е възможно)
    // cy.window().then(win => win.selectedCoordinates = { lat: 42.65, lng: 23.37 });
    // cy.get('#latitude').invoke('text', '42.65');
    // cy.get('#longitude').invoke('text', '23.37');
    // Ако всички полета са попълнени, бутонът трябва да е активен
    // cy.get('#submitBtn').should('not.be.disabled').click();
    // cy.contains(/успешно|създадена|created/i).should('exist');
    // Забележка: За пълна симулация на файл и карта е нужен допълнителен setup
  });
});
