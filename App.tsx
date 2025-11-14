

import React, { useState, useMemo, useEffect } from 'react';
import { League, Championship, Club, Match, Player, TechnicalStaff, Official, ChampionshipWizardConfig, Standing } from './types';
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

    matches.filter(m => m.status === 'finished' && m.homeScore != null && m.awayScore != null).forEach(match => {
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
        away.goalsAgainst += homeScore;

        home.goalDifference = home.goalsFor - home.goalsAgainst;
        away.goalDifference = away.goalsFor - away.goalsAgainst;

        if (homeScore > awayScore) {
            home.wins++;
            home.points += 3;
            away.losses++;
        } else if (awayScore > homeScore) {
            away.wins++;
            away.points += 3;
            home.losses++;
        } else {
            home.draws++;
            away.draws++;
            home.points++;
            away.points++;
        }
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
  | { name: 'create_matches'; leagueId: string; championshipId: string };

const App: React.FC = () => {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [view, setView] = useState<View>({ name: 'home' });
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminLeague, setAdminLeague] = useState<League | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAdminActionsModalOpen, setIsAdminActionsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await leagueService.fetchLeagues();
      setLeagues(data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      alert('Falha ao carregar dados. Verifique o console para mais detalhes.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
    if (view.name !== 'championship' && view.name !== 'match' && view.name !== 'admin_championship' && view.name !== 'admin_match' && view.name !== 'create_matches') return null;
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
        // We need to refetch to ensure we have the adminPassword hash if needed later
        // or just add it to the returned object from login service
        const fullLeagueData = leagues.find(l => l.id === loggedInLeague.id) || loggedInLeague;
        setAdminLeague(fullLeagueData);
      } else {
        alert('Credenciais inválidas.');
      }
    } catch (error) {
       console.error("Login failed:", error);
       alert('Ocorreu um erro durante o login.');
    }
  };

  const handleLogout = () => {
    setIsAdminMode(false);
    setAdminLeague(null);
    setView({ name: 'home' });
    setIsAdminActionsModalOpen(false);
  };

  const handleCreateLeague = async (name: string, logoUrl: string, email: string, password: string, state: string, city: string) => {
    setIsLoading(true);
    try {
      await leagueService.createLeague({ name, logoUrl, adminEmail: email, adminPassword: password, state, city });
      await fetchData();
      setView({ name: 'home' });
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

  const handleCreateClub = async (name: string, abbreviation: string, logoUrl: string, whatsapp: string) => {
    if (view.name !== 'admin_championship' && view.name !== 'create_matches') return;
    try {
        await leagueService.addClubToChampionship(view.championshipId, { name, abbreviation, logoUrl, whatsapp });
        await fetchData();
    } catch (error: any) {
        alert(`Erro ao adicionar clube: ${error.message}`);
    }
  };

  const onUpdateMatch = async (updatedMatch: Match) => {
    if (!adminLeague) return;
    try {
      await leagueService.updateMatch(updatedMatch, adminLeague);
      await fetchData();
    } catch (error) {
      console.error("Failed to update match", error);
       alert(`Erro ao atualizar partida: ${(error as Error).message}`);
    }
  };
  
  const handleCreateOfficial = async (type: 'referees' | 'tableOfficials', data: Omit<Official, 'id'>) => {
    if (!adminLeague) return;
    try {
      await leagueService.createOfficial(adminLeague.id, type, data);
      await fetchData();
    } catch (error) {
      alert(`Erro ao criar oficial: ${(error as Error).message}`);
    }
  };
  
  const handleUpdateOfficial = async (type: 'referees' | 'tableOfficials', data: Official) => {
    try {
      await leagueService.updateOfficial(data);
      await fetchData();
    } catch (error) {
      alert(`Erro ao atualizar oficial: ${(error as Error).message}`);
    }
  };
  
  const handleDeleteOfficial = async (type: 'referees' | 'tableOfficials', id: string) => {
     try {
      await leagueService.deleteOfficial(id);
      await fetchData();
    } catch (error) {
      alert(`Erro ao deletar oficial: ${(error as Error).message}`);
    }
  };
  
  const handleCreatePlayer = async (clubId: string, name: string, position: string, nickname: string, cpf: string, photoUrl: string) => {
    try {
      await leagueService.createPlayer(clubId, { name, position, nickname, cpf, photoUrl, goals: 0 });
      await fetchData();
    } catch (error) {
      alert(`Erro ao criar jogador: ${(error as Error).message}`);
    }
  };

  const handleUpdatePlayer = async (clubId: string, updatedPlayer: Player) => {
     try {
      await leagueService.updatePlayer(updatedPlayer);
      await fetchData();
    } catch (error) {
      alert(`Erro ao atualizar jogador: ${(error as Error).message}`);
    }
  };

  const handleDeletePlayer = async (clubId: string, playerId: string) => {
    try {
      await leagueService.deletePlayer(playerId);
      await fetchData();
    } catch (error) {
      alert(`Erro ao deletar jogador: ${(error as Error).message}`);
    }
  };

  const handleCreateStaff = async (clubId: string, name: string, role: string) => {
     try {
      await leagueService.createStaff(clubId, { name, role });
      await fetchData();
    } catch (error) {
      alert(`Erro ao criar staff: ${(error as Error).message}`);
    }
  };

  const handleUpdateStaff = async (clubId: string, updatedStaff: TechnicalStaff) => {
     try {
      await leagueService.updateStaff(updatedStaff);
      await fetchData();
    } catch (error) {
      alert(`Erro ao atualizar staff: ${(error as Error).message}`);
    }
  };

  const handleDeleteStaff = async (clubId: string, staffId: string) => {
     try {
      await leagueService.deleteStaff(staffId);
      await fetchData();
    } catch (error) {
      alert(`Erro ao deletar staff: ${(error as Error).message}`);
    }
  };
  
  const handleGenerateMatches = async (config: ChampionshipWizardConfig) => {
    // Note: The actual logic for generating match pairings based on config (e.g., round-robin algorithm)
    // is complex and should be implemented here or in a helper function.
    // For now, this is a placeholder.
    alert('Funcionalidade de geração de partidas ainda não implementada.');
    console.log('Generating matches with config:', config);
    // 1. Call a function: const generatedMatches = generatePairings(championship.clubs, config);
    // 2. await leagueService.generateMatches(championshipId, generatedMatches);
    // 3. await fetchData();
  };


  // --- RENDER ---
  const renderContent = () => {
    if (isLoading) return <div className="text-center py-20">Carregando...</div>;
    
    if (isAdminMode && adminLeague) {
        const adminLeagueData = processedLeagues.find(l => l.id === adminLeague.id);
        if (!adminLeagueData) {
            handleLogout();
            return <p>Erro ao carregar dados do administrador.</p>;
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
                                                onGenerateMatches={handleGenerateMatches}
                                                onUpdateMatch={onUpdateMatch} 
                                                onNavigateToCreateMatches={() => setView({name: 'create_matches', leagueId: adminLeagueData.id, championshipId: adminChampionship.id})} 
                                                onCreatePlayer={handleCreatePlayer}
                                                onUpdatePlayer={handleUpdatePlayer}
                                                onDeletePlayer={handleDeletePlayer}
                                                onCreateStaff={handleCreateStaff}
                                                onUpdateStaff={handleUpdateStaff}
                                                onDeleteStaff={handleDeleteStaff}
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
    
    switch (view.name) {
        case 'home':
            return <HomePage leagues={processedLeagues} onSelectLeague={league => setView({ name: 'league', leagueId: league.id })} />;
        case 'league':
            if (currentLeague) return <LeaguePage league={currentLeague} onSelectChampionship={champ => setView({ name: 'championship', leagueId: currentLeague.id, championshipId: champ.id })} onBack={() => setView({ name: 'home' })} isAdminMode={false} onCreateChampionship={() => {}} />;
            break;
        case 'championship':
            if (currentChampionship && currentLeague) return <ChampionshipPage championship={currentChampionship} league={currentLeague} onBack={() => setView({ name: 'league', leagueId: currentLeague.id })} onSelectMatch={match => setView({ name: 'match', leagueId: currentLeague.id, championshipId: currentChampionship.id, matchId: match.id })} isAdminMode={false} onCreateClub={() => {}} onGenerateMatches={() => {}} />;
            break;
        case 'match':
            if (currentMatch && currentLeague && currentChampionship) return <MatchSummaryPage match={currentMatch} league={currentLeague} onBack={() => setView({ name: 'championship', leagueId: currentLeague.id, championshipId: currentChampionship.id })} />;
            break;
        case 'create_league':
            return <CreateLeaguePage onBack={() => setView({ name: 'home' })} onCreateLeague={handleCreateLeague} isLoading={isLoading} />;
    }
    return <div><p>Página não encontrada ou dados indisponíveis.</p><button onClick={() => setView({name: 'home'})} className="text-green-400 hover:underline">Voltar para Home</button></div>;
  };

  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen font-sans">
      <Header
        onTitleClick={() => {
          if (isAdminMode) {
              handleLogout(); // Always log out if in admin mode
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
