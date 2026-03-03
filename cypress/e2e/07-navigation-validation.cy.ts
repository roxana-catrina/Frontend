describe('Navigation and Validation Tests', () => {
  beforeEach(() => {
    cy.fixture('testData').then((data) => {
      cy.visit('/authenticate');
      cy.get('input[name="email"], input[type="email"]').type(data.users.admin.email);
      cy.get('input[name="password"], input[type="password"]').type(data.users.admin.password);
      cy.get('button[type="submit"]').click();
      cy.wait(1000);
    });
  });

  // Test 46: Verifică navigarea între pagini
  it('46. Should navigate between different pages', () => {
    cy.visit('/dashboard');
    
    // Navighează la utilizatori
    cy.contains('a, button', /users|utilizatori/i).click();
    cy.url().should('match', /users|utilizatori/i);
    
    // Navighează la mesagerie
    cy.contains('a, button', /messages|mesagerie/i).click();
    cy.url().should('include', 'mesagerie');
    
    // Revine la dashboard
    cy.visit('/dashboard');
    cy.url().should('include', 'dashboard');
  });

  // Test 47: Verifică protejarea rutelor (auth guard)
  it('47. Should protect routes from unauthorized access', () => {
    cy.clearLocalStorage();
    cy.clearCookies();
    
    cy.visit('/dashboard', { failOnStatusCode: false });
    cy.url().should('include', '/authenticate');
    
    cy.visit('/user', { failOnStatusCode: false });
    cy.url().should('include', '/authenticate');
  });

  // Test 48: Verifică validarea CNP-ului
  it('48. Should validate CNP format', () => {
    cy.visit('/user');
    
    // CNP invalid
    cy.get('input[name="cnp"], [formControlName="cnp"]').type('123');
    cy.get('input[name="cnp"], [formControlName="cnp"]').blur();
    cy.get('mat-error, .error-message').should('be.visible');
    
    // CNP valid (13 cifre)
    cy.get('input[name="cnp"], [formControlName="cnp"]').clear().type('1234567890123');
    cy.get('input[name="cnp"], [formControlName="cnp"]').blur();
    cy.get('mat-error').should('not.exist');
  });

  // Test 49: Verifică validarea numărului de telefon
  it('49. Should validate phone number format', () => {
    cy.visit('/user');
    
    // Număr invalid
    cy.get('input[name="phone"], [formControlName="telefon"]').type('123');
    cy.get('input[name="phone"], [formControlName="telefon"]').blur();
    cy.get('mat-error, .error-message').should('be.visible');
    
    // Număr valid
    cy.get('input[name="phone"], [formControlName="telefon"]').clear().type('0712345678');
    cy.get('input[name="phone"], [formControlName="telefon"]').blur();
    cy.get('mat-error').should('not.exist');
  });

  // Test 50: Verifică responsivitatea aplicației
  it('50. Should be responsive on different screen sizes', () => {
    const viewports = [
      { device: 'iphone-x', width: 375, height: 812 },
      { device: 'ipad-2', width: 768, height: 1024 },
      { device: 'macbook-15', width: 1440, height: 900 }
    ];
    
    viewports.forEach((viewport) => {
      cy.viewport(viewport.width, viewport.height);
      cy.visit('/dashboard');
      cy.get('nav, mat-toolbar, .navbar').should('be.visible');
      cy.get('main, .main-content, mat-sidenav-content').should('be.visible');
    });
  });
});
