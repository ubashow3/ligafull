import React, { useState, useMemo, useEffect } from 'react';
import { League, Championship, Club, Match, Player, TechnicalStaff, Official, ChampionshipFinancials, ChampionshipWizardConfig, Standing, MatchEvent } from './types';
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

        home.played++; away.played++;
        home.goalsFor += homeScore; away.goalsFor += awayScore;
        home.goalsAgainst += awayScore; away.goalsAgainst += homeScore;
        home.goalDifference = home.goalsFor - home.goalsAgainst;
        away.goalDifference = away.goalsFor - away.goalsAgainst;

        if (homeScore > awayScore) {
            home.wins++; home.points += 3; away.losses++;
        } else if (awayScore > homeScore) {
            away.wins++; away.points += 3; home.losses++;
        } else {
            home.draws++; away.draws++; home.points++; away.points++;
        }
    });

    return Array.from(standingsMap.values()).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
        return a.clubName.localeCompare(b.clubName);
    });
};

const App: React.FC = () => {
  const [leaguesData, setLeaguesData] = useState<League[]>([]);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [selectedChampionship, setSelectedChampionship] = useState<Championship | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [loggedInLeagueAdminId, setLoggedInLeagueAdminId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAdminActionsModalOpen, setIsAdminActionsModalOpen] = useState(false);
  const [isCreatingLeague, setIsCreatingLeague] = useState(false);

  const fetchData = async () => {
    try {
      setIsAppLoading(true);
      const data = await leagueService.fetchLeagues();
      setLeaguesData(data);
    } catch (error) {
      console.error("Failed to load data:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Não foi possível carregar os dados das ligas. Verifique a conexão com o banco de dados.\n\nDetalhes: ${errorMessage}`);
    } finally {
      setIsAppLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  
  // Synchronization effect to keep selected items in sync with the main data source
  useEffect(() => {
    if (selectedLeague) {
      const updatedLeague = leaguesData.find(l => l.id === selectedLeague.id);
      setSelectedLeague(updatedLeague || null);
      if (selectedChampionship && updatedLeague) {
        const updatedChampionship = updatedLeague.championships.find(c => c.id === selectedChampionship.id);
        setSelectedChampionship(updatedChampionship || null);
        if (selectedMatch && updatedChampionship) {
          const updatedMatch = updatedChampionship.matches.find(m => m.id === selectedMatch.id);
          setSelectedMatch(updatedMatch || null);
        }
      }
    }
  }, [leaguesData]);


  // Navigation Handlers
  const handleSelectLeague = (league: League) => {
    setSelectedLeague(league);
    setCurrentPage(isAdminMode && loggedInLeagueAdminId === league.id ? 'admin_league' : 'league');
    setSelectedChampionship(null);
    setSelectedMatch(null);
  };

  const handleSelectChampionship = (championship: Championship) => {
    setSelectedChampionship(championship);
    setCurrentPage(isAdminMode ? 'admin_championship' : 'championship');
    setSelectedMatch(null);
  };

  const handleSelectMatch = (match: Match) => {
    setSelectedMatch(match);
    setCurrentPage(isAdminMode ? 'admin_match' : 'match');
  };

  const handleBack = () => {
    if (currentPage === 'admin_create_matches') {
        setCurrentPage('admin_championship');
    } else if (currentPage.includes('match')) {
      setCurrentPage(isAdminMode ? 'admin_championship' : 'championship');
      setSelectedMatch(null);
    } else if (currentPage.includes('championship')) {
      setCurrentPage(isAdminMode && selectedLeague ? 'admin_league' : 'league');
      setSelectedChampionship(null);
    } else if (currentPage.includes('league')) {
      setCurrentPage('home');
      setSelectedLeague(null);
    } else if (currentPage === 'create_league') {
      setCurrentPage('home');
    } else {
      setCurrentPage('home');
    }
  };

  const handleTitleClick = () => {
    setCurrentPage('home');
    setSelectedLeague(null);
    setSelectedChampionship(null);
    setSelectedMatch(null);
  };

  // Admin Handlers
  const handleAdminClick = () => {
    if (isAdminMode) {
      setIsAdminActionsModalOpen(true);
    } else {
      setIsAdminModalOpen(true);
    }
  };

  const handleLogin = async (email: string, pass: string) => {
    const league = await leagueService.login(email, pass);
    if (league) {
      setIsAdminMode(true);
      setLoggedInLeagueAdminId(league.id);
      setSelectedLeague(league);
      setCurrentPage('admin_league');
      setIsAdminModalOpen(false);
      // Refresh all data to ensure we have the latest after logging in
      await fetchData();
    } else {
      alert('Credenciais inválidas.');
    }
  };

  const handleLogout = () => {
    setIsAdminMode(false);
    setLoggedInLeagueAdminId(null);
    setIsAdminActionsModalOpen(false);
    setCurrentPage('home');
    setSelectedLeague(null);
  };

  const handleNavigateToCreateLeague = () => {
    setIsAdminModalOpen(false);
    setCurrentPage('create_league');
  };
  
  const handleNavigateToCreateMatches = () => {
    setCurrentPage('admin_create_matches');
  };

  // CRUD Handlers
  const handleCreateLeague = async (name: string, logoUrl: string, email: string, password: string, city: string, state: string) => {
    setIsCreatingLeague(true);
    try {
      const newLeague = await leagueService.createLeague({ name, logoUrl, adminEmail: email, adminPassword: password, city, state });
      setLeaguesData(prev => [...prev, newLeague]);
      
      setIsAdminMode(true);
      setLoggedInLeagueAdminId(newLeague.id);
      setSelectedLeague(newLeague);
      setCurrentPage('admin_league');
      setIsAdminModalOpen(false);
    } catch (error) {
        // Display a more specific error message from the service layer.
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
        alert(`Erro ao criar a liga: ${errorMessage}`);
    } finally {
        setIsCreatingLeague(false);
    }
  };

  const handleCreateChampionship = async (leagueId: string, champName: string) => {
    try {
      const newChampionship = await leagueService.createChampionship(leagueId, champName);
      await fetchData(); // Refetch all data to ensure consistency
    } catch (error) {
      alert("Erro ao criar o campeonato.");
    }
  };
    
  const handleCreateClub = async (name: string, abbreviation: string, logoUrl: string, whatsapp: string) => {
    if (!selectedChampionship) return;
    try {
      await leagueService.addClubToChampionship(selectedChampionship.id, { name, abbreviation, logoUrl, whatsapp });
      await fetchData();
    } catch (error) {
        alert("Erro ao adicionar clube.");
    }
  };
    
  const generateMatchesLogic = (clubs: Club[], config: ChampionshipWizardConfig): Match[] => {
    // This logic remains the same as it's pure data transformation
    const matches: Match[] = [];
    let currentRound = 1;

    // --- Phase 1: Group or Round Robin Stage ---
    if (config.format === 'ROUND_ROBIN') {
        const groupMatches = generateRoundRobinMatches(clubs, config.turns, currentRound, 'round-robin');
        matches.push(...groupMatches);
        currentRound += Math.max(0, ...groupMatches.map(m => m.round));
    } else if (config.format === 'GROUP_STAGE') {
        const groups: Club[][] = Array.from({ length: config.numGroups }, () => []);
        clubs.forEach((club, index) => {
            groups[index % config.numGroups].push(club);
        });

        if (config.groupPlayType === 'WITHIN_GROUP') {
            let maxRoundsInGroupStage = 0;
            groups.forEach((group, index) => {
                if (group.length > 1) {
                    const groupMatches = generateRoundRobinMatches(group, config.turns, 1, `group-${index}`);
                    maxRoundsInGroupStage = Math.max(maxRoundsInGroupStage, ...groupMatches.map(m => m.round));
                    matches.push(...groupMatches.map(m => ({ ...m, round: m.round + currentRound - 1 })));
                }
            });
            currentRound += maxRoundsInGroupStage;
        } else { // CROSS_GROUP variations
            const pairings: [Club[], Club[]][] = [];
            if (config.groupPlayType === 'CROSS_GROUP_SEQUENTIAL') {
                for (let i = 0; i < config.numGroups; i += 2) {
                    if (groups[i + 1]) pairings.push([groups[i], groups[i+1]]);
                }
            } else if (config.groupPlayType === 'CROSS_GROUP_REVERSE') {
                const mid = Math.ceil(config.numGroups / 2);
                for (let i = 0; i < mid; i++) {
                     if (groups[config.numGroups - 1 - i] && i !== config.numGroups - 1 - i) {
                        pairings.push([groups[i], groups[config.numGroups - 1 - i]]);
                     }
                }
            }

            let maxRoundsInCrossGroup = 0;
            pairings.forEach((pair, pairIndex) => {
                const [groupA, groupB] = pair;
                const combined = [...groupA, ...groupB];
                const allPairMatches = generateRoundRobinMatches(combined, config.turns, 1, `pair-${pairIndex}`);
                
                const crossMatches = allPairMatches.filter(m => {
                    const homeInA = groupA.some(c => c.id === m.homeTeam.id);
                    const awayInB = groupB.some(c => c.id === m.awayTeam.id);
                    const homeInB = groupB.some(c => c.id === m.homeTeam.id);
                    const awayInA = groupA.some(c => c.id === m.awayTeam.id);
                    return (homeInA && awayInB) || (homeInB && awayInA);
                });
                
                maxRoundsInCrossGroup = Math.max(maxRoundsInCrossGroup, ...crossMatches.map(m => m.round));
                matches.push(...crossMatches.map(m => ({ ...m, round: m.round + currentRound - 1 })));
            });
            currentRound += maxRoundsInCrossGroup;
        }
    }

    if (config.playoffs && config.playoffTeamsPerGroup > 0) {
        const totalQualifiers = config.format === 'ROUND_ROBIN' 
            ? config.playoffTeamsPerGroup 
            : config.numGroups * config.playoffTeamsPerGroup;
        
        if (totalQualifiers > 1) {
            const playoffRounds = generatePlayoffMatches(totalQualifiers, currentRound, config);
            matches.push(...playoffRounds);
        }
    }

    return matches.map((match, index) => ({
        ...match,
        id: `m-${Date.now()}-${index}`, // This ID is temporary for the client
        date: new Date(Date.now() + (index * 7 * 24 * 3600000)).toISOString(),
    }));
  };

  const generateRoundRobinMatches = (teams: Club[], turns: 1 | 2, startRound: number, salt: string): Match[] => {
      const matches: Match[] = [];
      if (teams.length < 2) return [];

      let schedule = [...teams];
      const isOdd = schedule.length % 2 !== 0;
      if (isOdd) {
          schedule.push({ id: `dummy-${salt}`, name: 'dummy', abbreviation: 'DUM', logoUrl: '', players: [], technicalStaff: [] });
      }

      const numRounds = schedule.length - 1;
      for (let round = 0; round < numRounds; round++) {
          for (let i = 0; i < schedule.length / 2; i++) {
              const home = schedule[i];
              const away = schedule[schedule.length - 1 - i];
              if (home.id.startsWith('dummy') === false && away.id.startsWith('dummy') === false) {
                  matches.push({
                      id: '', round: startRound + round, homeTeam: home, awayTeam: away,
                      homeScore: null, awayScore: null, status: 'scheduled', location: 'A Definir', events: [], date: ''
                  });
              }
          }
          schedule.splice(1, 0, schedule.pop()!); // Rotate teams
      }
      if (turns === 2) {
          const secondTurnMatches = [...matches].map(match => ({
              ...match,
              round: match.round + numRounds,
              homeTeam: match.awayTeam,
              awayTeam: match.homeTeam
          }));
          matches.push(...secondTurnMatches);
      }
      return matches;
  };

  const generatePlayoffMatches = (numQualifiers: number, startRound: number, config: ChampionshipWizardConfig): Match[] => {
      const matches: Match[] = [];
      const placeholderTeam = (name: string): Club => ({ id: `ph-${name.toLowerCase().replace(/\s/g, '-')}`, name, abbreviation: 'TBD', logoUrl: '', players: [], technicalStaff: [] });

      let round = startRound;
      let qualifiers: Club[] = Array.from({ length: numQualifiers }, (_, i) => {
          if (config.format === 'GROUP_STAGE') {
              const groupIndex = i % config.numGroups;
              const groupLetter = String.fromCharCode(65 + groupIndex);
              const position = Math.floor(i / config.numGroups) + 1;
              return placeholderTeam(`${position}º Grupo ${groupLetter}`);
          }
          return placeholderTeam(`${i + 1}º Classificado`);
      });

      let currentStageQualifiers = [...qualifiers];
      while (currentStageQualifiers.length > 1) {
          const nextRoundQualifiers: Club[] = [];
          const stageName = currentStageQualifiers.length === 2 ? 'Final' : currentStageQualifiers.length === 4 ? 'Semifinal' : currentStageQualifiers.length === 8 ? 'Quartas' : `Fase de ${currentStageQualifiers.length}`;
          
          for (let i = 0; i < currentStageQualifiers.length / 2; i++) {
              const home = currentStageQualifiers[i];
              const away = currentStageQualifiers[currentStageQualifiers.length - 1 - i];
              const matchName = `${stageName} ${i + 1}`;
              
              matches.push({
                  id: '', round, homeTeam: home, awayTeam: away,
                  homeScore: null, awayScore: null, status: 'scheduled', location: 'A Definir', events: [], date: ''
              });
              nextRoundQualifiers.push(placeholderTeam(`Vencedor ${matchName}`));
          }
          currentStageQualifiers = nextRoundQualifiers;
          round++;
      }
      return matches;
  };

  const handleGenerateMatches = async (config: ChampionshipWizardConfig) => {
    if (!selectedChampionship) return;
    const newMatches = generateMatchesLogic(selectedChampionship.clubs, config);
    try {
        await leagueService.generateMatches(selectedChampionship.id, newMatches);
        await fetchData();
        setCurrentPage('admin_championship');
    } catch (error) {
        alert("Erro ao gerar os jogos.");
    }
  };

  const handleUpdateMatch = async (updatedMatch: Match) => {
    if (!selectedChampionship) return;
    try {
      // The update service needs to handle recalculations or the refetch will
      await leagueService.updateMatch(updatedMatch, selectedChampionship.clubs);
      await fetchData();
    } catch(error) {
        alert("Erro ao atualizar a partida.");
    }
  };
  
  const handleCreateOfficial = async (type: 'referees' | 'tableOfficials', data: Omit<Official, 'id'>) => {
    if (!loggedInLeagueAdminId) return;
    try {
        await leagueService.createOfficial(loggedInLeagueAdminId, type, data);
        await fetchData();
    } catch(error) {
        alert("Erro ao criar oficial.");
    }
  };
  const handleUpdateOfficial = async (type: 'referees' | 'tableOfficials', data: Official) => {
    try {
        await leagueService.updateOfficial(data);
        await fetchData();
    } catch(error) {
        alert("Erro ao atualizar oficial.");
    }
  };
  const handleDeleteOfficial = async (type: 'referees' | 'tableOfficials', id: string) => {
     try {
        await leagueService.deleteOfficial(id);
        await fetchData();
    } catch(error) {
        alert("Erro ao deletar oficial.");
    }
  };

  const handleCreatePlayer = async (clubId: string, name: string, position: string, nickname: string, cpf: string, photoUrl: string) => {
    if (!selectedChampionship) return;
    try {
        await leagueService.createPlayer(clubId, {name, position, nickname, cpf, photoUrl, goals: 0});
        await fetchData();
    } catch(error) {
        alert("Erro ao criar jogador.");
    }
  };
  const handleUpdatePlayer = async (clubId: string, updatedPlayer: Player) => {
     try {
        await leagueService.updatePlayer(updatedPlayer);
        await fetchData();
    } catch(error) {
        alert("Erro ao atualizar jogador.");
    }
  };
  const handleDeletePlayer = async (clubId: string, playerId: string) => {
    try {
        await leagueService.deletePlayer(playerId);
        await fetchData();
    } catch(error) {
        alert("Erro ao deletar jogador.");
    }
  };
  
  const handleCreateStaff = async (clubId: string, name: string, role: string) => {
      try {
        await leagueService.createStaff(clubId, {name, role});
        await fetchData();
    } catch(error) {
        alert("Erro ao criar membro da comissão.");
    }
  };
  const handleUpdateStaff = async (clubId: string, updatedStaff: TechnicalStaff) => {
      try {
        await leagueService.updateStaff(updatedStaff);
        await fetchData();
    } catch(error) {
        alert("Erro ao atualizar membro da comissão.");
    }
  };
  const handleDeleteStaff = async (clubId: string, staffId: string) => {
      try {
        await leagueService.deleteStaff(staffId);
        await fetchData();
    } catch(error) {
        alert("Erro ao deletar membro da comissão.");
    }
  };

  const handleSaveFinancials = async (championshipId: string, financials: ChampionshipFinancials) => {
       if (!selectedChampionship) return;
       try {
            // Client-side calculation remains, but now we persist it.
            const { registrationFeePerClub, yellowCardFine, redCardFine } = financials;
            const costPerGame = financials.refereeFee + (financials.assistantFee * 2) + financials.tableOfficialFee + financials.fieldFee;
            const totalCost = costPerGame * selectedChampionship.matches.length;
            const finalRegFee = selectedChampionship.clubs.length > 0 ? totalCost / selectedChampionship.clubs.length : 0;
            
            const finalFinancials: ChampionshipFinancials = { ...financials, totalCost, registrationFeePerClub: finalRegFee };

            await leagueService.saveFinancials(championshipId, finalFinancials, selectedChampionship.clubs);
            await fetchData();
       } catch (error) {
            alert("Erro ao salvar dados financeiros.");
       }
  };

  const handleUpdateClubPayment = async (clubId: string, amount: number) => {
       if (!selectedChampionship) return;
       try {
            await leagueService.updateClubPayment(selectedChampionship.id, clubId, amount);
            await fetchData();
       } catch (error) {
            alert("Erro ao atualizar pagamento.");
       }
  };

  // Render Logic
  const renderPage = () => {
    if (isAppLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-xl">Carregando Ligas...</span>
            </div>
        );
    }
    
    switch (currentPage) {
      case 'home':
        return <HomePage leagues={leaguesData} onSelectLeague={handleSelectLeague} />;
      case 'league':
        return selectedLeague && <LeaguePage league={selectedLeague} onSelectChampionship={handleSelectChampionship} onBack={handleBack} isAdminMode={false} onCreateChampionship={handleCreateChampionship} />;
      case 'championship':
        // Pass the calculated standings to the component
        const champWithStandings = selectedChampionship ? { ...selectedChampionship, standings: calculateStandings(selectedChampionship.clubs, selectedChampionship.matches)} : null;
        return selectedLeague && champWithStandings && <ChampionshipPage league={selectedLeague} championship={champWithStandings} onBack={handleBack} onSelectMatch={handleSelectMatch} isAdminMode={false} onCreateClub={handleCreateClub} onGenerateMatches={handleGenerateMatches} />;
      case 'match':
        return selectedLeague && selectedMatch && <MatchSummaryPage league={selectedLeague} match={selectedMatch} onBack={handleBack} />;
      case 'create_league':
        return <CreateLeaguePage onBack={handleBack} onCreateLeague={handleCreateLeague} isLoading={isCreatingLeague} />;
      // Admin Pages
      case 'admin_league':
        return selectedLeague && <AdminLeaguePage league={selectedLeague} onSelectChampionship={handleSelectChampionship} onCreateChampionship={handleCreateChampionship} onCreateOfficial={handleCreateOfficial} onUpdateOfficial={handleUpdateOfficial} onDeleteOfficial={handleDeleteOfficial} onSaveFinancials={handleSaveFinancials} />;
      case 'admin_championship':
        const adminChampWithStandings = selectedChampionship ? { ...selectedChampionship, standings: calculateStandings(selectedChampionship.clubs, selectedChampionship.matches)} : null;
        return selectedLeague && adminChampWithStandings && <AdminChampionshipPage league={selectedLeague} championship={adminChampWithStandings} onBack={handleBack} onSelectMatch={handleSelectMatch} onCreateClub={handleCreateClub} onGenerateMatches={handleGenerateMatches} onUpdateMatch={handleUpdateMatch} onUpdateClubPayment={handleUpdateClubPayment} onUpdatePlayer={handleUpdatePlayer} onCreatePlayer={handleCreatePlayer} onDeletePlayer={handleDeletePlayer} onCreateStaff={handleCreateStaff} onUpdateStaff={handleUpdateStaff} onDeleteStaff={handleDeleteStaff} onNavigateToCreateMatches={handleNavigateToCreateMatches} />;
      case 'admin_match':
        return selectedLeague && selectedChampionship && selectedMatch && <AdminMatchSummaryPage league={selectedLeague} championship={selectedChampionship} match={selectedMatch} onBack={handleBack} onUpdateMatch={handleUpdateMatch} />;
      case 'admin_create_matches':
        return selectedLeague && selectedChampionship && <CreateMatchesPage championship={selectedChampionship} onBack={handleBack} onGenerateMatches={handleGenerateMatches} />;
      default:
        return <HomePage leagues={leaguesData} onSelectLeague={handleSelectLeague} />;
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      <Header onTitleClick={handleTitleClick} onAdminClick={handleAdminClick} onMenuClick={() => setIsSidebarOpen(true)} isAdminMode={isAdminMode} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} leagues={leaguesData} onSelectLeague={handleSelectLeague} />
      <AdminModal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} onNavigateToCreateLeague={handleNavigateToCreateLeague} onLogin={handleLogin} />
      <AdminActionsModal isOpen={isAdminActionsModalOpen} onClose={() => setIsAdminActionsModalOpen(false)} onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 py-8">
        {renderPage()}
      </main>
      
      <Footer />
    </div>
  );
};

export default App;