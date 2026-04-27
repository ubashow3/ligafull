
-- Schema para LigaFull no Supabase

-- 1. Ligas
CREATE TABLE IF NOT EXISTS leagues (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    cover_url TEXT,
    admin_email TEXT UNIQUE NOT NULL,
    city TEXT,
    state TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Campeonatos
CREATE TABLE IF NOT EXISTS championships (
    id TEXT PRIMARY KEY,
    league_id TEXT REFERENCES leagues(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    referee_fee NUMERIC DEFAULT 0,
    assistant_fee NUMERIC DEFAULT 0,
    table_official_fee NUMERIC DEFAULT 0,
    field_fee NUMERIC DEFAULT 0,
    yellow_card_fine NUMERIC DEFAULT 0,
    red_card_fine NUMERIC DEFAULT 0,
    registration_fee_per_club NUMERIC DEFAULT 0,
    player_registration_deadline DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Clubes
CREATE TABLE IF NOT EXISTS clubs (
    id TEXT PRIMARY KEY,
    championship_id TEXT REFERENCES championships(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    abbreviation TEXT,
    logo_url TEXT,
    whatsapp TEXT,
    is_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Jogadores
CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    club_id TEXT REFERENCES clubs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    nickname TEXT,
    position TEXT,
    cpf TEXT,
    birth_date DATE,
    photo_url TEXT,
    goals INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Comissão Técnica
CREATE TABLE IF NOT EXISTS technical_staff (
    id TEXT PRIMARY KEY,
    club_id TEXT REFERENCES clubs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Oficiais (Árbitros e Mesários)
CREATE TABLE IF NOT EXISTS officials (
    id TEXT PRIMARY KEY,
    league_id TEXT REFERENCES leagues(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('referee', 'table_official')),
    name TEXT NOT NULL,
    nickname TEXT,
    cpf TEXT,
    bank_account TEXT,
    role TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Partidas
CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    championship_id TEXT REFERENCES championships(id) ON DELETE CASCADE,
    round INTEGER NOT NULL,
    home_team_id TEXT REFERENCES clubs(id),
    away_team_id TEXT REFERENCES clubs(id),
    home_score INTEGER,
    away_score INTEGER,
    match_date TIMESTAMP WITH TIME ZONE,
    location TEXT,
    status TEXT CHECK (status IN ('scheduled', 'in_progress', 'finished')) DEFAULT 'scheduled',
    referee_id TEXT REFERENCES officials(id),
    assistant1_id TEXT REFERENCES officials(id),
    assistant2_id TEXT REFERENCES officials(id),
    table_official_id TEXT REFERENCES officials(id),
    home_lineup JSONB DEFAULT '[]'::jsonb,
    away_lineup JSONB DEFAULT '[]'::jsonb,
    events JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Posts
CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    league_id TEXT REFERENCES leagues(id) ON DELETE CASCADE,
    author_name TEXT,
    author_photo TEXT,
    title TEXT,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Usuários
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    photo_url TEXT,
    is_paid BOOLEAN DEFAULT TRUE,
    trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    registered_league_id TEXT REFERENCES leagues(id)
);

-- 10. Anúncios
CREATE TABLE IF NOT EXISTS ads (
    id TEXT PRIMARY KEY,
    brand_name TEXT NOT NULL,
    image_url TEXT,
    target_url TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Multas de Clubes (Opcional)
CREATE TABLE IF NOT EXISTS club_fines (
    id TEXT PRIMARY KEY,
    championship_id TEXT REFERENCES championships(id) ON DELETE CASCADE,
    club_id TEXT REFERENCES clubs(id) ON DELETE CASCADE,
    round INTEGER NOT NULL,
    amount NUMERIC NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security) e Criar Políticas (Simplificado para o demo)
-- Em produção, você deve restringir quem pode escrever em cada tabela.
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for leagues" ON leagues FOR SELECT USING (true);
CREATE POLICY "Admin write access for leagues" ON leagues FOR ALL USING (true); -- Mudar para restrict por email/auth

-- Repetir para outras tabelas conforme necessário...
