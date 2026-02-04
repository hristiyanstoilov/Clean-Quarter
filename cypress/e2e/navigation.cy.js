// cypress/e2e/navigation.cy.js
// E2E тест: навигация между основни страници

describe('Навигация между страници', () => {
  it('Може да навигира от начална страница към dashboard, rewards и profile', () => {
    cy.visit('/');
    cy.get('a').contains(/dashboard|табло/i).click({force: true});
    cy.url().should('include', '/dashboard');
    cy.get('a').contains(/rewards|награди/i).click({force: true});
    cy.url().should('include', '/rewards');
    cy.get('a').contains(/profile|профил/i).click({force: true});
    cy.url().should('include', '/profile');
  });

  it('Може да навигира към create-campaign и admin, и обратно към начална страница', () => {
    cy.visit('/src/pages/dashboard.html');
    cy.get('a').contains(/create|нова|кампания/i).click({force: true});
    cy.url().should('include', '/create-campaign');
    cy.get('a,button').contains(/dashboard|табло|начало/i).click({force: true});
    cy.url().should('include', '/dashboard');
    cy.get('a').contains(/admin|админ/i).click({force: true});
    cy.url().should('include', '/admin');
    cy.get('a,button').contains(/dashboard|табло|начало/i).click({force: true});
    cy.url().should('include', '/dashboard');
    cy.get('a').contains(/начало|login|вход/i).click({force: true});
    cy.url().should('include', '/index');
  });
});
