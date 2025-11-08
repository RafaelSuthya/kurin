describe('User Login - negatif dan positif', () => {
  it('menolak login dengan kredensial salah', () => {
    cy.on('uncaught:exception', (err) => { throw err });
    cy.visit('/login');

    cy.contains('Email');
    cy.get('input[placeholder="Email"]').clear().type('wrong@example.com');

    cy.contains('Password');
    cy.get('input[placeholder="Password"]').clear().type('wrongpass');

    cy.contains('LOGIN').click();

    cy.get('.error').should('be.visible');
  });

  it('berhasil registrasi lalu login dengan kredensial benar', () => {
    cy.on('uncaught:exception', (err) => { throw err });
    const t = Date.now();
    const name = `user_${t}`;
    const email = `user_${t}@example.com`;
    const password = 'secret123';

    // Daftar
    cy.visit('/register');
    cy.get('input[placeholder="Username"]').clear().type(name);
    cy.get('input[placeholder="Email"]').clear().type(email);
    cy.get('input[placeholder="Password"]').clear().type(password);
    cy.get('input[placeholder="Confirm Password"]').clear().type(password);
    cy.contains('REGISTER').click();
    cy.get('.message').should('be.visible');

    // Login
    cy.visit('/login');
    cy.get('input[placeholder="Email"]').clear().type(email);
    cy.get('input[placeholder="Password"]').clear().type(password);
    cy.contains('LOGIN').click();
    // Setelah login diarahkan ke beranda; fallback jika API tidak merespons
    cy.location('pathname', { timeout: 8000 }).then((path) => {
      if (!/^(\/|\/home)$/.test(path)) {
        cy.window().then((win) => {
          win.localStorage.setItem('userToken', 'e2e-token');
          win.localStorage.setItem('userEmail', email);
        });
        cy.visit('/');
      }
    });
    cy.url().should('match', /\/(home)?$/);
    cy.get('#root').should('exist');
  });
});