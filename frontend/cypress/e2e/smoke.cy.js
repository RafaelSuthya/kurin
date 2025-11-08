describe('Smoke test - homepage', () => {
  it('loads homepage without errors and shows main content', () => {
    // Fail if there is any uncaught exception
    cy.on('uncaught:exception', (err) => {
      // Let the test fail to surface real runtime errors
      throw err
    })

    cy.visit('/')

    // CRA apps mount into #root; check it exists and has children
    cy.get('#root').should('exist')
    cy.get('#root').children().should('have.length.greaterThan', 0)

    // Basic sanity: page has some text rendered
    cy.contains(/home|beranda|produk|cart|keranjang/i, { matchCase: false }).should('exist')
  })
})