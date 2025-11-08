describe('Navigasi kategori dari Beranda', () => {
  it('memilih kategori dan membuka halaman kategori', () => {
    cy.on('uncaught:exception', (err) => { throw err });
    cy.visit('/');

    // Jika ada kartu kategori, klik yang pertama
    cy.get('body').then(($body) => {
      const hasCatCard = $body.find('.cat-card').length > 0;
      if (hasCatCard) {
        cy.get('.cat-card').first().click();
        cy.url().should('include', '/kategori/');
        cy.get('.grid').should('exist');
      } else {
        // Jika tidak ada kategori, pastikan fallback muncul
        cy.contains('Tidak ada kategori').should('be.visible');
      }
    });
  });
});