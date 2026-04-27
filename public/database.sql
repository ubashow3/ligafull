-- Script SQL para criar as tabelas no MySQL da sua hospedagem

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

CREATE TABLE IF NOT EXISTS officials (
    id VARCHAR(36) PRIMARY KEY,
    league_id VARCHAR(36),
    name VARCHAR(255) NOT NULL,
    nickname VARCHAR(100),
    cpf VARCHAR(14),
    bank_account TEXT,
    type ENUM('referee', 'table_official') NOT NULL,
    FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS championships (
    id VARCHAR(36) PRIMARY KEY,
    league_id VARCHAR(36),
    name VARCHAR(255) NOT NULL,
    registration_fee_per_club DECIMAL(10, 2) DEFAULT 0,
    referee_fee DECIMAL(10, 2) DEFAULT 0,
    assistant_fee DECIMAL(10, 2) DEFAULT 0,
    table_official_fee DECIMAL(10, 2) DEFAULT 0,
    field_fee DECIMAL(10, 2) DEFAULT 0,
    yellow_card_fine DECIMAL(10, 2) DEFAULT 0,
    red_card_fine DECIMAL(10, 2) DEFAULT 0,
    FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS clubs (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    abbreviation VARCHAR(10) NOT NULL,
    logo_url TEXT,
    whatsapp VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS championship_clubs (
    championship_id VARCHAR(36),
    club_id VARCHAR(36),
    amount_paid DECIMAL(10, 2) DEFAULT 0,
    PRIMARY KEY (championship_id, club_id),
    FOREIGN KEY (championship_id) REFERENCES championships(id) ON DELETE CASCADE,
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS players (
    id VARCHAR(36) PRIMARY KEY,
    club_id VARCHAR(36),
    name VARCHAR(255) NOT NULL,
    nickname VARCHAR(100),
    position VARCHAR(50),
    photo_url TEXT,
    birth_date DATE,
    cpf VARCHAR(14),
    goals_in_championship INT DEFAULT 0,
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS technical_staff (
    id VARCHAR(36) PRIMARY KEY,
    club_id VARCHAR(36),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS matches (
    id VARCHAR(36) PRIMARY KEY,
    championship_id VARCHAR(36),
    round INT NOT NULL,
    home_team_id VARCHAR(36),
    away_team_id VARCHAR(36),
    home_score INT,
    away_score INT,
    match_date DATETIME,
    status ENUM('scheduled', 'in_progress', 'finished') DEFAULT 'scheduled',
    location VARCHAR(255),
    referee_id VARCHAR(36),
    assistant1_id VARCHAR(36),
    assistant2_id VARCHAR(36),
    table_official_id VARCHAR(36),
    FOREIGN KEY (championship_id) REFERENCES championships(id) ON DELETE CASCADE,
    FOREIGN KEY (home_team_id) REFERENCES clubs(id),
    FOREIGN KEY (away_team_id) REFERENCES clubs(id),
    FOREIGN KEY (referee_id) REFERENCES officials(id),
    FOREIGN KEY (assistant1_id) REFERENCES officials(id),
    FOREIGN KEY (assistant2_id) REFERENCES officials(id),
    FOREIGN KEY (table_official_id) REFERENCES officials(id)
);

CREATE TABLE IF NOT EXISTS match_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_id VARCHAR(36),
    player_id VARCHAR(36),
    type ENUM('goal', 'yellow_card', 'red_card') NOT NULL,
    minute INT,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
    id VARCHAR(36) PRIMARY KEY,
    league_id VARCHAR(36),
    user_id VARCHAR(36),
    user_name VARCHAR(255),
    user_photo TEXT,
    content TEXT NOT NULL,
    media_url TEXT,
    media_type ENUM('image', 'video'),
    is_official BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS profiles (
    id VARCHAR(36) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    photo_url TEXT,
    email VARCHAR(255) UNIQUE NOT NULL,
    is_paid BOOLEAN DEFAULT TRUE,
    trial_started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    registered_league_id VARCHAR(36)
);
