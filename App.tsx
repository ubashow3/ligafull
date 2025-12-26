
import React, { useState, useMemo, useEffect } from 'react';
import { League, Championship, Club, Match, Player, TechnicalStaff, Official, ChampionshipWizardConfig, Standing, ChampionshipFinancials } from './types';
import * as leagueService from './services/leagueService';
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import AdminModal from './components/AdminModal';
import AdminActionsModal from './components/AdminActionsModal';
import HomePage from './pages/HomePage';
import LeaguePage from './pages/LeaguePage';
import ChampionshipPage from './pages/ChampionshipPage';
import MatchSummaryPage from './pages/MatchSummaryPage';
import CreateLeaguePage from './pages/CreateLeaguePage';
import AdminLeaguePage from './pages/admin/AdminLeaguePage';
import AdminChampionshipPage from './pages/admin/AdminChampionshipPage';
import AdminMatchSummaryPage from './pages/admin/AdminMatchSummaryPage';
import CreateMatchesPage from './pages/admin/CreateMatchesPage';
import ClubAdminPage from './pages/admin/ClubAdminPage';

// SQL Script to be provided to user if tables are missing
const DATABASE_SETUP_SQL = `-- 1. Tabela de Ligas
create table leagues (
  id uuid primary key,
  name text not null,
  slug text unique not null,
  logo_url text,
  admin_email text unique not null,
  admin_password_hash text not null,
  city text,
  state text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabela de Oficiais (Árbitros/Mesários)
create table officials (
  id uuid primary key,
  league_id uuid references leagues(id) on delete cascade,
  name text not null,
  nickname text,
  cpf text,
  bank_account text,
  type text check (type in ('referee', 'table_official')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabela de Clubes
create table clubs (
  id uuid primary key,
  name text not null,
  abbreviation text not null,
  logo_url text,
  whatsapp text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tabela de Campeonatos
create table championships (
  id uuid primary key,
  league_id uuid references leagues(id) on delete cascade,
  name text not null,
  financials jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Relação Clube x Campeonato (Muitos para Muitos)
create table championship_clubs (
  championship_id uuid references championships(id) on delete cascade,
  club_id uuid references clubs(id) on delete cascade,
  primary key (championship_id, club_id)
);

-- 6. Tabela de Jogadores
create table players (
  id uuid primary key,
  club_id uuid references clubs(id) on delete cascade,
  name text not null,
  nickname text,
  cpf text,
  photo_url text,
  birth_date date,
  position text,
  goals_in_championship integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Comissão Técnica
create table technical_staff (
  id uuid primary key,
  club_id uuid references clubs(id) on delete cascade,
  name text not null,
  role text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Tabela de Partidas (Jogos)
create table matches (
  id uuid primary key,
  championship_id uuid references championships(id) on delete cascade,
  round integer not null,
  home_team_id uuid references clubs(id),
  away_team_id uuid references clubs(id),
  home_score integer,
  away_score integer,
  match_date timestamp with time zone not null,
  status text check (status in ('scheduled', 'in_progress', 'finished')) default 'scheduled',
  location text,
  referee_id uuid references officials(id),
  assistant1_id uuid references officials(id),
  assistant2_id uuid references officials(id),
  table_official_id uuid references officials(id),
  home_lineup jsonb default '[]'::jsonb,
  away_lineup jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. Eventos da Partida (Gols/Cartões)
create table match_events (
  id bigserial primary key,
  match_id uuid references matches(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  type text check (type in ('goal', 'yellow_card', 'red_card')),
  minute integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);`;

