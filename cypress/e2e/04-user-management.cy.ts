describe('User Management Tests', () => {
  beforeEach(() => {
    // Login ca administrator
    cy.fixture('testData').then((data) => {
      cy.visit('/authenticate');
      cy.get('input[name="email"], input[type="email"]').type(data.users.admin.email);
      cy.get('input[name="password"], input[type="password"]').type(data.users.admin.password);
      cy.get('button[type="submit"]').click();
      cy.wait(1000);
    });
  });

  // Test 24: Verifică încărcarea paginii de utilizatori
  it('24. Should load users list page', () => {
    cy.visit('/user');
    cy.url().should('include', '/user');
    cy.get('h1, h2, .page-title').should('be.visible');
  });

  // Test 25: Verifică afișarea tabelului cu utilizatori
  it('25. Should display users table', () => {
    cy.visit('/user');
    cy.get('table, mat-table, .users-table').should('be.visible');
    cy.get('tr, mat-row').should('have.length.greaterThan', 1);
  });

  // Test 26: Verifică navigarea la formularul de adăugare utilizator
  it('26. Should navigate to add user form', () => {
    cy.visit('/user');
    cy.contains('button', /add|adauga|nou/i).click();
    cy.url().should('include', '/user');
  });

  // Test 27: Verifică crearea unui utilizator nou
  it('27. Should create a new user', () => {
    cy.visit('/user');
    const randomEmail = `test${Date.now()}@test.com`;
    
    cy.get('input[name="email"], [formControlName="email"]').type(randomEmail);
    cy.get('input[name="password"], [formControlName="password"]').type('Test123!');
    cy.get('input[name="firstName"], [formControlName="firstName"]').type('Test');
    cy.get('input[name="lastName"], [formControlName="lastName"]').type('User');
    cy.get('button[type="submit"]').click();
    
    cy.contains('success|succes', { matchCase: false, timeout: 10000 }).should('be.visible');
  });

  // Test 28: Verifică validarea formularului de utilizator
  it('28. Should validate user form fields', () => {
    cy.visit('/user');
    cy.get('button[type="submit"]').click();
    cy.get('mat-error, .error-message').should('have.length.greaterThan', 0);
  });

  // Test 29: Verifică editarea unui utilizator
  it('29. Should edit an existing user', () => {
    cy.visit('/user');
    cy.get('button, mat-icon').contains(/edit|modifica/i).first().click();
    cy.url().should('include', '/user');
    
    cy.get('input[name="firstName"], [formControlName="firstName"]')
      .clear()
      .type('Updated Name');
    cy.get('button[type="submit"]').click();
    
    cy.contains('success|succes', { matchCase: false }).should('be.visible');
  });

  // Test 30: Verifică căutarea utilizatorilor
  it('30. Should search for users', () => {
    cy.visit('/user');
    cy.get('input[type="search"], input[placeholder*="search"]').type('test');
    cy.wait(500);
    cy.get('tr, mat-row').should('have.length.greaterThan', 0);
  });

  // Test 31: Verifică sortarea tabelului de utilizatori
  it('31. Should sort users table', () => {
    cy.visit('/user');
    cy.get('th, mat-header-cell').contains(/name|nume/i).click();
    cy.wait(500);
    cy.get('tr, mat-row').should('have.length.greaterThan', 1);
  });

  // Test 32: Verifică filtrarea utilizatorilor
  it('32. Should filter users by role', () => {
    cy.visit('/user');
    cy.get('select, mat-select').contains(/role|rol/i).click();
    cy.contains('mat-option, option', /admin/i).click();
    cy.wait(500);
    cy.get('tr, mat-row').should('exist');
  });

  // Test 33: Verifică ștergerea unui utilizator
  it('33. Should delete a user', () => {
    cy.visit('/user');
    cy.get('button, mat-icon').contains(/delete|sterge/i).last().click();
    cy.contains('button', /confirm|da/i).click();
    cy.contains('deleted|sters', { matchCase: false }).should('be.visible');
  });
});
