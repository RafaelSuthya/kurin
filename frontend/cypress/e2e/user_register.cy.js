describe('User Register flow', () => {
  const t = Date.now();
  const name = `user_${t}`;
  const email = `user_${t}@example.com`;
  const password = 'secret123';

  it('berhasil daftar user dengan data valid', () => {
    cy.on('uncaught:exception', (err) => { throw err });
    cy.visit('/register');

    cy.contains('Username');
    cy.get('input[placeholder="Username"]').clear().type(name);

    cy.contains('Email');
    cy.get('input[placeholder="Email"]').clear().type(email);

    cy.contains('Password');
    cy.get('input[placeholder="Password"]').clear().type(password);

    cy.contains('Confirm Password');
    cy.get('input[placeholder="Confirm Password"]').clear().type(password);

    cy.contains('REGISTER').click();

    cy.get('.message').should('be.visible');
    cy.get('.message').invoke('text').then((txt) => {
      expect(txt.length).to.be.greaterThan(0);
    });
  });
});