import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database('db_futebol.sqlite');

// Initialize database tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS leagues (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    admin_email TEXT UNIQUE NOT NULL,
    admin_password_hash TEXT,
    logo_url TEXT,
    cover_url TEXT,
    city TEXT,
    state TEXT
  );

  CREATE TABLE IF NOT EXISTS championships (
    id TEXT PRIMARY KEY,
    league_id TEXT NOT NULL,
    name TEXT NOT NULL,
    referee_fee REAL DEFAULT 0,
    assistant_fee REAL DEFAULT 0,
    table_official_fee REAL DEFAULT 0,
    field_fee REAL DEFAULT 0,
    yellow_card_fine REAL DEFAULT 0,
    red_card_fine REAL DEFAULT 0,
    registration_fee_per_club REAL DEFAULT 0,
    player_registration_deadline TEXT,
    FOREIGN KEY (league_id) REFERENCES leagues (id)
  );

  CREATE TABLE IF NOT EXISTS officials (
    id TEXT PRIMARY KEY,
    league_id TEXT NOT NULL,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    nickname TEXT,
    cpf TEXT,
    bank_account TEXT,
    role TEXT,
    FOREIGN KEY (league_id) REFERENCES leagues (id)
  );

  CREATE TABLE IF NOT EXISTS clubs (
    id TEXT PRIMARY KEY,
    championship_id TEXT NOT NULL,
    name TEXT NOT NULL,
    abbreviation TEXT,
    logo_url TEXT,
    whatsapp TEXT,
    is_paid INTEGER DEFAULT 0,
    FOREIGN KEY (championship_id) REFERENCES championships (id)
  );

  CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    club_id TEXT NOT NULL,
    name TEXT NOT NULL,
    nickname TEXT,
    position TEXT,
    goals INTEGER DEFAULT 0,
    photo_url TEXT,
    birth_date TEXT,
    cpf TEXT,
    FOREIGN KEY (club_id) REFERENCES clubs (id)
  );

  CREATE TABLE IF NOT EXISTS technical_staff (
    id TEXT PRIMARY KEY,
    club_id TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT,
    FOREIGN KEY (club_id) REFERENCES clubs (id)
  );

  CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    championship_id TEXT NOT NULL,
    round INTEGER,
    home_team_id TEXT NOT NULL,
    away_team_id TEXT NOT NULL,
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    match_date TEXT,
    location TEXT,
    status TEXT DEFAULT 'scheduled',
    referee_id TEXT,
    assistant1_id TEXT,
    assistant2_id TEXT,
    table_official_id TEXT,
    events TEXT, -- JSON
    home_lineup TEXT, -- JSON
    away_lineup TEXT, -- JSON
    FOREIGN KEY (championship_id) REFERENCES championships (id)
  );

  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    league_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    image_url TEXT,
    author_name TEXT,
    author_photo TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (league_id) REFERENCES leagues (id)
  );

  CREATE TABLE IF NOT EXISTS club_fines (
    id TEXT PRIMARY KEY,
    championship_id TEXT NOT NULL,
    club_id TEXT NOT NULL,
    round INTEGER NOT NULL,
    amount REAL DEFAULT 0,
    is_paid INTEGER DEFAULT 0,
    FOREIGN KEY (championship_id) REFERENCES championships (id),
    FOREIGN KEY (club_id) REFERENCES clubs (id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    photo_url TEXT,
    is_paid INTEGER DEFAULT 1,
    trial_started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    registered_league_id TEXT
  );

  CREATE TABLE IF NOT EXISTS ads (
    id TEXT PRIMARY KEY,
    brand_name TEXT NOT NULL,
    image_url TEXT,
    target_url TEXT,
    active INTEGER DEFAULT 1
  );
`);

// Seed data function
const seedData = () => {
  const leagueCount = db.prepare('SELECT COUNT(*) as count FROM leagues').get() as any;
  if (leagueCount.count === 0) {
    console.log('Seeding initial data...');
    const leagueId = 'admin-1';
    const email = 'ubashow3@gmail.com';
    const password = 'admin'; // Alterado para 'admin' por facilidade
    const hash = bcrypt.hashSync(password, 10);

    db.prepare('INSERT INTO leagues (id, name, slug, admin_email, admin_password_hash, city, state) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      leagueId, 'Minha Liga', 'minha-liga', email, hash, 'Sua Cidade', 'UF'
    );

    const champId = 'c1';
    db.prepare('INSERT INTO championships (id, league_id, name, referee_fee) VALUES (?, ?, ?, ?)').run(
      champId, leagueId, 'Campeonato Principal', 100
    );

    const club1Id = 'club1';
    db.prepare('INSERT INTO clubs (id, championship_id, name, abbreviation) VALUES (?, ?, ?, ?)').run(
      club1Id, champId, 'Palmeiras', 'PAL'
    );

    const club2Id = 'club2';
    db.prepare('INSERT INTO clubs (id, championship_id, name, abbreviation) VALUES (?, ?, ?, ?)').run(
      club2Id, champId, 'Corinthians', 'COR'
    );

    db.prepare('INSERT INTO officials (id, league_id, type, name, nickname) VALUES (?, ?, ?, ?, ?)').run(
      'ref1', leagueId, 'referee', 'Anderson Daronco', 'Daronco'
    );

    db.prepare('INSERT INTO officials (id, league_id, type, name, nickname) VALUES (?, ?, ?, ?, ?)').run(
      'table1', leagueId, 'table_official', 'Maria Silva', 'Maria'
    );
    console.log('Seed completed. Email: ubashow3@gmail.com / Password: admin');

    db.prepare('INSERT INTO ads (id, brand_name, image_url, target_url, active) VALUES (?, ?, ?, ?, ?)').run(
      'ad1', 'Nike', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', 'https://nike.com', 1
    );
  }

  // Ensure test user exists
  const email = 'ubashow3@gmail.com';
  const userExists = db.prepare('SELECT COUNT(*) as count FROM users WHERE email = ?').get(email) as any;
  if (userExists.count === 0) {
    console.log('Seeding test user...');
    const userId = 'user-1';
    const password = 'admin';
    const hash = bcrypt.hashSync(password, 10);
    const userPhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent('Usuário Teste')}&background=0D8ABC&color=fff`;
    db.prepare('INSERT INTO users (id, full_name, email, password_hash, photo_url, is_paid) VALUES (?, ?, ?, ?, ?, ?)').run(
      userId, 'Usuário Teste', email, hash, userPhoto, 1
    );
  }
};

