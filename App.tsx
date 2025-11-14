
import React, { useState, useMemo, useEffect } from 'react';
import { League, Championship, Club, Match, Player, TechnicalStaff, Official, ChampionshipWizardConfig, Standing, MatchEvent } from './types';
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
// FIX: Completed the function logic to calculate standings and return a sorted array, resolving the "must return a value" error.
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

// FIX: Added the main App component and its default export, which was missing and causing a build error.
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
      alert('Falha ao carregar dados.');
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

  const handleLogin = async (email: string, pass: string) => {
    const loggedInLeague = processedLeagues.find(l => l.adminEmail === email && l.adminPassword === pass);
    if (loggedInLeague) {
      setIsAdminMode(true);
      setAdminLeague(loggedInLeague);
      setView({ name: 'admin_league', leagueId: loggedInLeague.id });
      setIsAdminModalOpen(false);
    } else {
      alert('Credenciais inválidas.');
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

  const onUpdateMatch = async (updatedMatch: Match) => {
    if (!currentLeague) return;
    try {
      await leagueService.updateMatch(updatedMatch, currentLeague);
      await fetchData();
    } catch (error) {
      console.error("Failed to update match", error);
    }
  };

  const dummyAction = (action: string) => async () => {
    console.log(action);
    alert('Ação de admin não implementada neste escopo. Recarregando dados...');
    await fetchData();
  };

  const renderContent = () => {
    if (isLoading) return <div className="text-center">Carregando...</div>;
    
    if (isAdminMode && adminLeague) {
        const adminLeagueData = processedLeagues.find(l => l.id === adminLeague.id) || adminLeague;
        const adminChampionship = adminLeagueData.championships.find(c => view.name === 'admin_championship' && c.id === view.championshipId);
        const adminMatch = adminChampionship?.matches.find(m => view.name === 'admin_match' && m.id === view.matchId);

        switch (view.name) {
            case 'admin_league':
                return <AdminLeaguePage league={adminLeagueData} onSelectChampionship={champ => setView({name: 'admin_championship', leagueId: adminLeagueData.id, championshipId: champ.id})} onCreateChampionship={dummyAction('Create Champ')} onCreateOfficial={dummyAction('Create Official')} onUpdateOfficial={dummyAction('Update Official')} onDeleteOfficial={dummyAction('Delete Official')} />;
            case 'admin_championship':
                if (adminChampionship) return <AdminChampionshipPage championship={adminChampionship} league={adminLeagueData} onBack={() => setView({name: 'admin_league', leagueId: adminLeagueData.id})} onSelectMatch={match => setView({name: 'admin_match', leagueId: adminLeagueData.id, championshipId: adminChampionship.id, matchId: match.id})} onCreateClub={dummyAction('Create Club')} onGenerateMatches={dummyAction('Generate Matches')} onUpdateMatch={onUpdateMatch} onNavigateToCreateMatches={() => setView({name: 'create_matches', leagueId: adminLeagueData.id, championshipId: adminChampionship.id})} onCreatePlayer={dummyAction('Create Player')} onUpdatePlayer={dummyAction('Update Player')} onDeletePlayer={dummyAction('Delete Player')} onCreateStaff={dummyAction('Create Staff')} onUpdateStaff={dummyAction('Update Staff')} onDeleteStaff={dummyAction('Delete Staff')} />;
                break;
            case 'admin_match':
                if (adminMatch && adminChampionship) return <AdminMatchSummaryPage match={adminMatch} league={adminLeagueData} championship={adminChampionship} onBack={() => setView({name: 'admin_championship', leagueId: adminLeagueData.id, championshipId: adminChampionship.id})} onUpdateMatch={onUpdateMatch} />;
                break;
            case 'create_matches':
                 const champForCreation = adminLeagueData.championships.find(c => c.id === view.championshipId);
                 if (champForCreation) return <CreateMatchesPage championship={champForCreation} onBack={() => setView({name: 'admin_championship', leagueId: adminLeagueData.id, championshipId: champForCreation.id})} onGenerateMatches={dummyAction('Generate Matches')} />
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
            if (currentMatch && currentLeague) return <MatchSummaryPage match={currentMatch} league={currentLeague} onBack={() => setView({ name: 'championship', leagueId: currentLeague.id, championshipId: currentMatch.championship_id! })} />;
            break;
        case 'create_league':
            return <CreateLeaguePage onBack={() => setView({ name: 'home' })} onCreateLeague={handleCreateLeague} isLoading={isLoading} />;
    }
    return <div><p>Página não encontrada ou dados indisponíveis.</p><button onClick={() => setView({name: 'home'})}>Voltar para Home</button></div>;
  };

  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen font-sans">
      <Header
        onTitleClick={() => {
          if (isAdminMode) handleLogout();
          setView({ name: 'home' });
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
        onSelectLeague={league => setView({ name: 'league', leagueId: league.id })}
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