describe('Dashboard Tests', () => {
  const mockPacienti = [
    {
      id: 'pac-1',
      userId: 'user-1',
      numePacient: 'Popescu',
      prenumePacient: 'Mihai',
      sex: 'MASCULIN',
      detalii: 'Detalii test',
      dataNasterii: '1975-01-04',
      cnp: '1750105127656',
      numarTelefon: '0754327654',
      istoricMedical: 'Fără antecedente',
      imagini: []
    },
    {
      id: 'pac-2',
      userId: 'user-1',
      numePacient: 'Ionescu',
      prenumePacient: 'Maria',
      sex: 'FEMININ',
      detalii: '',
      dataNasterii: '1990-06-15',
      cnp: '2900615123456',
      numarTelefon: '0761234567',
      istoricMedical: '',
      imagini: []
    }
  ];

  const mockProgramariMonth = [
    {
      id: 'prog-1',
      pacientId: 'pac-1',
      pacientNume: 'Popescu',
      pacientPrenume: 'Mihai',
      pacientCnp: '1750105127656',
      dataProgramare: new Date(Date.now() + 2 * 24 * 60
       * 60 * 1000).toISOString(),
      durataMinute: 30,
      tipConsultatie: 'Consultație generală',
      status: 'PROGRAMAT',
      detalii: 'Control periodic'
    }
  ];

  const mockProgramariUpcoming = [
    {
      id: 'prog-1',
      pacientId: 'pac-1',
      pacientNume: 'Popescu',
      pacientPrenume: 'Mihai',
      pacientCnp: '1750105127656',
      dataProgramare: new Date(Date.now() + 2 * 24 * 60 
      * 60 * 1000).toISOString(),
      durataMinute: 30,
      tipConsultatie: 'Consultație generală',
      status: 'PROGRAMAT',
      detalii: 'Control periodic'
    },
    {
      id: 'prog-2',
      pacientId: 'pac-2',
      pacientNume: 'Ionescu',
      pacientPrenume: 'Maria',
      pacientCnp: '2900615123456',
      dataProgramare: new Date(Date.now() + 5 * 24 * 60 *
       60 * 1000).toISOString(),
      durataMinute: 45,
      tipConsultatie: 'Evaluare imagistică',
      status: 'CONFIRMAT',
      detalii: 'RMN cranian'
    }
  ];

  beforeEach(() => {
    cy.intercept('GET', '**/api/user/*/pacienti', 
      { statusCode: 200, body: mockPacienti }).as('getPacienti');
    cy.intercept('GET', '**/api/programari/user/*/month*',
       { statusCode: 200, body: mockProgramariMonth }).as('getProgramariMonth');
    cy.intercept('GET', '**/api/programari/user/*/upcoming', 
      { statusCode: 200, body: mockProgramariUpcoming }).as('getProgramariUpcoming');
    cy.intercept('GET', '**/api/mesaje/necitite/*',
       { statusCode: 200, body: 3 }).as('getMesajeNecitite');
    cy.intercept('GET', '**/api/mesaje/recente/*',
       { statusCode: 200, body: [] }).as('getMesajeRecente');
    
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

  it('12. Should display main dashboard components', () => {
    cy.visit('/dashboard');
    cy.wait('@getPacienti');
    cy.get('.card').should('have.length.greaterThan', 0);
    cy.get('.dashboard-header').should('be.visible');
    cy.get('.patient-card').should('have.length', 2);
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
    cy.wait(['@getPacienti', '@getProgramariUpcoming']);
    cy.get('.stat-card').should('have.length.greaterThan', 0);
    // Verifică badge-ul de mesaje necitite
    cy.get('.badge.bg-danger').should('contain', '3');
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
    cy.wait('@getPacienti');
    // Verifică că toți pacienții sunt afișați inițial
    cy.get('.patient-card').should('have.length', 2);
    // Caută un pacient existent
    cy.get('input[placeholder*="Caută"]').should('be.visible').type('Popescu');
    cy.get('.patient-card').should('have.length', 1);
    cy.get('.patient-card').first().should('contain', 'Popescu');
  });

  // Test 19: Verifică afișarea calendarului de programări
  it('19. Should display appointments calendar', () => {
    cy.visit('/dashboard');
    cy.wait(['@getProgramariMonth', '@getProgramariUpcoming']);
    cy.get('.calendar-container').should('be.visible');
    cy.get('.calendar-header').should('contain', '2026');
    // Verifică că programările viitoare sunt afișate
    cy.get('.appointment-item').should('have.length', 2);
    cy.get('.appointment-item').first().should('contain', 'Popescu');
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
