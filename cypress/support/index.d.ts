/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command pentru login rapid
     * @example cy.login('admin@test.com', 'password123')
     */
    login(email: string, password: string): Chainable<void>;
    
    /**
     * Custom command pentru logout
     * @example cy.logout()
     */
    logout(): Chainable<void>;
  }
}
