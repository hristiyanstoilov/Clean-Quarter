// cypress/e2e/login.cy.js
// E2E тест: login/logout flow (валидира само UI, не реален auth)

describe('Login/Logout Flow', () => {
  it('Показва login форма и позволява въвеждане на данни', () => {
    cy.visit('/');
    cy.get('#loginForm').should('exist');
    cy.get('#loginEmail').type('testuser@example.com');
    cy.get('#loginPassword').type('testpassword');
    cy.get('#loginForm button[type=submit]')
      .contains(/вход|login|sign in/i)
      .should('exist');
  });

  it('Logout бутон се вижда след login (ако е наличен)', () => {
    // Тук се валидира само наличието на бутона, не реален logout
    cy.visit('/src/pages/dashboard.html');
    cy.get('#logoutBtn').should('exist');
  });
});
