describe('User Management Tests', () => {
  beforeEach(() => {
    // Login ca administrator
    cy.fixture('testData').then((data) => {
      cy.visit('/authenticate');
      cy.get('input[type="email"]').type(data.users.admin.email);
      cy.get('input[type="password"]').type(data.users.admin.password);
      cy.get('button[type="submit"]').click();
      cy.wait(1000);
    });
  });

  // Test 27: Verifică încărcarea paginii de creare utilizator
  it('27. Should load user creation page', () => {
    cy.visit('/user');
    cy.url().should('include', '/user');
    cy.get('h2.page-title').should('be.visible');
  });

  // Test 28: Verifică afișarea formularului de creare utilizator
  it('28. Should display user creation form', () => {
    cy.visit('/user');
    cy.get('form').should('be.visible');
    cy.get('input[formControlName="nume"]').should('be.visible');
    cy.get('input[formControlName="email"]').should('be.visible');
  });

  // Test 29: Verifică validarea câmpurilor obligatorii
  it('29. Should validate required fields', () => {
    cy.visit('/user');
    cy.get('button[type="submit"]').should('be.disabled');
    cy.get('input[formControlName="nume"]').type('Test').blur();
    cy.get('input[formControlName="prenume"]').focus().blur();
    cy.get('.invalid-feedback').should('be.visible');
  });

  // Test 30: Verifică validarea formatului email
  it('30. Should validate email format', () => {
    cy.visit('/user');
    cy.get('input[formControlName="email"]').type('invalid-email').blur();
    cy.get('.invalid-feedback').should('contain', 'Format email invalid');
  });

  // Test 31: Verifică validarea datei de naștere
  it('31. Should validate birth date', () => {
    cy.visit('/user');
    cy.get('input[formControlName="data_nasterii"]').type('2030-01-01').blur();
    cy.get('.invalid-feedback').should('contain', 'viitor');
  });

  // Test 32: Verifică că butonul submit este dezactivat când formularul este invalid
  it('32. Should disable submit button when form is invalid', () => {
    cy.visit('/user');
    cy.get('button[type="submit"]').should('be.disabled');
    cy.get('input[formControlName="nume"]').type('Test');
    cy.get('button[type="submit"]').should('be.disabled');
  });

  // Test 33: Verifică că toți câmpii obligatorii sunt marcați
  it('33. Should mark all required fields', () => {
    cy.visit('/user');
    cy.get('span.text-danger').should('have.length.greaterThan', 5);
  });

  // Test 34: Verifică dropdown-ul pentru sex
  it('34. Should display sex dropdown options', () => {
    cy.visit('/user');
    cy.get('select[formControlName="sex"]').should('be.visible');
    cy.get('select[formControlName="sex"] option').should('have.length.greaterThan', 1);
  });

  // Test 35: Verifică completarea câmpului telefon
  it('35. Should allow phone number input', () => {
    cy.visit('/user');
    cy.get('input[formControlName="numar_telefon"]').type('0712345678');
    cy.get('input[formControlName="numar_telefon"]').should('have.value', '0712345678');
  });

  // Test 36: Verifică afișarea secțiunilor formularului
  it('36. Should display form sections', () => {
    cy.visit('/user');
    cy.get('.section-title').should('have.length.greaterThan', 1);
    cy.contains('Informații Personale').should('be.visible');
    cy.contains('Informații Cont').should('be.visible');
  });

  // Test 37: Verifică navigarea către login
  it('37. Should have link to login page', () => {
    cy.visit('/user');
    cy.contains('Conectează-te aici').should('be.visible').click();
    cy.url().should('include', '/authenticate');
  });
});
