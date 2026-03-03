describe('Dashboard Tests', () => {
  beforeEach(() => {
    // Login înainte de fiecare test
    cy.fixture('testData').then((data) => {
      cy.visit('/authenticate');
      cy.get('input[name="email"], input[type="email"]').type(data.users.admin.email);
      cy.get('input[name="password"], input[type="password"]').type(data.users.admin.password);
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
    cy.get('nav, .navbar, mat-toolbar').should('be.visible');
  });

  // Test 13: Verifică navigarea din dashboard
  it('13. Should navigate to different sections from dashboard', () => {
    cy.visit('/dashboard');
    cy.contains('Users', { matchCase: false }).click();
    cy.url().should('match', /users|utilizatori/i);
  });

  // Test 14: Verifică afișarea statisticilor
  it('14. Should display statistics on dashboard', () => {
    cy.visit('/dashboard');
    cy.get('.statistic, .stat-card, .metric').should('have.length.greaterThan', 0);
  });

  // Test 15: Verifică responsivitatea meniului
  it('15. Should toggle sidebar/menu on mobile', () => {
    cy.viewport('iphone-x');
    cy.visit('/dashboard');
    cy.get('.menu-toggle, .hamburger, mat-icon').contains('menu').click();
    cy.get('.sidebar, .menu-panel, mat-sidenav').should('be.visible');
  });
});