// Helper function to calculate standings (remains client-side)
const calculateStandings = (clubs: Club[], matches: Match[]): Standing[] => {
    const standingsMap = new Map<string, Standing>();

    clubs.forEach(club => {
        standingsMap.set(club.id, {
            clubId: club.id, clubName: club.name, clubAbbreviation: club.abbreviation,
            clubLogoUrl: club.logoUrl, played: 0, wins: 0, draws: 0, losses: 0,
            goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0,
        });
    });

    matches.filter(m => (m.status === 'finished' || m.status === 'in_progress') && m.homeScore != null && m.awayScore != null).forEach(match => {
        const homeTeamId = typeof match.homeTeam === 'object' ? match.homeTeam.id : match.homeTeam;
        const awayTeamId = typeof match.awayTeam === 'object' ? match.awayTeam.id : match.awayTeam;

        if (!standingsMap.has(homeTeamId) || !standingsMap.has(awayTeamId)) return;
        
        const home = standingsMap.get(homeTeamId)!;
        const away = standingsMap.get(awayTeamId)!;
        const homeScore = match.homeScore!;
        const awayScore = match.awayScore!;

        home.played++;
        away.played++;

        home.goalsFor += homeScore;
        home.goalsAgainst += awayScore;
        away.goalsFor += awayScore;
        // FIX: Corrected property name from 'goalAgainst' to 'goalsAgainst'
        away.goalsAgainst += homeScore;
    });

    const standings = Array.from(standingsMap.values());

    standings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
        return a.clubName.localeCompare(b.clubName);
    });

    return standings;
};

type View =
  | { name: 'home' }
  | { name: 'league'; leagueId: string }
  | { name: 'championship'; leagueId: string; championshipId: string }
  | { name: 'match'; leagueId: string; championshipId: string; matchId: string }
  | { name: 'create_league' }
  | { name: 'admin_league'; leagueId: string }
  | { name: 'admin_championship'; leagueId: string; championshipId: string }
  | { name: 'admin_match'; leagueId: string; championshipId: string; matchId: string }
  | { name: 'create_matches'; leagueId: string; championshipId: string }
  | { name: 'club_admin'; leagueId: string; championshipId: string; clubId: string };

