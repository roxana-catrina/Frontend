describe('Password Reset Tests', () => {
  // Test 41: Verifică încărcarea paginii "Forgot Password"
  it('41. Should load forgot password page', () => {
    cy.visit('/forgot-password');
    cy.url().should('include', '/forgot-password');
    cy.get('h1, h2, .page-title').should('be.visible');
    cy.get('input[type="email"], input[name="email"]').should('be.visible');
  });

  // Test 42: Verifică trimiterea emailului pentru resetare parolă
  it('42. Should send password reset email', () => {
    cy.visit('/forgot-password');
    cy.fixture('testData').then((data) => {
      cy.get('input[type="email"], input[name="email"]').type(data.users.admin.email);
      cy.get('button[type="submit"]').click();
      cy.contains(/email sent|email trimis|check your email/i, { timeout: 10000 })
        .should('be.visible');
    });
  });

  // Test 43: Verifică validarea emailului în forma de "Forgot Password"
  it('43. Should validate email in forgot password form', () => {
    cy.visit('/forgot-password');
    cy.get('input[type="email"], input[name="email"]').type('invalid-email');
    cy.get('button[type="submit"]').click();
    cy.get('mat-error, .error-message').should('be.visible');
  });

  // Test 44: Verifică formularul de resetare parolă
  it('44. Should load reset password form with token', () => {
    // Simulăm accesarea cu un token
    cy.visit('/reset-password?token=test-token-123');
    cy.url().should('include', '/reset-password');
    cy.get('input[type="password"], input[name="password"]').should('be.visible');
    cy.get('input[name="confirmPassword"], input[name="confirm"]').should('be.visible');
  });

  // Test 45: Verifică resetarea parolei cu parole care nu se potrivesc
  it('45. Should show error for mismatched passwords', () => {
    cy.visit('/reset-password?token=test-token-123');
    cy.get('input[type="password"], input[name="password"]').first().type('NewPassword123!');
    cy.get('input[name="confirmPassword"], input[name="confirm"]').type('DifferentPassword123!');
    cy.get('button[type="submit"]').click();
    cy.contains(/not match|nu corespund/i).should('be.visible');
  });
});
