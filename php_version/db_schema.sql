-- SQL para criar o banco de dados e as tabelas no MySQL
CREATE DATABASE IF NOT EXISTS ligafull;
USE ligafull;

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leagues (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    logo_url TEXT,
    cover_url TEXT,
    admin_email VARCHAR(255) NOT NULL,
    admin_password_hash VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS championships (
    id VARCHAR(50) PRIMARY KEY,
    league_id VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    referee_fee DECIMAL(10,2) DEFAULT 0,
    assistant_fee DECIMAL(10,2) DEFAULT 0,
    table_official_fee DECIMAL(10,2) DEFAULT 0,
    field_fee DECIMAL(10,2) DEFAULT 0,
    yellow_card_fine DECIMAL(10,2) DEFAULT 0,
    red_card_fine DECIMAL(10,2) DEFAULT 0,
    registration_fee_per_club DECIMAL(10,2) DEFAULT 0,
    player_registration_deadline DATE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (league_id) REFERENCES leagues(id)
);

CREATE TABLE IF NOT EXISTS officials (
    id VARCHAR(50) PRIMARY KEY,
    league_id VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    nickname VARCHAR(100),
    cpf VARCHAR(20),
    bank_account TEXT,
    role VARCHAR(100),
    FOREIGN KEY (league_id) REFERENCES leagues(id)
);

CREATE TABLE IF NOT EXISTS players (
    id VARCHAR(50) PRIMARY KEY,
    club_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    nickname VARCHAR(100),
    position VARCHAR(50),
    cpf VARCHAR(20),
    birth_date DATE,
    photo_url TEXT,
    goals_in_championship INT DEFAULT 0,
    FOREIGN KEY (club_id) REFERENCES clubs(id)
);

CREATE TABLE IF NOT EXISTS technical_staff (
    id VARCHAR(50) PRIMARY KEY,
    club_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    FOREIGN KEY (club_id) REFERENCES clubs(id)
);

CREATE TABLE IF NOT EXISTS matches (
    id VARCHAR(50) PRIMARY KEY,
    championship_id VARCHAR(50) NOT NULL,
    round INT NOT NULL,
    home_team_id VARCHAR(50) NOT NULL,
    away_team_id VARCHAR(50) NOT NULL,
    home_score INT DEFAULT 0,
    away_score INT DEFAULT 0,
    match_date DATETIME,
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'scheduled',
    referee_id VARCHAR(50),
    assistant1_id VARCHAR(50),
    assistant2_id VARCHAR(50),
    table_official_id VARCHAR(50),
    home_lineup TEXT,
    away_lineup TEXT,
    events TEXT,
    FOREIGN KEY (championship_id) REFERENCES championships(id),
    FOREIGN KEY (home_team_id) REFERENCES clubs(id),
    FOREIGN KEY (away_team_id) REFERENCES clubs(id)
);

CREATE TABLE IF NOT EXISTS clubs (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    city VARCHAR(100)
);