const App: React.FC = () => {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [view, setView] = useState<View>({ name: 'home' });
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminLeague, setAdminLeague] = useState<League | null>(null);
  const [adminClub, setAdminClub] = useState<{ league: League; championship: Championship; club: Club; } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAdminActionsModalOpen, setIsAdminActionsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [tokenChecked, setTokenChecked] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await leagueService.fetchLeagues();
      setLeagues(data);
    } catch (error: any) {
        console.error("Failed to fetch data:", error);

        let message = 'Ocorreu um erro ao carregar os dados.';

        if (typeof error === 'string') {
            message = error;
        } else if (error instanceof Error) {
            message = error.message;
        } else if (error && typeof error === 'object') {
            message = error.message || error.error_description || JSON.stringify(error);
        }

        // Caso específico de tabelas não encontradas
        if (message.includes("Could not find the table") || message.includes("relation \"leagues\" does not exist")) {
             message = "BANCO DE DADOS NÃO CONFIGURADO!\n\nSeu projeto no Supabase está vazio. Você precisa criar as tabelas usando o SQL Editor no painel do Supabase.\n\nCopie o script SQL abaixo e execute-o no seu painel.";
        } else if (message.toLowerCase().includes('failed to fetch')) {
            message = 'Erro de Conexão: Não foi possível alcançar o Supabase. Verifique sua Anon Key e URL.';
        }

        setFetchError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(DATABASE_SETUP_SQL);
    alert("Script SQL copiado para a área de transferência!");
  };

  useEffect(() => {
    fetchData();
  }, []);
  
  useEffect(() => {
    if (!isLoading && !fetchError && leagues.length > 0 && !tokenChecked) {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');

      if (token) {
        let found = false;
        for (const league of leagues) {
          for (const championship of league.championships) {
            const tokens = championship.financials?.clubAdminTokens;
            if (tokens) {
              const clubId = Object.keys(tokens).find(key => tokens[key] === token);
              if (clubId) {
                const club = championship.clubs.find(c => c.id === clubId);
                if (club) {
                  setIsAdminMode(true);
                  setAdminClub({ league, championship, club });
                  setView({ name: 'club_admin', leagueId: league.id, championshipId: championship.id, clubId: club.id });
                  found = true;
                  window.history.replaceState({}, document.title, window.location.pathname);
                  break;
                }
              }
            }
          }
          if (found) break;
        }
        if (!found) {
            alert("Token de acesso inválido ou expirado.");
            window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
      setTokenChecked(true);
    }
  }, [isLoading, fetchError, leagues, tokenChecked]);

  const processedLeagues = useMemo(() => {
    return leagues.map(league => ({
      ...league,
      championships: league.championships.map(champ => ({
        ...champ,
        standings: calculateStandings(champ.clubs, champ.matches),
      })),
    }));
  }, [leagues]);

  const currentLeague = useMemo(() => {
    if (view.name === 'home' || view.name === 'create_league') return null;
    return processedLeagues.find(l => l.id === view.leagueId) || null;
  }, [processedLeagues, view]);

  const currentChampionship = useMemo(() => {
    if (view.name !== 'championship' && view.name !== 'match' && view.name !== 'admin_championship' && view.name !== 'admin_match' && view.name !== 'create_matches' && view.name !== 'club_admin') return null;
    return currentLeague?.championships.find(c => c.id === view.championshipId) || null;
  }, [currentLeague, view]);

  const currentMatch = useMemo(() => {
    if (view.name !== 'match' && view.name !== 'admin_match') return null;
    return currentChampionship?.matches.find(m => m.id === view.matchId) || null;
  }, [currentChampionship, view]);

  // --- HANDLERS ---

  const handleLogin = async (email: string, pass: string) => {
    try {
      const loggedInLeague = await leagueService.login(email, pass);
      if (loggedInLeague) {
        setIsAdminMode(true);
        setAdminLeague(loggedInLeague);
        setView({ name: 'admin_league', leagueId: loggedInLeague.id });
        setIsAdminModalOpen(false);
        const fullLeagueData = leagues.find(l => l.id === loggedInLeague.id) || loggedInLeague;
        setAdminLeague(fullLeagueData);
      } else {
        alert('Credenciais inválidas.');
      }
    } catch (error: any) {
       console.error("Login failed:", error);
       alert(`Ocorreu um erro durante o login: ${error.message || 'Erro de rede'}`);
    }
  };

  const handleLogout = () => {
    setIsAdminMode(false);
    setAdminLeague(null);
    setAdminClub(null);
    setView({ name: 'home' });
    setIsAdminActionsModalOpen(false);
  };

  const handleCreateLeague = async (name: string, logoUrl: string, email: string, password: string, state: string, city: string) => {
    setIsLoading(true);
    try {
      await leagueService.createLeague({ name, logoUrl, adminEmail: email, adminPassword: password, state, city });
      
      const loggedInLeague = await leagueService.login(email, password);
      if (loggedInLeague) {
        await fetchData(); 
        setIsAdminMode(true);
        setAdminLeague(loggedInLeague);
        setView({ name: 'admin_league', leagueId: loggedInLeague.id });
      } else {
        await fetchData();
        setView({ name: 'home' });
        alert('Liga criada com sucesso! Faça o login para administrar.');
      }
    } catch (error: any) {
      alert(`Erro ao criar liga: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCreateChampionship = async (leagueId: string, champName: string) => {
    try {
        await leagueService.createChampionship(leagueId, champName);
        await fetchData();
    } catch (error: any) {
        alert(`Erro ao criar campeonato: ${error.message}`);
    }
  };

  const handleSaveChampionshipFinancials = async (championshipId: string, financials: ChampionshipFinancials) => {
    try {
      await leagueService.saveChampionshipFinancials(championshipId, financials);
      await fetchData();
    } catch (error: any) {
      alert(`Erro ao salvar dados financeiros: ${error.message}`);
    }
  };

  const handleCreateClub = async (name: string, abbreviation: string, logoUrl: string, whatsapp: string) => {
    if (view.name !== 'admin_championship' && view.name !== 'create_matches') return;
    try {
        await leagueService.addClubToChampionship(view.championshipId, { name, abbreviation, logoUrl, whatsapp });
        await fetchData();
    } catch (error: any) {
        alert(`Erro ao adicionar clube: ${error.message}`);
    }
  };

  const handleUpdateClubDetails = async (clubId: string, details: { name?: string, logoUrl?: string, whatsapp?: string }) => {
    try {
        await leagueService.updateClubDetails(clubId, details);
        await fetchData();
        if (adminClub && adminClub.club.id === clubId) {
            setAdminClub(prev => prev ? ({
                ...prev,
                club: { ...prev.club, ...details }
            }) : null);
        }
    } catch (error: any) {
        alert(`Erro ao atualizar detalhes do clube: ${error.message}`);
    }
  };

  const handleUpdateClubRegistrationStatus = async (championshipId: string, clubId: string, isPaid: boolean) => {
    try {
        await leagueService.updateClubRegistrationStatus(championshipId, clubId, isPaid);
        await fetchData();
    } catch (error: any) {
        alert(`Erro ao atualizar status de pagamento: ${error.message}`);
    }
  };
  
  const handleUpdateClubFinePaymentStatus = async (championshipId: string, clubId: string, round: number, isPaid: boolean) => {
    try {
        await leagueService.updateClubFinePaymentStatus(championshipId, clubId, round, isPaid);
        await fetchData();
    } catch (error: any) {
        alert(`Erro ao atualizar status de pagamento da multa: ${error.message}`);
    }
  };

  const onUpdateMatch = async (updatedMatch: Match) => {
    if (!adminLeague && !adminClub) return;
    try {
      const leagueForUpdate = adminLeague || adminClub?.league;
      if (!leagueForUpdate) throw new Error("League context not found for match update.");
      await leagueService.updateMatch(updatedMatch, leagueForUpdate);
      await fetchData();
    } catch (error: any) {
      console.error("Failed to update match", error);
       alert(`Erro ao atualizar partida: ${error.message}`);
    }
  };
  
  const handleCreateOfficial = async (type: 'referees' | 'tableOfficials', data: Omit<Official, 'id'>) => {
    if (!adminLeague) return;
    try {
      const upperCaseData = { ...data, name: data.name.toUpperCase() };
      await leagueService.createOfficial(adminLeague.id, type, upperCaseData);
      await fetchData();
    } catch (error: any) {
      alert(`Erro ao criar oficial: ${error.message}`);
    }
  };
  
  const handleUpdateOfficial = async (type: 'referees' | 'tableOfficials', data: Official) => {
     try {
      const upperCaseData = { ...data, name: data.name.toUpperCase() };
      await leagueService.updateOfficial(upperCaseData);
      await fetchData();
    } catch (error: any) {
      alert(`Erro ao atualizar oficial: ${error.message}`);
    }
  };
  
  const handleDeleteOfficial = async (type: 'referees' | 'tableOfficials', id: string) => {
     try {
      await leagueService.deleteOfficial(id);
      await fetchData();
    } catch (error: any) {
      alert(`Erro ao deletar oficial: ${error.message}`);
    }
  };
  
  const handleCreatePlayer = async (clubId: string, name: string, position: string, nickname: string, cpf: string, photoUrl: string, birthDate: string) => {
    try {
      await leagueService.createPlayer(clubId, { name: name.toUpperCase(), position, nickname, cpf, photoUrl, birthDate, goals: 0 });
      await fetchData();
    } catch (error: any) {
      alert(`Erro ao criar jogador: ${error.message}`);
    }
  };

  const handleUpdatePlayer = async (clubId: string, updatedPlayer: Player) => {
     try {
      const upperCasePlayer = { ...updatedPlayer, name: updatedPlayer.name.toUpperCase() };
      await leagueService.updatePlayer(upperCasePlayer);
      await fetchData();
    } catch (error: any) {
      alert(`Erro ao atualizar jogador: ${error.message}`);
    }
  };

  const handleDeletePlayer = async (clubId: string, playerId: string) => {
    try {
      await leagueService.deletePlayer(playerId);
      await fetchData();
    } catch (error: any) {
      alert(`Erro ao deletar jogador: ${error.message}`);
    }
  };

  const handleCreateStaff = async (clubId: string, name: string, role: string) => {
     try {
      await leagueService.createStaff(clubId, { name: name.toUpperCase(), role });
      await fetchData();
    } catch (error: any) {
      alert(`Erro ao criar staff: ${error.message}`);
    }
  };

  const handleUpdateStaff = async (clubId: string, updatedStaff: TechnicalStaff) => {
     try {
      const upperCaseStaff = { ...updatedStaff, name: updatedStaff.name.toUpperCase() };
      await leagueService.updateStaff(upperCaseStaff);
      await fetchData();
    } catch (error: any) {
      alert(`Erro ao atualizar staff: ${error.message}`);
    }
  };

  const handleDeleteStaff = async (clubId: string, staffId: string) => {
     try {
      await leagueService.deleteStaff(staffId);
      await fetchData();
    } catch (error: any) {
      alert(`Erro ao deletar staff: ${error.message}`);
    }
  };
  
  const handleGenerateMatches = async (config: ChampionshipWizardConfig) => {
    if (view.name !== 'admin_championship' && view.name !== 'create_matches') return;
    
    const league = processedLeagues.find(l => l.id === view.leagueId);
    const championship = league?.championships.find(c => c.id === view.championshipId);

    if (!championship || championship.clubs.length < 2) {
      alert('É necessário ter pelo menos 2 clubes no campeonato para gerar os jogos.');
      return;
    }
    
    setIsLoading(true);

    try {
      let clubs = [...championship.clubs];
      const byeClub: Club = { id: 'bye', name: 'BYE', abbreviation: 'BYE', logoUrl: '', players: [], technicalStaff: [] };
      if (clubs.length % 2 !== 0) {
        clubs.push(byeClub);
      }
      
      const generatedMatches: Match[] = [];
      const numTeams = clubs.length;
      const numRounds = numTeams - 1;
      const matchesPerRound = numTeams / 2;
      const startDate = new Date();

      for (let round = 0; round < numRounds; round++) {
        for (let i = 0; i < matchesPerRound; i++) {
          const home = clubs[i];
          const away = clubs[numTeams - 1 - i];

          if (home.id !== 'bye' && away.id !== 'bye') {
            const matchDate = new Date(startDate);
            matchDate.setDate(startDate.getDate() + (round * 7));
            matchDate.setHours(16, 0, 0, 0);

            generatedMatches.push({
              id: crypto.randomUUID(),
              round: round + 1,
              homeTeam: home,
              awayTeam: away,
              homeScore: null,
              awayScore: null,
              date: matchDate.toISOString(),
              status: 'scheduled',
              location: 'A definir',
              events: [],
              championship_id: championship.id,
            });
          }
        }
        const lastTeam = clubs.pop()!;
        clubs.splice(1, 0, lastTeam);
      }

      if (config.turns === 2) {
        const returnMatches = generatedMatches.map(match => {
           const returnDate = new Date(match.date);
           returnDate.setDate(returnDate.getDate() + (numRounds + 1) * 7);
           return {
              ...match,
              id: crypto.randomUUID(),
              round: match.round + numRounds,
              homeTeam: match.awayTeam,
              awayTeam: match.homeTeam,
              date: returnDate.toISOString(),
           }
        });
        generatedMatches.push(...returnMatches);
      }
      
      if (config.playoffs) {
          const totalQualifiers = config.format === 'ROUND_ROBIN' 
              ? config.playoffTeamsPerGroup 
              : config.numGroups * config.playoffTeamsPerGroup;
          
          let lastRound = generatedMatches.reduce((max, m) => Math.max(max, m.round), 0);
          
          const createPlayoffMatch = async (round: number, homePlaceholder: string, awayPlaceholder: string): Promise<Match> => {
              const matchDate = new Date();
              matchDate.setDate(new Date().getDate() + (round * 7));
              matchDate.setHours(16, 0, 0, 0);
              
              const homeTeam = await leagueService.createOrGetPlaceholderClub(homePlaceholder);
              const awayTeam = await leagueService.createOrGetPlaceholderClub(awayPlaceholder);

              return {
                  id: crypto.randomUUID(),
                  round: round,
                  homeTeam: homeTeam,
                  awayTeam: awayTeam,
                  homeScore: null,
                  awayScore: null,
                  date: matchDate.toISOString(),
                  status: 'scheduled',
                  location: 'A definir',
                  events: [],
                  championship_id: championship.id
              };
          };

          const playoffPromises: Promise<Match>[] = [];

          if (totalQualifiers >= 8) { 
              lastRound++;
              playoffPromises.push(createPlayoffMatch(lastRound, '1º Colocado', '8º Colocado'));
              playoffPromises.push(createPlayoffMatch(lastRound, '2º Colocado', '7º Colocado'));
              playoffPromises.push(createPlayoffMatch(lastRound, '3º Colocado', '6º Colocado'));
              playoffPromises.push(createPlayoffMatch(lastRound, '4º Colocado', '5º Colocado'));
          }
          if (totalQualifiers >= 4) { 
              lastRound++;
              const qfPrefix = totalQualifiers >= 8 ? "QF" : "Colocado";
              playoffPromises.push(createPlayoffMatch(lastRound, `Vencedor ${qfPrefix} 1`, `Vencedor ${qfPrefix} 4`));
              playoffPromises.push(createPlayoffMatch(lastRound, `Vencedor ${qfPrefix} 2`, `Vencedor ${qfPrefix} 3`));
          }
          if (totalQualifiers >= 2) { 
              lastRound++;
              playoffPromises.push(createPlayoffMatch(lastRound, 'Vencedor SF 1', 'Vencedor SF 2'));
          }

          const playoffMatches = await Promise.all(playoffPromises);
          generatedMatches.push(...playoffMatches);
      }

      await leagueService.generateMatches(championship.id, generatedMatches);
      await fetchData();
      setView({ name: 'admin_championship', leagueId: view.leagueId, championshipId: championship.id });

    } catch (error: any) {
      console.error("Failed to generate matches:", error);
      alert(`Erro ao gerar partidas: ${error.message}`);
    } finally {
        setIsLoading(false);
    }
  };


  // --- RENDER ---
  const renderContent = () => {
    if (isLoading) return <div className="text-center py-20 text-green-400">Verificando conexão...</div>;
    
    if (fetchError) {
        const isSetupError = fetchError.includes("BANCO DE DADOS NÃO CONFIGURADO");
        return (
            <div className="text-center py-20 animate-fade-in max-w-2xl mx-auto">
                <div className={`${isSetupError ? 'bg-blue-500/10 border-blue-500' : 'bg-red-500/10 border-red-500'} border rounded-lg p-6 mb-6`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 ${isSetupError ? 'text-blue-500' : 'text-red-500'} mx-auto mb-4`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h2 className="text-2xl font-bold text-white mb-2">{isSetupError ? "Configuração Necessária" : "Erro de Carregamento"}</h2>
                    <div className="bg-black/40 rounded p-4 text-left mb-6 overflow-auto max-h-60 border border-gray-700">
                        <p className={`${isSetupError ? 'text-blue-300' : 'text-red-400'} text-sm font-mono whitespace-pre-wrap`}>{fetchError}</p>
                    </div>
                    
                    {isSetupError ? (
                        <div className="text-left text-sm text-gray-300 space-y-4">
                            <p>Siga estes passos para corrigir:</p>
                            <ol className="list-decimal list-inside space-y-2">
                                <li>Abra seu projeto <strong>ukdszrnpkulwsljsdmqz</strong> no Supabase.</li>
                                <li>Clique em <strong>SQL Editor</strong> no menu lateral.</li>
                                <li>Crie uma <strong>New Query</strong>.</li>
                                <li>Clique no botão abaixo para copiar o script, cole lá e clique em <strong>Run</strong>.</li>
                            </ol>
                            <button 
                                onClick={handleCopySQL} 
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                                Copiar Script SQL
                            </button>
                            <button 
                                onClick={fetchData} 
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                Já executei o SQL, carregar agora
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={fetchData} 
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Tentar Novamente
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (isAdminMode && (adminLeague || adminClub)) {
        if (adminClub) {
            const { league, championship, club } = adminClub;
            const fullLeagueData = processedLeagues.find(l => l.id === league.id);
            const fullChampionshipData = fullLeagueData?.championships.find(c => c.id === championship.id);
            const fullClubData = fullChampionshipData?.clubs.find(c => c.id === club.id);

            if (view.name === 'club_admin' && fullLeagueData && fullChampionshipData && fullClubData) {
                return <ClubAdminPage 
                            league={fullLeagueData}
                            championship={fullChampionshipData}
                            club={fullClubData}
                            onCreatePlayer={handleCreatePlayer}
                            onUpdatePlayer={handleUpdatePlayer}
                            onDeletePlayer={handleDeletePlayer}
                            onCreateStaff={handleCreateStaff}
                            onUpdateStaff={handleUpdateStaff}
                            onDeleteStaff={handleDeleteStaff}
                            onUpdateClubDetails={handleUpdateClubDetails}
                        />;
            }
        }
        
        if (adminLeague) {
            const adminLeagueData = processedLeagues.find(l => l.id === adminLeague.id);
            if (!adminLeagueData) {
                handleLogout();
                return <p className="text-center py-10">Erro ao carregar dados do administrador.</p>;
            }
            
            switch (view.name) {
                case 'admin_league':
                    return <AdminLeaguePage 
                                league={adminLeagueData} 
                                onSelectChampionship={champ => setView({name: 'admin_championship', leagueId: adminLeagueData.id, championshipId: champ.id})} 
                                onCreateChampionship={handleCreateChampionship}
                                onCreateOfficial={handleCreateOfficial}
                                onUpdateOfficial={handleUpdateOfficial}
                                onDeleteOfficial={handleDeleteOfficial}
                           />;

                case 'admin_championship':
                    const adminChampionship = adminLeagueData.championships.find(c => c.id === view.championshipId);
                    if (adminChampionship) return <AdminChampionshipPage 
                                                    championship={adminChampionship} 
                                                    league={adminLeagueData} 
                                                    onBack={() => setView({name: 'admin_league', leagueId: adminLeagueData.id})} 
                                                    onSelectMatch={match => setView({name: 'admin_match', leagueId: adminLeagueData.id, championshipId: adminChampionship.id, matchId: match.id})} 
                                                    onCreateClub={handleCreateClub} 
                                                    onUpdateMatch={onUpdateMatch} 
                                                    onNavigateToCreateMatches={() => setView({name: 'create_matches', leagueId: adminLeagueData.id, championshipId: adminChampionship.id})} 
                                                    onCreatePlayer={handleCreatePlayer}
                                                    onUpdatePlayer={handleUpdatePlayer}
                                                    onDeletePlayer={handleDeletePlayer}
                                                    onCreateStaff={handleCreateStaff}
                                                    onUpdateStaff={handleUpdateStaff}
                                                    onDeleteStaff={handleDeleteStaff}
                                                    onSaveFinancials={handleSaveChampionshipFinancials}
                                                    onUpdateClubRegistrationStatus={handleUpdateClubRegistrationStatus}
                                                    onUpdateClubFinePaymentStatus={handleUpdateClubFinePaymentStatus}
                                                    onUpdateClubDetails={handleUpdateClubDetails}
                                                   />;
                    break;

                case 'admin_match':
                    const champForMatch = adminLeagueData.championships.find(c => view.name === 'admin_match' && c.id === view.championshipId);
                    const adminMatch = champForMatch?.matches.find(m => m.id === view.matchId);
                    if (adminMatch && champForMatch) return <AdminMatchSummaryPage 
                                                                match={adminMatch} 
                                                                league={adminLeagueData} 
                                                                championship={champForMatch}
                                                                onBack={() => setView({name: 'admin_championship', leagueId: adminLeagueData.id, championshipId: champForMatch.id})} 
                                                                onUpdateMatch={onUpdateMatch} 
                                                            />;
                    break;
                    
                case 'create_matches':
                     const champForCreation = adminLeagueData.championships.find(c => c.id === view.championshipId);
                     if (champForCreation) return <CreateMatchesPage 
                                                     championship={champForCreation} 
                                                     onBack={() => setView({name: 'admin_championship', leagueId: adminLeagueData.id, championshipId: champForCreation.id})} 
                                                     onGenerateMatches={handleGenerateMatches}
                                                  />
                    break;
            }
        }
    }
    
    switch (view.name) {
        case 'home':
            return <HomePage leagues={processedLeagues} onSelectLeague={league => setView({ name: 'league', leagueId: league.id })} />;
        case 'league':
            if (currentLeague) return <LeaguePage league={currentLeague} onSelectChampionship={champ => setView({ name: 'championship', leagueId: currentLeague.id, championshipId: champ.id })} onBack={() => setView({ name: 'home' })} isAdminMode={false} onCreateChampionship={(leagueId: string, champName: string) => {}} />;
            break;
        case 'championship':
            if (currentChampionship && currentLeague) return <ChampionshipPage 
                championship={currentChampionship} 
                league={currentLeague} 
                onBack={() => setView({ name: 'league', leagueId: currentLeague.id })} 
                onSelectMatch={match => setView({ name: 'match', leagueId: currentLeague.id, championshipId: currentChampionship.id, matchId: match.id })} 
                isAdminMode={false}
                onCreateClub={(name: string, abbreviation: string, logoUrl: string, whatsapp: string) => {}}
                onGenerateMatches={(config: ChampionshipWizardConfig) => {}}
                />;
            break;
        case 'match':
            if (currentMatch && currentLeague && currentChampionship) return <MatchSummaryPage match={currentMatch} league={currentLeague} onBack={() => setView({ name: 'championship', leagueId: currentLeague.id, championshipId: currentChampionship.id })} />;
            break;
        case 'create_league':
            return <CreateLeaguePage onBack={() => setView({ name: 'home' })} onCreateLeague={handleCreateLeague} isLoading={isLoading} />;
    }
    return (
        <div className="text-center py-20 animate-fade-in">
            <h3 className="text-xl font-bold text-white mb-2">Página não encontrada</h3>
            <p className="text-gray-400 mb-6">Os dados solicitados não estão disponíveis no momento.</p>
            <button onClick={() => setView({name: 'home'})} className="bg-gray-700 hover:bg-gray-600 text-green-400 font-bold py-2 px-6 rounded-lg transition-colors">
                Voltar para o Início
            </button>
        </div>
    );
  };

  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen font-sans">
      <Header
        onTitleClick={() => {
          if (isAdminMode) {
              handleLogout();
          } else {
             setView({ name: 'home' });
          }
        }}
        onAdminClick={() => {
          if (isAdminMode) setIsAdminActionsModalOpen(true);
          else setIsAdminModalOpen(true);
        }}
        onMenuClick={() => setIsSidebarOpen(true)}
        isAdminMode={isAdminMode}
      />
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        leagues={processedLeagues}
        onSelectLeague={league => {
          setView({ name: 'league', leagueId: league.id });
          setIsSidebarOpen(false);
        }}
      />
      <main className="container mx-auto px-4 py-8">
        {renderContent()}
      </main>
      <Footer />
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onNavigateToCreateLeague={() => {
          setIsAdminModalOpen(false);
          setView({ name: 'create_league' });
        }}
        onLogin={handleLogin}
      />
      <AdminActionsModal
        isOpen={isAdminActionsModalOpen}
        onClose={() => setIsAdminActionsModalOpen(false)}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default App;
