describe('Login Tests', () => {
  beforeEach(() => {
    cy.visit('/authenticate');
  });

  // Test 1: Verifică încărcarea paginii de login
  it('1. Should load login page successfully', () => {
    cy.url().should('include', '/authenticate');
    cy.get('h1, h2, .login-title').should('be.visible');
  });

  // Test 2: Verifică elementele formularului de login
  it('2. Should display all login form elements', () => {
    cy.get('input[name="email"], input[type="email"]').should('be.visible');
    cy.get('input[name="password"], input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  // Test 3: Login cu credențiale valide
  it('3. Should login successfully with valid credentials', () => {
    cy.fixture('testData').then((data) => {
      cy.get('input[name="email"], input[type="email"]').type(data.users.admin.email);
      cy.get('input[name="password"], input[type="password"]').type(data.users.admin.password);
      cy.get('button[type="submit"]').click();
      cy.url().should('not.include', '/authenticate');
    });
  });

  // Test 4: Login cu email invalid
  it('4. Should show error for invalid email', () => {
    cy.get('input[name="email"], input[type="email"]').type('invalid-email');
    cy.get('input[name="password"], input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.get('.error-message, .alert-danger, mat-error').should('be.visible');
  });

  // Test 5: Login cu parolă goală
  it('5. Should show error for empty password', () => {
    cy.get('input[name="email"], input[type="email"]').type('test@test.com');
    cy.get('button[type="submit"]').click();
    cy.get('.error-message, .alert-danger, mat-error').should('exist');
  });

  // Test 6: Login cu email gol
  it('6. Should show error for empty email', () => {
    cy.get('input[name="password"], input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.get('.error-message, .alert-danger, mat-error').should('exist');
  });

  // Test 7: Login cu credențiale greșite
  it('7. Should show error for wrong credentials', () => {
    cy.fixture('testData').then((data) => {
      cy.get('input[name="email"], input[type="email"]').type(data.users.invalidUser.email);
      cy.get('input[name="password"], input[type="password"]').type(data.users.invalidUser.password);
      cy.get('button[type="submit"]').click();
      cy.get('.error-message, .alert-danger, .alert').should('be.visible');
    });
  });

  // Test 8: Verifică link-ul "Forgot Password"
  it('8. Should navigate to forgot password page', () => {
    cy.contains('Forgot Password', { matchCase: false }).click();
    cy.url().should('include', '/forgot-password');
  });

  // Test 9: Testează vizibilitatea parolei
  it('9. Should toggle password visibility', () => {
    cy.get('input[name="password"], input[type="password"]').type('TestPassword123');
    cy.get('button[aria-label*="password"], .toggle-password, .eye-icon').click();
    cy.get('input[name="password"]').should('have.attr', 'type', 'text');
  });

  // Test 10: Verifică validarea în timp real
  it('10. Should validate email format in real-time', () => {
    cy.get('input[name="email"], input[type="email"]').type('invalidemail').blur();
    cy.get('mat-error, .error-message').should('be.visible');
    cy.get('input[name="email"], input[type="email"]').clear().type('valid@email.com').blur();
    cy.get('mat-error, .error-message').should('not.exist');
  });
});
