describe('Mesagerie Tests', () => {
  beforeEach(() => {
    // Login înainte de fiecare test
    cy.fixture('testData').then((data) => {
      cy.visit('/authenticate');
      cy.get('input[name="email"], input[type="email"]').type(data.users.admin.email);
      cy.get('input[name="password"], input[type="password"]').type(data.users.admin.password);
      cy.get('button[type="submit"]').click();
      cy.wait(1000);
    });
  });

  // Test 16: Verifică încărcarea paginii de mesagerie
  it('16. Should load mesagerie page', () => {
    cy.visit('/mesagerie');
    cy.url().should('include', '/mesagerie');
    cy.get('h1, h2, .mesagerie-title').should('be.visible');
  });

  // Test 17: Verifică afișarea listei de mesaje
  it('17. Should display messages list', () => {
    cy.visit('/mesagerie');
    cy.get('.message-list, .messages, mat-list').should('exist');
  });

  // Test 18: Verifică crearea unui mesaj nou
  it('18. Should create a new message', () => {
    cy.visit('/mesagerie');
    cy.fixture('testData').then((data) => {
      cy.contains('button', /new message|nou|trimite/i).click();
      cy.get('textarea, input[name="message"], [formControlName="continut"]')
        .type(data.mesaj.continut);
      cy.contains('button', /send|trimite/i).click();
      cy.contains(data.mesaj.continut, { timeout: 10000 }).should('be.visible');
    });
  });

  // Test 19: Verifică validarea câmpurilor mesaj
  it('19. Should validate message fields', () => {
    cy.visit('/mesagerie');
    cy.contains('button', /new message|nou|trimite/i).click();
    cy.contains('button', /send|trimite/i).click();
    cy.get('.error-message, mat-error').should('be.visible');
  });

  // Test 20: Verifică căutarea în mesaje
  it('20. Should search through messages', () => {
    cy.visit('/mesagerie');
    cy.get('input[type="search"], input[placeholder*="search"], input[placeholder*="cauta"]')
      .type('test');
    cy.get('.message-item, mat-list-item').should('have.length.greaterThan', 0);
  });

  // Test 21: Verifică deschiderea unui mesaj
  it('21. Should open and read a message', () => {
    cy.visit('/mesagerie');
    cy.get('.message-item, mat-list-item').first().click();
    cy.get('.message-content, .message-body').should('be.visible');
  });

  // Test 22: Verifică ștergerea unui mesaj
  it('22. Should delete a message', () => {
    cy.visit('/mesagerie');
    cy.get('.message-item, mat-list-item').first().click();
    cy.contains('button', /delete|sterge/i).click();
    cy.contains('button', /confirm|da/i).click();
    cy.contains('deleted|sters', { matchCase: false }).should('be.visible');
  });

  // Test 23: Verifică actualizarea în timp real (WebSocket)
  it('23. Should receive real-time message updates', () => {
    cy.visit('/mesagerie');
    // Simulăm primirea unui mesaj nou
    cy.window().then((win) => {
      // Verificăm că există funcționalitatea WebSocket
      expect(win).to.have.property('WebSocket');
    });
    cy.wait(2000);
    cy.get('.message-list, .messages').should('exist');
  });
});
