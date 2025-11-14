

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

        let message = 'Ocorreu um erro desconhecido.';
        if (error instanceof Error) {
            message = error.message;
        } else if (typeof error === 'object' && error !== null) {
            if ('message' in error && typeof (error as any).message === 'string') {
                message = (error as any).message;
                if ('details' in error && typeof (error as any).details === 'string') {
                    message += `\nDetalhes: ${(error as any).details}`;
                }
                if ('hint' in error && typeof (error as any).hint === 'string') {
                    message += `\nDica: ${(error as any).hint}`;
                }
            } else {
                try {
                    message = JSON.stringify(error, null, 2);
                } catch {
                    message = 'Não foi possível converter o objeto de erro para texto.';
                }
            }
        } else {
            message = String(error);
        }

        alert(`Falha ao carregar dados:\n${message}`);
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
      
      // After creating, immediately log in and redirect to admin panel
      const loggedInLeague = await leagueService.login(email, password);
      if (loggedInLeague) {
        await fetchData(); // Refresh all league data
        setIsAdminMode(true);
        setAdminLeague(loggedInLeague);
        setView({ name: 'admin_league', leagueId: loggedInLeague.id });
      } else {
        // Fallback in case login fails for some reason
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
      await fetchData(); // Refresh data
    } catch (error) {
      alert(`Erro ao salvar dados financeiros: ${(error as Error).message}`);
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
    if (view.name !== 'admin_championship' && view.name !== 'create_matches') return;
    
    const league = processedLeagues.find(l => l.id === view.leagueId);
    const championship = league?.championships.find(c => c.id === view.championshipId);

    if (!championship || championship.clubs.length < 2) {
      alert('É necessário ter pelo menos 2 clubes no campeonato para gerar os jogos.');
      return;
    }
    
    setIsLoading(true);

    try {
      // 1. Create a mutable copy of clubs and handle odd numbers with a bye
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

      // 2. Generate Round Robin pairings for the first turn
      for (let round = 0; round < numRounds; round++) {
        for (let i = 0; i < matchesPerRound; i++) {
          const home = clubs[i];
          const away = clubs[numTeams - 1 - i];

          // Don't create a match for a "bye" team
          if (home.id !== 'bye' && away.id !== 'bye') {
            const matchDate = new Date(startDate);
            matchDate.setDate(startDate.getDate() + (round * 7)); // Simple weekly rounds
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
        // Rotate teams for the next round, keeping the first team fixed
        const lastTeam = clubs.pop()!;
        clubs.splice(1, 0, lastTeam);
      }

      // 3. Handle second turn (return matches) if configured
      if (config.turns === 2) {
        const returnMatches = generatedMatches.map(match => {
           const returnDate = new Date(match.date);
           returnDate.setDate(returnDate.getDate() + (numRounds + 1) * 7); // Offset for the second half
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
      
      // 4. Handle Playoffs (Mata-Mata)
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

          if (totalQualifiers >= 8) { // Quarter-finals
              lastRound++;
              playoffPromises.push(createPlayoffMatch(lastRound, '1º Colocado', '8º Colocado'));
              playoffPromises.push(createPlayoffMatch(lastRound, '2º Colocado', '7º Colocado'));
              playoffPromises.push(createPlayoffMatch(lastRound, '3º Colocado', '6º Colocado'));
              playoffPromises.push(createPlayoffMatch(lastRound, '4º Colocado', '5º Colocado'));
          }
          if (totalQualifiers >= 4) { // Semi-finals
              lastRound++;
              const qfPrefix = totalQualifiers >= 8 ? "QF" : "Colocado";
              playoffPromises.push(createPlayoffMatch(lastRound, `Vencedor ${qfPrefix} 1`, `Vencedor ${qfPrefix} 4`));
              playoffPromises.push(createPlayoffMatch(lastRound, `Vencedor ${qfPrefix} 2`, `Vencedor ${qfPrefix} 3`));
          }
          if (totalQualifiers >= 2) { // Final
              lastRound++;
              playoffPromises.push(createPlayoffMatch(lastRound, 'Vencedor SF 1', 'Vencedor SF 2'));
          }

          const playoffMatches = await Promise.all(playoffPromises);
          generatedMatches.push(...playoffMatches);
      }

      // 5. Call the service to save the matches
      await leagueService.generateMatches(championship.id, generatedMatches);
      
      // 6. Refresh data and navigate back
      await fetchData();
      setView({ name: 'admin_championship', leagueId: view.leagueId, championshipId: championship.id });

    } catch (error) {
      console.error("Failed to generate matches:", error);
      alert(`Erro ao gerar partidas: ${(error as Error).message}`);
    } finally {
        setIsLoading(false);
    }
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
                                                onSaveFinancials={handleSaveChampionshipFinancials}
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