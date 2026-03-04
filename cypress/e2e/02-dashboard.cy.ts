describe('Dashboard Tests', () => {
  beforeEach(() => {
    // Login înainte de fiecare test
    cy.fixture('testData').then((data) => {
      cy.visit('/authenticate');
      cy.get('input[type="email"]').type(data.users.admin.email);
      cy.get('input[type="password"]').type(data.users.admin.password);
      cy.get('button[type="submit"]').click();
      cy.url().should('not.include', '/authenticate');
    });
  });

  // Test 11: Verifică încărcarea dashboard-ului
  it('11. Should load dashboard after login', () => {
    cy.visit('/dashboard');
    cy.url().should('include', '/dashboard');
    cy.get('h1, h2, .dashboard-title').should('be.visible');
  });

  // Test 12: Verifică elementele principale din dashboard
  it('12. Should display main dashboard components', () => {
    cy.visit('/dashboard');
    cy.get('.card, mat-card, .dashboard-card').should('have.length.greaterThan', 0);
    cy.get('.dashboard-header').should('be.visible');
  });

  // Test 13: Verifică navigarea către mesagerie
  it('13. Should navigate to messages from dashboard', () => {
    cy.visit('/dashboard');
    cy.get('button[routerLink="/mesagerie"]').click();
    cy.url().should('include', '/mesagerie');
  });

  // Test 14: Verifică afișarea statisticilor
  it('14. Should display statistics on dashboard', () => {
    cy.visit('/dashboard');
    cy.get('.statistic, .stat-card, .metric, .badge').should('have.length.greaterThan', 0);
  });

  // Test 15: Verifică butonul de logout
  it('15. Should logout successfully', () => {
    cy.visit('/dashboard');
    cy.contains('Logout').click();
    cy.url().should('eq', 'http://localhost:4200/');
  });

  // Test 16: Verifică afișarea numelui utilizatorului
  it('16. Should display user name in header', () => {
    cy.visit('/dashboard');
    cy.get('.dashboard-header h2').should('contain', 'Bună');
  });

  // Test 17: Verifică navigarea către profil
  it('17. Should navigate to user profile', () => {
    cy.visit('/dashboard');
    cy.contains('Profil').click();
    cy.url().should('include', '/user/');
  });

  // Test 18: Verifică funcționalitatea de căutare pacienți
  it('18. Should search for patients', () => {
    cy.visit('/dashboard');
    cy.get('input[placeholder*="Caută"]').should('be.visible').type('test');
    cy.get('.patient-card, .alert-info').should('exist');
  });

  // Test 19: Verifică afișarea calendarului de programări
  it('19. Should display appointments calendar', () => {
    cy.visit('/dashboard');
    cy.get('.calendar-container').should('be.visible');
    cy.get('.calendar-header').should('contain', '2026');
  });

  // Test 20: Verifică butoanele de navigare calendar
  it('20. Should navigate between months in calendar', () => {
    cy.visit('/dashboard');
    cy.get('.calendar-header button').first().click();
    cy.get('.calendar-header h6').should('be.visible');
    cy.get('.calendar-header button').last().click();
    cy.get('.calendar-header h6').should('be.visible');
  });
});
