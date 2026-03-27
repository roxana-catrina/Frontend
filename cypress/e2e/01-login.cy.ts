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
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  // Test 3: Login cu credențiale valide
  it('3. Should login successfully with valid credentials', () => {
    cy.fixture('testData').then((data) => {
      cy.get('input[type="email"]').type(data.users.admin.email);
      cy.get('input[type="password"]').type(data.users.admin.password);
      cy.get('button[type="submit"]').click();
      cy.url().should('not.include', '/authenticate');
    });
  });

  // Test 4: Login cu email invalid
  it('4. Should show validation error for invalid email format', () => {
    cy.get('input[type="email"]').type('invalid-email').blur();
    cy.get('.error-message').should('be.visible').and('contain', 'Format email invalid');
  });

  // Test 5: Login cu parolă goală
  it('5. Should show validation error for empty password', () => {
    cy.get('input[type="email"]').type('test@test.com');
    cy.get('input[type="password"]').focus().blur();
    cy.get('.error-message').should('be.visible').and('contain', 'Parola este obligatorie');
    cy.get('button[type="submit"]').should('be.disabled');
  });

  // Test 6: Login cu email gol
  it('6. Should show validation error for empty email', () => {
    cy.get('input[type="password"]').type('password123');
    cy.get('input[type="email"]').focus().blur();
    cy.get('.error-message').should('be.visible').and('contain', 'Email-ul este obligatoriu');
    cy.get('button[type="submit"]').should('be.disabled');
  });

  it('7. Should show error for wrong credentials', () => {
    cy.fixture('testData').then((data) => {
      cy.get('input[type="email"]').type(data.users.invalidUser.email);
      cy.get('input[type="password"]').type(data.users.invalidUser.password);
      cy.get('button[type="submit"]').click();
      cy.get('.alert-error', { timeout: 10000 }).should('be.visible');
    });
  });

  // Test 8: Verifică link-ul "Forgot Password"
  it('8. Should navigate to forgot password page', () => {
    cy.get('a[routerLink="/forgot-password"]').click();
    cy.url().should('include', '/forgot-password');
  });

  // Test 9: Verifică că butonul este dezactivat când formularul este invalid
  it('9. Should disable submit button when form is invalid', () => {
    cy.get('button[type="submit"]').should('be.disabled');
    cy.get('input[type="email"]').type('invalid-email');
    cy.get('input[type="password"]').type('test123');
    cy.get('button[type="submit"]').should('be.disabled');
  });

  it('10. Should validate email format in real-time', () => {
    cy.get('input[type="email"]').type('invalidemail').blur();
    cy.get('.error-message').should('be.visible').and('contain', 'Format email invalid');
    cy.get('input[type="email"]').clear().type('valid@email.com').blur();
    cy.get('.error-message').should('not.exist');
  });

  // Test 11: Verifică că butonul devine enabled când formularul este valid
  it('11. Should enable submit button when form becomes valid', () => {
    cy.get('button[type="submit"]').should('be.disabled');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('button[type="submit"]').should('be.disabled');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').should('not.be.disabled');
  });

  // Test 12: Verifică navigarea către pagina de creare cont
  it('12. Should navigate to register page', () => {
    cy.get('a[routerLink="/user"]').should('be.visible').click();
    cy.url().should('include', '/user');
  });

  // Test 13: Verifică că mesajul de eroare se ascunde când se închide
  it('13. Should hide error message when close button is clicked', () => {
    cy.fixture('testData').then((data) => {
      cy.get('input[type="email"]').type(data.users.invalidUser.email);
      cy.get('input[type="password"]').type(data.users.invalidUser.password);
      cy.get('button[type="submit"]').click();
      cy.get('.alert-error', { timeout: 10000 }).should('be.visible');
      cy.get('.alert-close').click();
      cy.get('.alert-error').should('not.exist');
    });
  });
});
