describe('Medical Images Tests', () => {
  beforeEach(() => {
    // Login înainte de fiecare test
    cy.fixture('testData').then((data) => {
      cy.visit('/authenticate');
      cy.get('input[name="email"], input[type="email"]').type(data.users.doctor.email);
      cy.get('input[name="password"], input[type="password"]').type(data.users.doctor.password);
      cy.get('button[type="submit"]').click();
      cy.wait(1000);
    });
  });

  // Test 34: Verifică încărcarea paginii de imagini
  it('34. Should load medical images page', () => {
    cy.visit('/dashboard');
    cy.url().should('include', '/dashboard');
    cy.get('h1, h2, .page-title').should('be.visible');
  });

  // Test 35: Verifică afișarea galeriei de imagini
  it('35. Should display images gallery', () => {
    cy.visit('/dashboard');
    cy.get('.image-gallery, .images-grid, mat-grid-list, .card').should('exist');
  });

  // Test 36: Verifică încărcarea unei imagini noi
  it('36. Should upload a new medical image', () => {
    cy.visit('/dashboard');
    cy.contains('button', /upload|incarca/i).click();
    
    // Simulăm încărcarea unui fișier
    cy.get('input[type="file"]').selectFile({
      contents: 'cypress/fixtures/test-image.jpg',
      fileName: 'test-image.jpg',
      mimeType: 'image/jpeg'
    }, { force: true });
    
    cy.contains('button', /save|salveaza/i).click();
    cy.contains('success|succes', { matchCase: false, timeout: 15000 }).should('be.visible');
  });

  // Test 37: Verifică vizualizarea unei imagini
  it('37. Should view image details', () => {
    cy.visit('/dashboard');
    cy.get('.image-card, mat-card, .image-item').first().click();
    cy.get('.image-viewer, .image-detail').should('be.visible');
  });

  // Test 38: Verifică funcționalitatea de zoom pe imagine
  it('38. Should zoom in/out on images', () => {
    cy.visit('/dashboard');
    cy.get('.image-card, mat-card, .image-item').first().click();
    cy.get('button, mat-icon').contains(/zoom|marire/i).click();
    cy.wait(500);
    cy.get('.zoomed, .image-zoomed').should('exist');
  });

  // Test 39: Verifică filtrarea imaginilor după tip
  it('39. Should filter images by type', () => {
    cy.visit('/dashboard');
    cy.get('select, mat-select').first().click();
    cy.contains('mat-option, option', /CT|MRI|X-Ray/i).first().click();
    cy.wait(1000);
    cy.get('.image-card, mat-card').should('have.length.greaterThan', 0);
  });

  // Test 40: Verifică ștergerea unei imagini
  it('40. Should delete an image', () => {
    cy.visit('/dashboard');
    cy.get('.image-card, mat-card').first().within(() => {
      cy.get('button, mat-icon').contains(/delete|sterge/i).click();
    });
    cy.contains('button', /confirm|da/i).click();
    cy.contains('deleted|sters', { matchCase: false, timeout: 10000 }).should('be.visible');
  });
});
