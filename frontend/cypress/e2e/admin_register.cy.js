describe('Admin Register - kode unik', () => {
  const timestamp = Date.now();
  const username = `admin_${timestamp}`;
  const email = `admin_${timestamp}@example.com`;
  const password = 'secret123';

  it('menampilkan error saat kode unik salah', () => {
    cy.on('uncaught:exception', (err) => { throw err });
    cy.visit('/admin/register');

    cy.contains('Username');
    cy.get('input[type="text"]').first().clear().type(username);

    cy.contains('Email');
    cy.get('input[type="email"]').clear().type(email);

    cy.contains('Password');
    cy.get('input[type="password"]').eq(0).clear().type(password);

    cy.contains('Konfirmasi Password');
    cy.get('input[type="password"]').eq(1).clear().type(password);

    cy.contains('Kode Unik Admin');
    cy.get('input[placeholder="Masukkan kode unik"]').clear().type('999');

    cy.contains('REGISTER').click();

    cy.contains('Invalid unique code.').should('be.visible');
  });

  it('berhasil registrasi saat kode unik benar', () => {
    cy.on('uncaught:exception', (err) => { throw err });
    cy.visit('/admin/register');

    cy.get('input[type="text"]').first().clear().type(`${username}_ok`);
    cy.get('input[type="email"]').clear().type(`ok_${email}`);
    cy.get('input[type="password"]').eq(0).clear().type(password);
    cy.get('input[type="password"]').eq(1).clear().type(password);
    cy.get('input[placeholder="Masukkan kode unik"]').clear().type('123');

    cy.contains('REGISTER').click();

    cy.contains('Registrasi berhasil! Silakan cek email Anda untuk verifikasi.').should('be.visible');
  });
});