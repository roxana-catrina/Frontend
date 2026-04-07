describe('Medical Images Tests', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/user/*/pacienti').as('getPacienti');
    cy.intercept('GET', '**/api/programari/user/*/month*', { statusCode: 200, body: [] }).as('getProgramariMonth');
    cy.intercept('GET', '**/api/programari/user/*/upcoming', { statusCode: 200, body: [] }).as('getProgramariUpcoming');
    cy.intercept('GET', '**/api/mesaje/necitite/*', { statusCode: 200, body: 0 }).as('getMesajeNecitite');
    
    cy.fixture('testData').then((data) => {
      cy.visit('/authenticate');
      cy.get('input[type="email"]').type(data.users.doctor.email);
      cy.get('input[type="password"]').type(data.users.doctor.password);
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/dashboard');
      cy.wait('@getPacienti');
    });
  });

  it('38. Should load medical images page', () => {
    cy.visit('/dashboard');
    cy.url().should('include', '/dashboard');
    cy.get('h2').should('be.visible');
  });

  it('39. Should display image upload section', () => {
    cy.visit('/dashboard');
    cy.contains('Încărcare Imagine Medicală').should('be.visible');
    cy.get('input[type="file"]').should('exist');
  });

  it('40. Should have upload button', () => {
    cy.visit('/dashboard');
    cy.contains('button', 'Încarcă cu Imagine').should('exist');
  });

  it('41. Should disable upload button without file', () => {
    cy.visit('/dashboard');
    cy.contains('button', 'Încarcă cu Imagine').should('be.disabled');
  });

  it('42. Should have tumor analysis button', () => {
    cy.visit('/dashboard');
    cy.contains('button', 'Analizează Tumoare').should('exist');
  });

  it('43. Should display patients gallery', () => {
    cy.visit('/dashboard');
    cy.contains('Pacienții tăi').should('be.visible');
    cy.get('.patient-card, .images-gallery').should('exist');
  });

  it('44. Should search patients in dashboard', () => {
    cy.visit('/dashboard');
    cy.get('input[placeholder*="Caută"]').should('be.visible').type('test');
  });

  it('45. Should display patient information form', () => {
    cy.visit('/dashboard');
    cy.get('input').should('have.length.greaterThan', 5);
    cy.get('label').contains('Nume').should('be.visible');
  });

  it('46. Should have button to create patient without image', () => {
    cy.visit('/dashboard');
    cy.contains('button', 'Creează Pacient').should('be.visible');
  });

  it('47. Should display prediction result area', () => {
    cy.visit('/dashboard');
    cy.get('.card-body').should('exist');
  });
});
