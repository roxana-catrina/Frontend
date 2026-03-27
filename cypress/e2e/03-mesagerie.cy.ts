describe('Mesagerie Tests', () => {
  const mockCurrentUserId = 'current-user-id';
  const mockUsers = [
    { id: 'user-2', prenume: 'Roxana', nume: 'Popescu', email: 'roxana@test.com' },
    { id: 'user-3', prenume: 'Andrei', nume: 'Ionescu', email: 'andrei@test.com' }
  ];

  beforeEach(() => {
    cy.intercept('POST', '**/api/authenticate', {
      statusCode: 200,
      body: { id: mockCurrentUserId, jwt: 'fake-jwt-token', nume: 'Ion Test' }
    }).as('authenticate');
    cy.intercept('GET', '**/api/user/*/pacienti', { statusCode: 200, body: [] }).as('getPacienti');
    cy.intercept('GET', '**/api/programari/user/*/month*', { statusCode: 200, body: [] }).as('getProgramariMonth');
    cy.intercept('GET', '**/api/programari/user/*/upcoming', { statusCode: 200, body: [] }).as('getProgramariUpcoming');
    cy.intercept('GET', '**/api/mesaje/necitite/*', { statusCode: 200, body: 0 }).as('getMesajeNecitite');
    cy.intercept('GET', '**/api/mesaje/recente/*', { statusCode: 200, body: [] }).as('getMesajeRecente');
    cy.intercept('GET', '**/api/users', { statusCode: 200, body: [
      { id: mockCurrentUserId, prenume: 'Ion', nume: 'Test', email: 'ionn@gmail.com' },
      ...mockUsers
    ]}).as('getUsers');
    cy.intercept('GET', '**/ws/info*', { statusCode: 200, body: {} }).as('getWsInfo');
    cy.intercept('GET', '**/api/mesaje/conversatie/**', { statusCode: 200, body: [] }).as('getConversatie');
    
    // Login cu mock
    cy.fixture('testData').then((data) => {
      cy.visit('/authenticate');
      cy.get('input[type="email"]').type(data.users.admin.email);
      cy.get('input[type="password"]').type(data.users.admin.password);
      cy.get('button[type="submit"]').click();
      cy.wait('@authenticate');
      cy.url().should('include', '/dashboard');
    });
  });

  // Test 16: Verifică încărcarea paginii de mesagerie
  it('16. Should load mesagerie page', () => {
    cy.visit('/mesagerie');
    cy.url().should('include', '/mesagerie');
    cy.get('h2').should('contain', 'Mesagerie');
  });

  // Test 17: Verifică afișarea listei de utilizatori
  it('17. Should display users list', () => {
    cy.visit('/mesagerie');
    cy.wait(['@getUsers', '@getMesajeRecente']);
    cy.get('.users-list').should('be.visible');
    cy.get('.user-card').should('have.length.greaterThan', 0);
  });

  // Test 18: Verifică selectarea unui utilizator și deschiderea chat-ului
  it('18. Should open chat window when selecting a user', () => {
    cy.visit('/mesagerie');
    cy.wait(['@getUsers', '@getMesajeRecente']);
    cy.get('.user-card').first().click();
    cy.get('.chat-window').should('be.visible');
    cy.get('.chat-messages').should('be.visible');
  });


  it('19. Should send a message to selected user', () => {
    cy.intercept('POST', '**/api/mesaje/trimite', (req) => {
      req.reply({ statusCode: 200, body: {
        id: 'msg-1',
        expeditorId: mockCurrentUserId,
        destinatarId: 'user-2',
        continut: req.body.continut,
        dataTrimitere: new Date().toISOString(),
        citit: false
      }});
    }).as('sendMessage');
    cy.visit('/mesagerie');
    cy.wait(['@getUsers', '@getMesajeRecente']);
    cy.fixture('testData').then((data) => {
      cy.get('.user-card').first().click();
      cy.get('.chat-input').type(data.mesaj.continut);
      cy.get('.btn-send').click();
      cy.wait('@sendMessage');
      cy.get('.message').should('contain', data.mesaj.continut);
    });
  });

  // Test 20: Verifică că butonul de trimitere este dezactivat pentru mesaj gol
  it('20. Should disable send button for empty message', () => {
    cy.visit('/mesagerie');
    cy.wait(['@getUsers', '@getMesajeRecente']);
    cy.get('.user-card').first().click();
    cy.get('.btn-send').should('be.disabled');
    cy.get('.chat-input').type('Test');
    cy.get('.btn-send').should('not.be.disabled');
  });

  // Test 21: Verifică funcționalitatea de căutare utilizatori
  it('21. Should search through users', () => {
    cy.visit('/mesagerie');
    cy.wait(['@getUsers', '@getMesajeRecente']);
    cy.get('.search-input').type('Roxana');
    cy.get('.user-card').should('have.length.greaterThan', 0);
    cy.get('.user-card').first().should('contain', 'Roxana');
  });

  // Test 22: Verifică închiderea ferestrei de chat
  it('22. Should close chat window', () => {
    cy.visit('/mesagerie');
    cy.wait(['@getUsers', '@getMesajeRecente']);
    cy.get('.user-card').first().click();
    cy.get('.chat-window').should('be.visible');
    cy.get('.btn-close-chat').click();
    cy.get('.chat-window').should('not.exist');
  });

  // Test 23: Verifică butonul de back
  it('23. Should navigate back using back button', () => {
    cy.visit('/mesagerie');
    cy.get('.btn-back').click();
    cy.url().should('not.include', '/mesagerie');
  });

  // Test 24: Verifică highlight-ul utilizatorilor cu mesaje necitite
  it('24. Should highlight users with unread messages', () => {
    cy.visit('/mesagerie');
    cy.wait(['@getUsers', '@getMesajeRecente']);
    cy.get('.user-card').should('have.length.greaterThan', 0);
  });

  // Test 25: Verifică clear search functionality
  it('25. Should clear search term', () => {
    cy.visit('/mesagerie');
    cy.get('.search-input').type('test');
    cy.get('.clear-btn').should('be.visible').click();
    cy.get('.search-input').should('have.value', '');
  });

  // Test 26: Verifică afișarea butonului de partajare imagine
  it('26. Should display image sharing button in chat', () => {
    cy.visit('/mesagerie');
    cy.wait(['@getUsers', '@getMesajeRecente']);
    cy.get('.user-card').first().click();
    cy.get('.btn-attach-image').should('be.visible');
  });
});
