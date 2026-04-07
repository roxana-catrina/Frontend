describe('User Management', () => {
  it('27. Should load user creation page', () => {
    cy.visit('/user');
    cy.url().should('include', '/user');
    cy.get('h2.page-title').should('be.visible');
  });

  
  it('28. Should display user creation form', () => {
    cy.visit('/user');
    cy.get('form').should('be.visible');
    cy.get('input[formControlName="nume"]').should('be.visible');
    cy.get('input[formControlName="email"]').should('be.visible');
  });

  it('29. Should validate required fields', () => {
    cy.visit('/user');
    cy.get('button[type="submit"]').should('be.disabled');
    cy.get('input[formControlName="nume"]').type('Test').blur();
    cy.get('input[formControlName="prenume"]').focus().blur();
    cy.get('.invalid-feedback').should('be.visible');
  });

 
  it('30. Should validate email format', () => {
    cy.visit('/user');
    const invalidEmails = [
      'invalid-email',
      'test@',
      '@domain.com',
      '.user@',
      'user domain.com',
      'user@.com',
      'user@..com',
      'user@@domain.com'
    ];

    invalidEmails.forEach((email) => {
      cy.get('input[formControlName="email"]').clear().type(email).blur();
      cy.get('.invalid-feedback').should('contain', 'Format email invalid');
    });
  });

 
  it('31. Should validate birth date', () => {
    cy.visit('/user');

    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const futureOffsets = [1, 3, 7];

    futureOffsets.forEach((offset) => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + offset);

      cy.get('input[formControlName="data_nasterii"]')
        .clear()
        .type(formatDate(futureDate))
        .blur();

      cy.get('.invalid-feedback').should('contain', 'viitor');
    });
  });

  
  it('32. Should disable submit button when form is invalid', () => {
    cy.visit('/user');
    cy.get('button[type="submit"]').should('be.disabled');
    cy.get('input[formControlName="nume"]').type('Test');
    cy.get('button[type="submit"]').should('be.disabled');
  });

  
  it('33. Should mark all required fields', () => {
    cy.visit('/user');
    cy.get('span.text-danger').should('have.length.greaterThan', 5);
  });

 
  it('34. Should display sex dropdown options', () => {
    cy.visit('/user');
    cy.get('select[formControlName="sex"]').should('be.visible');
    cy.get('select[formControlName="sex"] option').should('have.length.greaterThan', 1);
  });


  it('35. Should allow phone number input', () => {
    cy.visit('/user');
    cy.get('input[formControlName="numar_telefon"]').type('0712345678');
    cy.get('input[formControlName="numar_telefon"]').should('have.value', '0712345678');
  });

 
  it('36. Should display form sections', () => {
    cy.visit('/user');
    cy.get('.section-title').should('have.length.greaterThan', 1);
    cy.contains('Informații Personale').should('be.visible');
    cy.contains('Informații Cont').should('be.visible');
  });

  it('37. Should have link to login page', () => {
    cy.visit('/user');
    cy.contains('Conectează-te aici').should('be.visible').click();
    cy.url().should('include', '/authenticate');
  });
});