seedData();

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Legacy PHP Redirects (Moved to root app for better compatibility)
  app.all('/user_register.php', (req, res) => res.redirect(307, '/api/auth/register'));
  app.all('/user_login.php', (req, res) => res.redirect(307, '/api/auth/login'));
  app.all('/auth.php', (req, res) => res.redirect(307, '/api/auth/admin-login'));

  // Health check/Debug routes
  app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
  app.get('/api/debug/routes', (req, res) => {
    const routes: string[] = [];
    app._router.stack.forEach((middleware: any) => {
      if (middleware.route) {
        routes.push(`${Object.keys(middleware.route.methods).join(',').toUpperCase()} ${middleware.route.path}`);
      } else if (middleware.name === 'router') {
        middleware.handle.stack.forEach((handler: any) => {
          if (handler.route) {
            routes.push(`${Object.keys(handler.route.methods).join(',').toUpperCase()} /api${handler.route.path}`);
          }
        });
      }
    });
    res.json({ routes });
  });

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - [${req.method}] ${req.url}`);
    if (req.method === 'POST') {
      console.log('Body:', JSON.stringify(req.body).substring(0, 100));
    }
    next();
  });

  const apiRouter = express.Router();

  apiRouter.get('/leagues', (req, res) => {
    try {
      const leagues = db.prepare('SELECT * FROM leagues').all() as any[];
      const results = leagues.map((league) => {
        const championships = db.prepare('SELECT * FROM championships WHERE league_id = ?').all(league.id) as any[];
        const officials = db.prepare('SELECT * FROM officials WHERE league_id = ?').all(league.id) as any[];
        const posts = db.prepare('SELECT * FROM posts WHERE league_id = ?').all(league.id) as any[];

        const fullChampionships = championships.map((champ) => {
          const clubs = db.prepare('SELECT * FROM clubs WHERE championship_id = ?').all(champ.id) as any[];
          const fullClubs = clubs.map((club) => {
            const players = db.prepare('SELECT * FROM players WHERE club_id = ?').all(club.id) as any[];
            const staff = db.prepare('SELECT * FROM technical_staff WHERE club_id = ?').all(club.id) as any[];
            return {
              id: club.id,
              name: club.name,
              abbreviation: club.abbreviation,
              logoUrl: club.logo_url,
              whatsapp: club.whatsapp,
              isPaid: !!club.is_paid,
              players: players.map(p => ({
                id: p.id,
                name: p.name,
                nickname: p.nickname,
                position: p.position,
                goals: p.goals,
                photoUrl: p.photo_url,
                birthDate: p.birth_date,
                cpf: p.cpf
              })),
              technicalStaff: staff
            };
          });

          const matches = db.prepare('SELECT * FROM matches WHERE championship_id = ?').all(champ.id) as any[];

          return {
            id: champ.id,
            name: champ.name,
            refereeFee: champ.referee_fee,
            assistantFee: champ.assistant_fee,
            tableOfficialFee: champ.table_official_fee,
            fieldFee: champ.field_fee,
            yellowCardFine: champ.yellow_card_fine,
            redCardFine: champ.red_card_fine,
            registrationFeePerClub: champ.registration_fee_per_club,
            playerRegistrationDeadline: champ.player_registration_deadline,
            clubs: fullClubs,
            matches: matches.map((m: any) => ({
              id: m.id,
              round: m.round,
              homeScore: m.home_score,
              awayScore: m.away_score,
              date: m.match_date,
              location: m.location,
              status: m.status,
              refereeId: m.referee_id,
              assistant1Id: m.assistant1_id,
              assistant2Id: m.assistant2_id,
              tableOfficialId: m.table_official_id,
              events: JSON.parse(m.events || '[]'),
              homeLineup: JSON.parse(m.home_lineup || '[]'),
              awayLineup: JSON.parse(m.away_lineup || '[]'),
              homeTeam: fullClubs.find(c => c.id === m.home_team_id) || { id: m.home_team_id, name: 'Desconhecido' },
              awayTeam: fullClubs.find(c => c.id === m.away_team_id) || { id: m.away_team_id, name: 'Desconhecido' }
            }))
          };
        });

        return {
          id: league.id,
          name: league.name,
          slug: league.slug,
          adminEmail: league.admin_email,
          logoUrl: league.logo_url,
          coverUrl: league.cover_url,
          city: league.city,
          state: league.state,
          championships: fullChampionships,
          referees: officials.filter(o => o.type === 'referee').map(o => ({
            id: o.id,
            name: o.name,
            nickname: o.nickname,
            cpf: o.cpf,
            bankAccount: o.bank_account,
            role: o.role,
            type: 'referee'
          })),
          tableOfficials: officials.filter(o => o.type === 'table_official').map(o => ({
            id: o.id,
            name: o.name,
            nickname: o.nickname,
            cpf: o.cpf,
            bankAccount: o.bank_account,
            role: o.role,
            type: 'table_official'
          })),
          posts: posts.map(p => ({
            id: p.id,
            league_id: p.league_id,
            author_name: p.author_name,
            author_photo: p.author_photo,
            title: p.title,
            content: p.content,
            imageUrl: p.image_url,
            created_at: p.created_at
          }))
        };
      });
      res.json(results);
    } catch (error: any) {
      console.error('Error fetching leagues:', error);
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/auth/admin-login', (req, res) => {
    const { email, password } = req.body;
    console.log(`Login attempt for admin: ${email}`);
    try {
      const league = db.prepare('SELECT * FROM leagues WHERE admin_email = ?').get(email) as any;
      if (league && bcrypt.compareSync(password || '', league.admin_password_hash)) {
        console.log(`Login success for admin: ${email}`);
        res.json({
          ...league,
          adminEmail: league.admin_email,
          logoUrl: league.logo_url,
          coverUrl: league.cover_url
        });
      } else {
        console.log(`Login failed for admin: ${email}`);
        res.status(401).json({ error: 'Credenciais inválidas' });
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/auth/register', (req, res) => {
    const { full_name, email, password } = req.body;
    console.log(`Registration attempt for: ${email}`);
    const id = Math.random().toString(36).substr(2, 9);
    const hash = bcrypt.hashSync(password, 10);
    const photo_url = `https://ui-avatars.com/api/?name=${encodeURIComponent(full_name)}&background=0D8ABC&color=fff`;
    try {
      db.prepare('INSERT INTO users (id, full_name, email, password_hash, photo_url) VALUES (?, ?, ?, ?, ?)').run(
        id, full_name, email, hash, photo_url
      );
      console.log(`User registered successfully: ${email}`);
      res.json({ id, full_name, email, photo_url, is_paid: true });
    } catch (error: any) {
      console.error('Registration Error:', error);
      let errorMessage = error.message || 'Erro desconhecido no servidor';
      if (errorMessage.includes('UNIQUE constraint failed: users.email')) {
        errorMessage = 'Este e-mail já está cadastrado. Tente fazer login ou use outro.';
      }
      res.status(500).json({ 
        error: errorMessage
      });
    }
  });

  apiRouter.post('/auth/login', (req, res) => {
    const { email, password } = req.body;
    console.log(`User login attempt: ${email}`);
    try {
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
      if (user && bcrypt.compareSync(password, user.password_hash)) {
        res.json({
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          photo_url: user.photo_url,
          is_paid: !!user.is_paid
        });
      } else {
        res.status(401).json({ error: 'Email ou senha inválidos' });
      }
    } catch (error: any) {
      console.error('User login error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.get('/ads', (req, res) => {
    try {
      const ads = db.prepare('SELECT * FROM ads WHERE active = 1').all();
      res.json(ads);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.get('/posts', (req, res) => {
    const { league_id } = req.query;
    try {
      const posts = db.prepare('SELECT * FROM posts WHERE league_id = ? ORDER BY created_at DESC').all(league_id);
      res.json(posts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/posts', (req, res) => {
    const { league_id, title, content, image_url, author_name, author_photo } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    try {
      db.prepare('INSERT INTO posts (id, league_id, title, content, image_url, author_name, author_photo) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        id, league_id, title, content, image_url, author_name, author_photo
      );
      const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
      res.json(post);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/upload', (req, res) => {
    // For demo purposes, we'll just return a success message and a dummy URL
    // In a real app we'd use multer or similar
    res.json({ success: true, url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800' });
  });

  apiRouter.post('/officials/update', (req, res) => {
    const { id, name, nickname, cpf, bankAccount, role } = req.body;
    console.log(`Updating official ${id} (${name})`);
    try {
      db.prepare(`
        UPDATE officials 
        SET name = ?, nickname = ?, cpf = ?, bank_account = ?, role = ? 
        WHERE id = ?
      `).run(name, nickname, cpf, bankAccount || req.body.bank_account, role, id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Update official error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/matches/update', (req, res) => {
    const { id, homeScore, awayScore, date, location, status, refereeId, assistant1Id, assistant2Id, tableOfficialId, homeLineup, awayLineup, events } = req.body;
    try {
      db.prepare(`
        UPDATE matches SET
          home_score = ?, away_score = ?, match_date = ?, location = ?, 
          status = ?, referee_id = ?, assistant1_id = ?, assistant2_id = ?, 
          table_official_id = ?, home_lineup = ?, away_lineup = ?, events = ?
        WHERE id = ?
      `).run(
        homeScore, awayScore, date, location,
        status, refereeId, assistant1Id, assistant2Id,
        tableOfficialId, JSON.stringify(homeLineup), JSON.stringify(awayLineup), JSON.stringify(events),
        id
      );
      res.json({ success: true });
    } catch (error: any) {
      console.error('Update match error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/clubs/create', (req, res) => {
    const { championship_id, name, abbreviation, logo_url, whatsapp } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    try {
      db.prepare('INSERT INTO clubs (id, championship_id, name, abbreviation, logo_url, whatsapp) VALUES (?, ?, ?, ?, ?, ?)').run(
        id, championship_id, name, abbreviation, logo_url, whatsapp
      );
      res.json({ id, name, abbreviation, logo_url, whatsapp });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/players/create', (req, res) => {
    const { club_id, name, nickname, position, cpf, birth_date, photo_url } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    try {
      db.prepare('INSERT INTO players (id, club_id, name, nickname, position, cpf, birth_date, photo_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
        id, club_id, name, nickname, position, cpf, birth_date, photo_url
      );
      res.json({ id, name, nickname, position, cpf, birth_date, photo_url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/players/update', (req, res) => {
    const { id, name, nickname, position, cpf, birth_date, photo_url } = req.body;
    try {
      db.prepare('UPDATE players SET name = ?, nickname = ?, position = ?, cpf = ?, birth_date = ?, photo_url = ? WHERE id = ?').run(
        name, nickname, position, cpf, birth_date, photo_url, id
      );
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/players/delete', (req, res) => {
    const { id } = req.body;
    try {
      db.prepare('DELETE FROM players WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/clubs/update', (req, res) => {
      const { id, name, abbreviation, logo_url, whatsapp } = req.body;
      try {
          db.prepare('UPDATE clubs SET name = ?, abbreviation = ?, logo_url = ?, whatsapp = ? WHERE id = ?').run(
              name, abbreviation, logo_url, whatsapp, id
          );
          res.json({ success: true });
      } catch (error: any) {
          res.status(500).json({ error: error.message });
      }
  });

  apiRouter.post('/officials/delete', (req, res) => {
    const { id } = req.body;
    try {
      db.prepare('DELETE FROM officials WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/championships/save_financials', (req, res) => {
    const { championship_id, financials } = req.body;
    console.log(`Saving financials for championship ${championship_id}`);
    try {
      db.prepare(`
        UPDATE championships SET 
          referee_fee = ?, 
          assistant_fee = ?, 
          table_official_fee = ?, 
          field_fee = ?, 
          yellow_card_fine = ?, 
          red_card_fine = ?, 
          registration_fee_per_club = ?,
          player_registration_deadline = ?
        WHERE id = ?
      `).run(
        financials.refereeFee,
        financials.assistantFee,
        financials.tableOfficialFee,
        financials.fieldFee,
        financials.yellowCardFine,
        financials.redCardFine,
        financials.registrationFeePerClub,
        financials.playerRegistrationDeadline,
        championship_id
      );
      res.json({ success: true });
    } catch (error: any) {
      console.error('Save financials error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/staff/create', (req, res) => {
    const { club_id, name, role } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    try {
      db.prepare('INSERT INTO technical_staff (id, club_id, name, role) VALUES (?, ?, ?, ?)').run(id, club_id, name, role);
      res.json({ id, name, role });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/clubs/update-registration-status', (req, res) => {
    const { championship_id, club_id, is_paid } = req.body;
    try {
      db.prepare('UPDATE clubs SET is_paid = ? WHERE id = ? AND championship_id = ?').run(
        is_paid ? 1 : 0, club_id, championship_id
      );
      res.json({ success: true });
    } catch (error: any) {
      console.error('Update registration status error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/staff/update', (req, res) => {
    const { id, name, role } = req.body;
    try {
      db.prepare('UPDATE technical_staff SET name = ?, role = ? WHERE id = ?').run(name, role, id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/staff/delete', (req, res) => {
    const { id } = req.body;
    try {
      db.prepare('DELETE FROM technical_staff WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/leagues/create', (req, res) => {
    const { name, slug, logo_url, cover_url, admin_email, city, state } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    try {
      db.prepare('INSERT INTO leagues (id, name, slug, logo_url, cover_url, admin_email, city, state) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
        id, name, slug, logo_url, cover_url, admin_email, city, state
      );
      res.json({ id, name, slug, logo_url, cover_url, admin_email, city, state });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/championships/create', (req, res) => {
    const { league_id, name } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    try {
      db.prepare('INSERT INTO championships (id, league_id, name) VALUES (?, ?, ?)').run(id, league_id, name);
      res.json({ id, name });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/officials/create', (req, res) => {
    const { league_id, type, name, nickname, cpf, bank_account, role } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    try {
      db.prepare('INSERT INTO officials (id, league_id, type, name, nickname, cpf, bank_account, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
        id, league_id, type, name, nickname, cpf, bank_account, role
      );
      res.json({ id, league_id, type, name, nickname, cpf, bank_account, role });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/matches/batch', (req, res) => {
    const { championship_id, matches } = req.body;
    try {
      const deleteStmt = db.prepare('DELETE FROM matches WHERE championship_id = ?');
      const insertStmt = db.prepare('INSERT INTO matches (id, championship_id, round, home_team_id, away_team_id, status) VALUES (?, ?, ?, ?, ?, ?)');
      
      const transaction = db.transaction((matchesData) => {
        deleteStmt.run(championship_id);
        for (const match of matchesData) {
          const id = Math.random().toString(36).substr(2, 9);
          insertStmt.run(id, championship_id, match.round, match.home_team_id, match.away_team_id, 'scheduled');
        }
      });
      
      transaction(matches);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/fines/update', (req, res) => {
    const { championship_id, club_id, round, is_paid } = req.body;
    console.log(`Updating fine for club ${club_id} in round ${round}`);
    try {
      const existing = db.prepare('SELECT id FROM club_fines WHERE championship_id = ? AND club_id = ? AND round = ?').get(championship_id, club_id, round) as any;
      if (existing) {
        db.prepare('UPDATE club_fines SET is_paid = ? WHERE id = ?').run(is_paid ? 1 : 0, existing.id);
      } else {
        const id = Math.random().toString(36).substr(2, 9);
        db.prepare('INSERT INTO club_fines (id, championship_id, club_id, round, amount, is_paid) VALUES (?, ?, ?, ?, ?, ?)').run(
          id, championship_id, club_id, round, 50, is_paid ? 1 : 0
        );
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error('Update fine error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.all('*', (req, res) => {
    console.log(`[API 404] ${req.method} ${req.url}`);
    res.status(404).json({ 
      error: `Route not found on server`,
      method: req.method,
      path: req.url,
      fullPath: `/api${req.url}`
    });
  });

  app.use('/api', apiRouter);

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    
    // Mount the Vite middleware
    app.use(vite.middlewares);
    
    // Fallback all other GET requests to Vite's index.html handling
    app.get('*', async (req, res, next) => {
      if (req.url.startsWith('/api')) {
        return next();
      }
      try {
        const url = req.originalUrl;
        console.log(`[SPA Fallback] Serving index.html for ${url}`);
        
        // Read index.html
        let template = await fs.readFile(path.resolve(__dirname, 'index.html'), 'utf-8');
        
        // Transform index.html with Vite (injects scripts, etc)
        template = await vite.transformIndexHtml(url, template);
        
        // Send the transformed HTML
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        console.error('[SPA Fallback Error]', e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (req.url.startsWith('/api')) {
        return res.status(404).json({ error: 'API route not found' });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
