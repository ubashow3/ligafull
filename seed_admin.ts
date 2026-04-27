import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database('db_futebol');

try {
  // Garante que a tabela existe
  db.exec(`
    CREATE TABLE IF NOT EXISTS leagues (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        logo_url TEXT,
        cover_url TEXT,
        admin_email VARCHAR(255) UNIQUE NOT NULL,
        admin_password_hash VARCHAR(255) NOT NULL,
        city VARCHAR(100),
        state VARCHAR(2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const email = 'ubashow3@gmail.com';
  const password = ''; // Senha vazia como solicitado
  const hash = bcrypt.hashSync(password, 10);

  const existing = db.prepare('SELECT * FROM leagues WHERE admin_email = ?').get(email);

  if (!existing) {
    db.prepare(`
      INSERT INTO leagues (id, name, slug, admin_email, admin_password_hash, city, state)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('admin-1', 'Minha Liga', 'minha-liga', email, hash, 'Sua Cidade', 'UF');
    console.log('Usuário administrador criado com sucesso!');
  } else {
    db.prepare('UPDATE leagues SET admin_password_hash = ? WHERE admin_email = ?').run(hash, email);
    console.log('Senha do administrador atualizada para vazia.');
  }
} catch (err) {
  console.error('Erro ao popular banco:', err);
} finally {
  db.close();
}
