import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let supabaseClient: any = null;

function getSupabase() {
  if (supabaseClient) return supabaseClient;
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || '';

  if (!supabaseUrl || (!supabaseAnonKey && !supabaseServiceRole)) {
    console.error('[Supabase] Missing credentials! URL:', !!supabaseUrl, 'Key:', !!(supabaseAnonKey || supabaseServiceRole));
    return null;
  }

  // Use service role for backend operations to bypass RLS if needed, or anon key for standard operations
  supabaseClient = createClient(supabaseUrl, supabaseServiceRole || supabaseAnonKey);
  return supabaseClient;
}

// Proxy to allow using "supabase" globally while supporting lazy initialization
const supabase = new Proxy({}, {
  get(target, prop) {
    const client = getSupabase();
    if (!client) {
      return () => { throw new Error('Supabase client not initialized. Check environment variables.'); };
    }
    return client[prop];
  }
}) as any;

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/api', async (req, res, next) => {
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(500).json({ 
        error: 'Supabase credentials missing',
        message: 'Por favor, configure as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Vercel.'
      });
    }
    (req as any).supabase = supabase;
    next();
  });

  // Legacy PHP Redirects
  app.all('/user_register.php', (req, res) => res.redirect(307, '/api/auth/register'));
  app.all('/user_login.php', (req, res) => res.redirect(307, '/api/auth/login'));
  app.all('/auth.php', (req, res) => res.redirect(307, '/api/auth/admin-login'));

  // Health check
  app.get('/api/health', (req, res) => res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    vercel: !!process.env.VERCEL,
    env: process.env.NODE_ENV
  }));
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

  apiRouter.get('/leagues', async (req, res) => {
    try {
      const { data: leagues, error: leagueError } = await supabase.from('leagues').select('*');
      if (leagueError) throw leagueError;

      const results = await Promise.all((leagues || []).map(async (league) => {
        const { data: championships, error: champError } = await supabase.from('championships').select('*').eq('league_id', league.id);
        const { data: officials, error: officialError } = await supabase.from('officials').select('*').eq('league_id', league.id);
        const { data: posts, error: postError } = await supabase.from('posts').select('*').eq('league_id', league.id);

        const fullChampionships = await Promise.all((championships || []).map(async (champ) => {
          const { data: clubs, error: clubError } = await supabase.from('clubs').select('*').eq('championship_id', champ.id);
          const fullClubs = await Promise.all((clubs || []).map(async (club) => {
            const { data: players, error: playerError } = await supabase.from('players').select('*').eq('club_id', club.id);
            const { data: staff, error: staffError } = await supabase.from('technical_staff').select('*').eq('club_id', club.id);
            return {
              id: club.id,
              name: club.name,
              abbreviation: club.abbreviation,
              logoUrl: club.logo_url,
              whatsapp: club.whatsapp,
              isPaid: !!club.is_paid,
              players: (players || []).map(p => ({
                id: p.id,
                name: p.name,
                nickname: p.nickname,
                position: p.position,
                goals: p.goals,
                photoUrl: p.photo_url,
                birthDate: p.birth_date,
                cpf: p.cpf
              })),
              technicalStaff: staff || []
            };
          }));

          const { data: matches, error: matchError } = await supabase.from('matches').select('*').eq('championship_id', champ.id);

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
            matches: (matches || []).map((m: any) => ({
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
              events: m.events || [],
              homeLineup: m.home_lineup || [],
              awayLineup: m.away_lineup || [],
              homeTeam: fullClubs.find(c => c.id === m.home_team_id) || { id: m.home_team_id, name: 'Desconhecido' },
              awayTeam: fullClubs.find(c => c.id === m.away_team_id) || { id: m.away_team_id, name: 'Desconhecido' }
            }))
          };
        }));

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
          referees: (officials || []).filter(o => o.type === 'referee').map(o => ({
            id: o.id,
            name: o.name,
            nickname: o.nickname,
            cpf: o.cpf,
            bankAccount: o.bank_account,
            role: o.role,
            type: 'referee'
          })),
          tableOfficials: (officials || []).filter(o => o.type === 'table_official').map(o => ({
            id: o.id,
            name: o.name,
            nickname: o.nickname,
            cpf: o.cpf,
            bankAccount: o.bank_account,
            role: o.role,
            type: 'table_official'
          })),
          posts: (posts || []).map(p => ({
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
      }));
      res.json(results);
    } catch (error: any) {
      console.error('Error fetching leagues:', error);
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/auth/admin-login', async (req, res) => {
    const { email, password } = req.body;
    console.log(`Login attempt for admin: ${email}`);
    try {
      const { data: league, error } = await supabase.from('leagues').select('*').eq('admin_email', email).single();
      
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

  apiRouter.post('/auth/register', async (req, res) => {
    const { full_name, email, password } = req.body;
    console.log(`Registration attempt for: ${email}`);
    const id = Math.random().toString(36).substr(2, 9);
    const hash = bcrypt.hashSync(password, 10);
    const photo_url = `https://ui-avatars.com/api/?name=${encodeURIComponent(full_name)}&background=0D8ABC&color=fff`;
    try {
      const { data, error } = await supabase.from('users').insert({
        id, full_name, email, password_hash: hash, photo_url
      }).select().single();

      if (error) throw error;

      console.log(`User registered successfully: ${email}`);
      res.json({ id, full_name, email, photo_url, is_paid: true });
    } catch (error: any) {
      console.error('Registration Error:', error);
      let errorMessage = error.message || 'Erro desconhecido no servidor';
      if (errorMessage.includes('unique constraint') || errorMessage.includes('duplicate key')) {
        errorMessage = 'Este e-mail já está cadastrado. Tente fazer login ou use outro.';
      }
      res.status(500).json({ 
        error: errorMessage
      });
    }
  });

  apiRouter.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(`User login attempt: ${email}`);
    try {
      const { data: user, error } = await supabase.from('users').select('*').eq('email', email).single();
      
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

  apiRouter.get('/ads', async (req, res) => {
    try {
      const { data, error } = await supabase.from('ads').select('*').eq('active', true);
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.get('/posts', async (req, res) => {
    const { league_id } = req.query;
    try {
      const { data, error } = await supabase.from('posts').select('*').eq('league_id', league_id).order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/posts', async (req, res) => {
    const { league_id, title, content, image_url, author_name, author_photo } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    try {
      const { data, error } = await supabase.from('posts').insert({
        id, league_id, title, content, image_url, author_name, author_photo
      }).select().single();
      
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/upload', (req, res) => {
    // For demo purposes, we'll just return a success message and a dummy URL
    // In a real app we'd use multer or similar
    res.json({ success: true, url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800' });
  });

  apiRouter.post('/officials/update', async (req, res) => {
    const { id, name, nickname, cpf, bankAccount, role } = req.body;
    console.log(`Updating official ${id} (${name})`);
    try {
      const { error } = await supabase.from('officials').update({
        name, nickname, cpf, bank_account: bankAccount || req.body.bank_account, role
      }).eq('id', id);

      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      console.error('Update official error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/matches/update', async (req, res) => {
    const { id, homeScore, awayScore, date, location, status, refereeId, assistant1Id, assistant2Id, tableOfficialId, homeLineup, awayLineup, events } = req.body;
    try {
      const { error } = await supabase.from('matches').update({
        home_score: homeScore,
        away_score: awayScore,
        match_date: date,
        location,
        status,
        referee_id: refereeId,
        assistant1_id: assistant1Id,
        assistant2_id: assistant2Id,
        table_official_id: tableOfficialId,
        home_lineup: homeLineup,
        away_lineup: awayLineup,
        events: events
      }).eq('id', id);

      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      console.error('Update match error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/clubs/create', async (req, res) => {
    const { championship_id, name, abbreviation, logo_url, whatsapp } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    try {
      const { data, error } = await supabase.from('clubs').insert({
        id, championship_id, name, abbreviation, logo_url, whatsapp
      }).select().single();

      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/players/create', async (req, res) => {
    const { club_id, name, nickname, position, cpf, birth_date, photo_url } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    try {
      const { data, error } = await supabase.from('players').insert({
        id, club_id, name, nickname, position, cpf, birth_date, photo_url
      }).select().single();

      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/players/update', async (req, res) => {
    const { id, name, nickname, position, cpf, birth_date, photo_url } = req.body;
    try {
      const { error } = await supabase.from('players').update({
        name, nickname, position, cpf, birth_date, photo_url
      }).eq('id', id);

      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/players/delete', async (req, res) => {
    const { id } = req.body;
    try {
      const { error } = await supabase.from('players').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/clubs/update', async (req, res) => {
      const { id, name, abbreviation, logo_url, whatsapp } = req.body;
      try {
          const { error } = await supabase.from('clubs').update({
              name, abbreviation, logo_url, whatsapp
          }).eq('id', id);

          if (error) throw error;
          res.json({ success: true });
      } catch (error: any) {
          res.status(500).json({ error: error.message });
      }
  });

  apiRouter.post('/officials/delete', async (req, res) => {
    const { id } = req.body;
    try {
      const { error } = await supabase.from('officials').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/championships/save_financials', async (req, res) => {
    const { championship_id, financials } = req.body;
    console.log(`Saving financials for championship ${championship_id}`);
    try {
      const { error } = await supabase.from('championships').update({
        referee_fee: financials.refereeFee,
        assistant_fee: financials.assistantFee,
        table_official_fee: financials.tableOfficialFee,
        field_fee: financials.fieldFee,
        yellow_card_fine: financials.yellowCardFine,
        red_card_fine: financials.redCardFine,
        registration_fee_per_club: financials.registrationFeePerClub,
        player_registration_deadline: financials.playerRegistrationDeadline
      }).eq('id', championship_id);

      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      console.error('Save financials error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/staff/create', async (req, res) => {
    const { club_id, name, role } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    try {
      const { data, error } = await supabase.from('technical_staff').insert({
        id, club_id, name, role
      }).select().single();

      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/clubs/update-registration-status', async (req, res) => {
    const { championship_id, club_id, is_paid } = req.body;
    try {
      const { error } = await supabase.from('clubs').update({
        is_paid: is_paid
      }).eq('id', club_id).eq('championship_id', championship_id);

      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      console.error('Update registration status error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/staff/update', async (req, res) => {
    const { id, name, role } = req.body;
    try {
      const { error } = await supabase.from('technical_staff').update({
        name, role
      }).eq('id', id);

      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/staff/delete', async (req, res) => {
    const { id } = req.body;
    try {
      const { error } = await supabase.from('technical_staff').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/leagues/create', async (req, res) => {
    const { name, slug, logo_url, cover_url, admin_email, city, state } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    try {
      const { data, error } = await supabase.from('leagues').insert({
        id, name, slug, logo_url, cover_url, admin_email, city, state
      }).select().single();

      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/championships/create', async (req, res) => {
    const { league_id, name } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    try {
      const { data, error } = await supabase.from('championships').insert({
        id, league_id, name
      }).select().single();

      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/officials/create', async (req, res) => {
    const { league_id, type, name, nickname, cpf, bank_account, role } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    try {
      const { data, error } = await supabase.from('officials').insert({
        id, league_id, type, name, nickname, cpf, bank_account, role
      }).select().single();

      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/matches/batch', async (req, res) => {
    const { championship_id, matches } = req.body;
    try {
      // Supabase doesn't have a direct "delete and insert" transaction like SQLite here easily
      // We'll delete and then bulk insert
      const { error: deleteError } = await supabase.from('matches').delete().eq('championship_id', championship_id);
      if (deleteError) throw deleteError;

      const matchesToInsert = matches.map((match: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        championship_id,
        round: match.round,
        home_team_id: match.home_team_id,
        away_team_id: match.away_team_id,
        status: 'scheduled'
      }));

      const { error: insertError } = await supabase.from('matches').insert(matchesToInsert);
      if (insertError) throw insertError;

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/fines/update', async (req, res) => {
    const { championship_id, club_id, round, is_paid } = req.body;
    console.log(`Updating fine for club ${club_id} in round ${round}`);
    try {
      const { data: existing, error: findError } = await supabase.from('club_fines')
        .select('id')
        .eq('championship_id', championship_id)
        .eq('club_id', club_id)
        .eq('round', round)
        .maybeSingle();

      if (findError) throw findError;

      if (existing) {
        const { error: updateError } = await supabase.from('club_fines')
          .update({ is_paid })
          .eq('id', existing.id);
        if (updateError) throw updateError;
      } else {
        const id = Math.random().toString(36).substr(2, 9);
        const { error: insertError } = await supabase.from('club_fines').insert({
          id, championship_id, club_id, round, amount: 50, is_paid
        });
        if (insertError) throw insertError;
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

  // Vite integration (Only for non-production environments)
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import('vite');
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
        console.log(`[SPA Fallback] Serving index.html for ${url} using Vite`);
        
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
    // Production behavior (Vercel or manual deployment)
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    app.get('*', (req, res) => {
      // Don't intercept API requests that reached this far (they are truly 404)
      if (req.url.startsWith('/api')) {
        return res.status(404).json({ error: 'API route not found' });
      }
      
      // Serve the app's index.html for all other routes to support SPA routing
      // On Vercel, we might need a different path or just let Vercel handle it via vercel.json
      res.sendFile(path.join(distPath, 'index.html'), (err) => {
        if (err) {
          // If we are on Vercel and it's not found here, it's likely handled by vercel.json
          // but we provide a fallback message.
          console.error('[Production] index.html not found at', path.join(distPath, 'index.html'));
          res.status(404).send('Not Found');
        }
      });
    });
  }

  const PORT = 3000;
  
  // Only listen if we are not in Vercel environment (Vercel handles the server start)
  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  }

  return app;
}

let appPromise: Promise<any> | null = null;

const handler = async (req: any, res: any) => {
  if (!appPromise) {
    console.log('[Handler] Starting server initialization...');
    appPromise = startServer();
  }
  const app = await appPromise;
  return app(req, res);
};

export default handler;
