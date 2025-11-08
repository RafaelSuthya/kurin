describe('Public pages smoke', () => {
  const pages = [
    '/',
    '/keranjang',
    '/checkout-static',
    '/company-profile',
    '/contact',
    '/terms',
  ];

  it('memuat semua halaman publik tanpa error', () => {
    cy.on('uncaught:exception', (err) => { throw err });
    pages.forEach((path) => {
      cy.visit(path);
      cy.get('#root').should('exist');
      cy.get('#root').children().should('have.length.greaterThan', 0);
    });
  });
});