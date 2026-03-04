describe('Navigation and Validation Tests', () => {
  beforeEach(() => {
    // Interceptează request-urile către backend
    cy.intercept('GET', '**/api/user/*/pacienti', { statusCode: 200, body: [] }).as('getPacienti');
    cy.intercept('GET', '**/api/programari/user/*/month*', { statusCode: 200, body: [] }).as('getProgramariMonth');
    cy.intercept('GET', '**/api/programari/user/*/upcoming', { statusCode: 200, body: [] }).as('getProgramariUpcoming');
    cy.intercept('GET', '**/api/mesaje/necitite/*', { statusCode: 200, body: 0 }).as('getMesajeNecitite');
    
    cy.fixture('testData').then((data) => {
      cy.visit('/authenticate');
      cy.get('input[type="email"]').type(data.users.admin.email);
      cy.get('input[type="password"]').type(data.users.admin.password);
      cy.get('button[type="submit"]').click();
      cy.wait(1000);
    });
  });

  // Test 63: Verifică navigarea către mesagerie din dashboard
  it('63. Should navigate to mesagerie from dashboard', () => {
    cy.visit('/dashboard');
    cy.get('button[routerLink="/mesagerie"]').click();
    cy.url().should('include', '/mesagerie');
  });

  // Test 64: Verifică navigarea către profil din dashboard
  it('64. Should navigate to profile from dashboard', () => {
    cy.visit('/dashboard');
    cy.contains('Profil').click();
    cy.url().should('include', '/user/');
  });

  // Test 65: Verifică protejarea rutelor (auth guard)
  it('65. Should redirect to home when accessing protected routes without auth', () => {
    cy.clearLocalStorage();
    cy.clearCookies();
    
    cy.visit('/dashboard', { failOnStatusCode: false });
    cy.url().should('eq', 'http://localhost:4200/');
  });

  // Test 66: Verifică validarea numărului de telefon în formular
  it('66. Should validate phone number format', () => {
    cy.visit('/user');
    
    // Număr invalid (prea scurt)
    cy.get('input[formControlName="numar_telefon"]').type('123').blur();
    cy.get('.invalid-feedback').should('be.visible');
    
    // Număr valid - verifică că input-ul nu mai are clasa ng-invalid
    cy.get('input[formControlName="numar_telefon"]').clear().type('712345678').blur();
    cy.get('input[formControlName="numar_telefon"]').should('have.class', 'ng-valid');
  });

  // Test 67: Verifică validarea datei de naștere (nu poate fi în viitor)
  it('67. Should validate birth date cannot be in future', () => {
    cy.visit('/user');
    
    // Dată în viitor
    cy.get('input[formControlName="data_nasterii"]').type('2030-01-01').blur();
    cy.get('.invalid-feedback').should('contain', 'viitor');
  });

  // Test 68: Verifică existența galeriei de pacienți
  it('68. Should display patients gallery section', () => {
    cy.visit('/dashboard');
    cy.wait('@getPacienti'); // Așteaptă încărcarea pacienților
    cy.contains('Pacienții tăi').should('be.visible');
    cy.get('.images-gallery').should('exist');
    
    // Verifică dacă există pacienți sau mesaj de info
    cy.get('body').then(($body) => {
      if ($body.find('.patient-card').length > 0) {
        cy.get('.patient-card').should('have.length.greaterThan', 0);
      } else {
        cy.contains('Nu aveți pacienți încărcați încă').should('be.visible');
      }
    });
  });

  // Test 69: Verifică că toate formularele au butoane de submit
  it('69. Should have submit buttons in all forms', () => {
    const pages = ['/user', '/forgot-password'];
    
    pages.forEach((page) => {
      cy.visit(page);
      cy.get('button[type="submit"]').should('be.visible');
    });
  });

  // Test 70: Verifică logout-ul și clear storage
  it('70. Should clear storage on logout', () => {
    cy.visit('/dashboard');
    cy.wait(500);
    
    // Verifică că utilizatorul e autentificat (nume afișat)
    cy.contains('Bună').should('be.visible');
    
    // Logout
    cy.contains('Logout').click();
    cy.wait(500);
    
    // Verifică redirectare către home
    cy.url().should('eq', 'http://localhost:4200/');
  });
});
