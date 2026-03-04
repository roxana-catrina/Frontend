describe('Medical Images Tests', () => {
  beforeEach(() => {
    // Interceptează request-urile către backend
    cy.intercept('GET', '**/api/user/*/pacienti', { statusCode: 200, body: [] }).as('getPacienti');
    cy.intercept('GET', '**/api/programari/user/*/month*', { statusCode: 200, body: [] }).as('getProgramariMonth');
    cy.intercept('GET', '**/api/programari/user/*/upcoming', { statusCode: 200, body: [] }).as('getProgramariUpcoming');
    cy.intercept('GET', '**/api/mesaje/necitite/*', { statusCode: 200, body: 0 }).as('getMesajeNecitite');
    
    // Login înainte de fiecare test
    cy.fixture('testData').then((data) => {
      cy.visit('/authenticate');
      cy.get('input[type="email"]').type(data.users.doctor.email);
      cy.get('input[type="password"]').type(data.users.doctor.password);
      cy.get('button[type="submit"]').click();
      cy.wait(1000);
    });
  });

  // Test 38: Verifică încărcarea paginii de imagini (dashboard)
  it('38. Should load medical images page', () => {
    cy.visit('/dashboard');
    cy.url().should('include', '/dashboard');
    cy.get('h2').should('be.visible');
  });

  // Test 39: Verifică afișarea secțiunii de upload imagini
  it('39. Should display image upload section', () => {
    cy.visit('/dashboard');
    cy.contains('Încărcare Imagine Medicală').should('be.visible');
    cy.get('input[type="file"]').should('exist');
  });

  // Test 40: Verifică existența butonului de upload
  it('40. Should have upload button', () => {
    cy.visit('/dashboard');
    cy.contains('button', 'Încarcă cu Imagine').should('exist');
  });

  // Test 41: Verifică că butonul upload este dezactivat fără fișier
  it('41. Should disable upload button without file', () => {
    cy.visit('/dashboard');
    cy.contains('button', 'Încarcă cu Imagine').should('be.disabled');
  });

  // Test 42: Verifică butonul de analiză tumoare
  it('42. Should have tumor analysis button', () => {
    cy.visit('/dashboard');
    cy.contains('button', 'Analizează Tumoare').should('exist');
  });

  // Test 43: Verifică afișarea galeriei de pacienți
  it('43. Should display patients gallery', () => {
    cy.visit('/dashboard');
    cy.contains('Pacienții tăi').should('be.visible');
    cy.get('.patient-card, .images-gallery').should('exist');
  });

  // Test 44: Verifică funcționalitatea de căutare pacienți în dashboard
  it('44. Should search patients in dashboard', () => {
    cy.visit('/dashboard');
    cy.get('input[placeholder*="Caută"]').should('be.visible').type('test');
  });

  // Test 45: Verifică formularul de informații pacient
  it('45. Should display patient information form', () => {
    cy.visit('/dashboard');
    cy.get('input').should('have.length.greaterThan', 5);
    cy.get('label').contains('Nume').should('be.visible');
  });

  // Test 46: Verifică butonul de creare pacient fără imagine
  it('46. Should have button to create patient without image', () => {
    cy.visit('/dashboard');
    cy.contains('button', 'Creează Pacient').should('be.visible');
  });

  // Test 47: Verifică afișarea rezultatului de predicție
  it('47. Should display prediction result area', () => {
    cy.visit('/dashboard');
    cy.get('.card-body').should('exist');
  });
});
