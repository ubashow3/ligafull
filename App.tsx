
import React, { useState, useMemo, useEffect } from 'react';
import { League, Championship, Club, Match, Player, TechnicalStaff, Official, ChampionshipWizardConfig, Standing, ChampionshipFinancials, UserProfile } from './types';
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
import ClubAdminPage from './pages/admin/ClubAdminPage';
import CreateMatchesPage from './pages/admin/CreateMatchesPage';
import AuthWall from './components/auth/AuthWall';

const normalizeUrl = (url: string | null | undefined): string => {
    if (!url) return '';
    if (url.startsWith('http')) {
        // Se a URL contém /uploads/ mas não contém /LigaFull/uploads/, e o host é localhost, tenta corrigir
        if (url.includes('/uploads/') && !url.includes('/LigaFull/uploads/')) {
            return url.replace('/uploads/', '/LigaFull/uploads/');
        }
        return url;
    }
    
    let cleanPath = url;
    if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);
    
    // Se já começa com LigaFull, não duplica
    if (cleanPath.startsWith('LigaFull/')) {
        return `/${cleanPath}`;
    }
    
    return `/LigaFull/${cleanPath}`;
};

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
        const homeScore = Number(match.homeScore);
        const awayScore = Number(match.awayScore);
        
        home.played++; 
        away.played++;
        home.goalsFor += homeScore; 
        home.goalsAgainst += awayScore;
        away.goalsFor += awayScore; 
        away.goalsAgainst += homeScore;

        if (homeScore > awayScore) {
            home.wins++;
            home.points += 3;
            away.losses++;
        } else if (homeScore < awayScore) {
            away.wins++;
            away.points += 3;
            home.losses++;
        } else {
            home.draws++;
            away.draws++;
            home.points += 1;
            away.points += 1;
        }
        
        home.goalDifference = home.goalsFor - home.goalsAgainst;
        away.goalDifference = away.goalsFor - away.goalsAgainst;
    });
    const standings = Array.from(standingsMap.values());
    standings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
        return a.clubName.localeCompare(b.clubName);
    });
    return standings;
};

const calculateTopScorers = (clubs: Club[], matches: Match[]): any[] => {
    const scorersMap = new Map<string, { id: string, name: string, goals: number, clubName: string, clubLogoUrl: string, photoUrl?: string }>();

    // Map players to clubs for lookup
    const playerToClubMap = new Map<string, { clubName: string, clubLogoUrl: string, photoUrl?: string }>();
    clubs.forEach(club => {
        club.players.forEach(player => {
            playerToClubMap.set(player.id, {
                clubName: club.name,
                clubLogoUrl: club.logoUrl,
                photoUrl: player.photoUrl
            });
        });
    });

    // Count goals from events
    matches.forEach(match => {
        if (match.status === 'finished' || match.status === 'in_progress') {
            (match.events || []).forEach(event => {
                if (event.type === 'goal') {
                    const playerInfo = playerToClubMap.get(event.playerId);
                    const current = scorersMap.get(event.playerId) || {
                        id: event.playerId,
                        name: event.playerName,
                        goals: 0,
                        clubName: playerInfo?.clubName || 'Clube Desconhecido',
                        clubLogoUrl: playerInfo?.clubLogoUrl || '',
                        photoUrl: playerInfo?.photoUrl
                    };
                    current.goals++;
                    scorersMap.set(event.playerId, current);
                }
            });
        }
    });

    return Array.from(scorersMap.values())
        .filter(s => s.goals > 0)
        .sort((a, b) => b.goals - a.goals)
        .slice(0, 20);
};

type View =
  | { name: 'home' }
  | { name: 'league'; leagueId: string }
  | { name: 'championship'; leagueId: string; championshipId: string }
  | { name: 'match'; leagueId: string; championshipId: string; matchId: string }
  | { name: 'create_league' }
  | { name: 'admin_league'; leagueId: string }
  | { name: 'admin_championship'; leagueId: string; championshipId: string }
  | { name: 'admin_match_summary'; leagueId: string; championshipId: string; matchId: string }
  | { name: 'admin_create_matches'; leagueId: string; championshipId: string }
  | { name: 'club_admin'; leagueId: string; championshipId: string; clubId: string };

const App: React.FC = () => {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [view, setView] = useState<View>({ name: 'home' });
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [adminLeague, setAdminLeague] = useState<League | null>(null);
  const [adminClub, setAdminClub] = useState<{ league: League; championship: Championship; club: Club; } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAdminActionsModalOpen, setIsAdminActionsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await leagueService.fetchLeagues();
      setLeagues(data);
    } catch (error: any) {
        console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Verifica se há um usuário convidado ou admin salvo localmente
    const savedUser = localStorage.getItem('ligafull_guest_user');
    if (savedUser) {
        setUser(JSON.parse(savedUser));
    }
  }, []);

  const processedLeagues = useMemo(() => {
    return leagues.map(league => ({
      ...league,
      logoUrl: normalizeUrl(league.logoUrl),
      coverUrl: normalizeUrl(league.coverUrl),
      posts: (league.posts || []).map(post => ({
        ...post,
        imageUrl: normalizeUrl(post.imageUrl),
        authorPhoto: normalizeUrl(post.authorPhoto)
      })),
      championships: league.championships.map(champ => {
        const processedClubs = champ.clubs.map(club => ({
            ...club,
            logoUrl: normalizeUrl(club.logoUrl),
            players: (club.players || []).map(player => ({
                ...player,
                photoUrl: normalizeUrl(player.photoUrl)
            }))
        }));
        return {
          ...champ,
          clubs: processedClubs,
          standings: calculateStandings(processedClubs, champ.matches),
          topScorers: calculateTopScorers(processedClubs, champ.matches),
        };
      }),
    }));
  }, [leagues]);

  const currentLeague = useMemo(() => {
    if (view.name === 'home' || view.name === 'create_league') return null;
    return processedLeagues.find(l => l.id === view.leagueId) || null;
  }, [processedLeagues, view]);

  const currentChampionship = useMemo(() => {
    if (view.name !== 'championship' && view.name !== 'match' && view.name !== 'admin_championship' && view.name !== 'club_admin') return null;
    return currentLeague?.championships.find(c => c.id === view.championshipId) || null;
  }, [currentLeague, view]);

  const currentMatch = useMemo(() => {
    if (view.name !== 'match') return null;
    return currentChampionship?.matches.find(m => m.id === view.matchId) || null;
  }, [currentChampionship, view]);

  const handleLogin = async (email: string, pass: string) => {
    try {
      console.log('Tentando login administrador para:', email);
      const loggedInLeague = await leagueService.login(email, pass);
      if (loggedInLeague) {
        console.log('Login admin bem-sucedido:', loggedInLeague.name);
        setIsAdminMode(true);
        setAdminLeague(loggedInLeague);
        setView({ name: 'admin_league', leagueId: loggedInLeague.id });
        setIsAdminModalOpen(false);
      } else {
        console.error('Credenciais inválidas para:', email);
        alert('Credenciais inválidas.');
      }
    } catch (error: any) {
      console.error('Erro fatal no login:', error);
      alert(`Erro no login: ${error.message}`);
    }
  };

  const handleLoginSuccess = (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
    localStorage.setItem('ligafull_guest_user', JSON.stringify(loggedInUser));
  };

  const handleLogout = async () => {
    localStorage.removeItem('ligafull_guest_user');
    setIsAdminMode(false);
    setAdminLeague(null);
    setAdminClub(null);
    setUser(null);
    setView({ name: 'home' });
    setIsAdminActionsModalOpen(false);
  };

  const handleAdminClick = () => {
    setIsSidebarOpen(false); // Fechar o menu lateral se estiver aberto
    if (isAdminMode) {
      setIsAdminActionsModalOpen(true);
      return;
    }

    if (user) {
      // Se o usuário já estiver logado, verifica se ele tem uma liga
      const userLeague = leagues.find(l => l.adminEmail === user.email);
      if (userLeague) {
        // Se tiver, entra direto como admin (assumindo que a senha do usuário é a mesma da liga por padrão ou simplificação)
        // Na verdade, o ideal seria validar a senha, mas o usuário pediu "vai direto"
        setIsAdminMode(true);
        setAdminLeague(userLeague);
        setView({ name: 'admin_league', leagueId: userLeague.id });
        return;
      }
    }
    
    setIsAdminModalOpen(true);
  };

  const handleCreateChampionship = async (leagueId: string, name: string) => {
    try {
      await leagueService.createChampionship(leagueId, name);
      await fetchData();
      alert('Campeonato criado com sucesso!');
    } catch (error: any) {
      alert(`Erro ao criar campeonato: ${error.message}`);
    }
  };

  const handleCreateOfficial = async (type: 'referees' | 'tableOfficials', data: Omit<Official, 'id'>) => {
    if (!adminLeague) return;
    try {
        await leagueService.createOfficial(adminLeague.id, type, data);
        await fetchData();
        alert('Oficial cadastrado com sucesso!');
    } catch (error: any) {
        alert(`Erro ao cadastrar oficial: ${error.message}`);
    }
  };

  const handleUpdateOfficial = async (type: 'referees' | 'tableOfficials', data: Official) => {
    try {
        await leagueService.updateOfficial(type, data);
        await fetchData();
        alert('Oficial atualizado com sucesso!');
    } catch (error: any) {
        alert(`Erro ao atualizar oficial: ${error.message}`);
    }
  };

  const handleDeleteOfficial = async (type: 'referees' | 'tableOfficials', id: string) => {
    try {
        await leagueService.deleteOfficial(id);
        await fetchData();
        alert('Oficial excluído com sucesso!');
    } catch (error: any) {
        alert(`Erro ao excluir oficial: ${error.message}`);
    }
  };

  const handleCreateClub = async (name: string, abbreviation: string, logoUrl: string, whatsapp: string) => {
    if (view.name !== 'admin_championship' || !view.championshipId) return;
    try {
        await leagueService.createClub(view.championshipId, { name, abbreviation, logoUrl, whatsapp });
        await fetchData();
        alert('Clube cadastrado com sucesso!');
    } catch (error: any) {
        alert(`Erro ao cadastrar clube: ${error.message}`);
    }
  };

  const handleCreatePlayer = async (clubId: string, name: string, position: string, nickname: string, cpf: string, photoUrl: string, birthDate: string) => {
    try {
        await leagueService.createPlayer(clubId, { name, position, nickname, cpf, photo_url: photoUrl, birth_date: birthDate });
        await fetchData();
        alert('Jogador cadastrado com sucesso!');
    } catch (error: any) {
        alert(`Erro ao cadastrar jogador: ${error.message}`);
    }
  };

  const handleCreateStaff = async (clubId: string, name: string, role: string) => {
    try {
        await leagueService.createStaff(clubId, { name, role });
        await fetchData();
        alert('Membro da comissão cadastrado com sucesso!');
    } catch (error: any) {
        alert(`Erro ao cadastrar comissão: ${error.message}`);
    }
  };

  const handleUpdateClubDetails = async (clubId: string, details: any) => {
    try {
        await leagueService.updateClubDetails(clubId, details);
        await fetchData();
        alert('Clube atualizado com sucesso!');
    } catch (error: any) {
        alert(`Erro ao atualizar clube: ${error.message}`);
    }
  };

  const handleUpdatePlayer = async (clubId: string, player: Player) => {
    try {
        await leagueService.updatePlayer(clubId, player);
        await fetchData();
        alert('Jogador atualizado com sucesso!');
    } catch (error: any) {
        alert(`Erro ao atualizar jogador: ${error.message}`);
    }
  };

  const handleDeletePlayer = async (clubId: string, playerId: string) => {
    if (!confirm('Tem certeza que deseja excluir este jogador?')) return;
    try {
        await leagueService.deletePlayer(clubId, playerId);
        await fetchData();
        alert('Jogador excluído com sucesso!');
    } catch (error: any) {
        alert(`Erro ao excluir jogador: ${error.message}`);
    }
  };

  const handleUpdateStaff = async (clubId: string, staff: TechnicalStaff) => {
    try {
        await leagueService.updateStaff(clubId, staff);
        await fetchData();
        alert('Comissão atualizada com sucesso!');
    } catch (error: any) {
        alert(`Erro ao atualizar comissão: ${error.message}`);
    }
  };

  const handleDeleteStaff = async (clubId: string, staffId: string) => {
    if (!confirm('Tem certeza que deseja excluir este membro da comissão?')) return;
    try {
        await leagueService.deleteStaff(clubId, staffId);
        await fetchData();
        alert('Membro excluído com sucesso!');
    } catch (error: any) {
        alert(`Erro ao excluir membro: ${error.message}`);
    }
  };

  const handleSaveFinancials = async (championshipId: string, financials: ChampionshipFinancials) => {
    try {
        await leagueService.saveFinancials(championshipId, financials);
        await fetchData();
        alert('Dados financeiros salvos com sucesso!');
    } catch (error: any) {
        alert(`Erro ao salvar dados financeiros: ${error.message}`);
    }
  };

  const handleUpdateClubFinePaymentStatus = async (championshipId: string, clubId: string, round: number, isPaid: boolean) => {
    try {
        await leagueService.updateClubFinePaymentStatus(championshipId, clubId, round, isPaid);
        await fetchData();
        alert('Status da multa atualizado!');
    } catch (error: any) {
        alert(`Erro ao atualizar multa: ${error.message}`);
    }
  };

  const handleUpdateClubRegistrationStatus = async (championshipId: string, clubId: string, isPaid: boolean) => {
    try {
        await leagueService.updateClubRegistrationStatus(championshipId, clubId, isPaid);
        await fetchData();
        alert('Status de pagamento atualizado!');
    } catch (error: any) {
        alert(`Erro ao atualizar pagamento: ${error.message}`);
    }
  };

  const handleGenerateMatches = async (championshipId: string, config: ChampionshipWizardConfig) => {
    try {
        await leagueService.generateMatches(championshipId, config);
        await fetchData();
        alert('Jogos gerados com sucesso!');
        setView({ name: 'admin_championship', leagueId: view.leagueId as string, championshipId });
    } catch (error: any) {
        alert(`Erro ao gerar jogos: ${error.message}`);
    }
  };

  const handleUpdateMatch = async (match: Match) => {
    try {
        await leagueService.updateMatch(match);
        await fetchData();
    } catch (error: any) {
        alert(`Erro ao atualizar partida: ${error.message}`);
    }
  };

  const renderContent = () => {
    if (isLoading) return <div className="text-center py-20 text-green-400">Carregando LigaFull...</div>;
    
    if (!user && !isAdminMode) {
        return <AuthWall onLoginSuccess={handleLoginSuccess} />;
    }

    if (isAdminMode && (adminLeague || adminClub)) {
        if (adminClub) {
            const { league, championship, club } = adminClub;
            const fullLeagueData = processedLeagues.find(l => l.id === league.id);
            const fullChampionshipData = fullLeagueData?.championships.find(c => c.id === championship.id);
            const fullClubData = fullChampionshipData?.clubs.find(c => c.id === club.id);
            if (view.name === 'club_admin' && fullLeagueData && fullChampionshipData && fullClubData) {
                return <ClubAdminPage league={fullLeagueData} championship={fullChampionshipData} club={fullClubData} onUpdatePlayer={handleUpdatePlayer} onCreatePlayer={handleCreatePlayer} onDeletePlayer={handleDeletePlayer} onCreateStaff={handleCreateStaff} onUpdateStaff={handleUpdateStaff} onDeleteStaff={handleDeleteStaff} onUpdateClubDetails={handleUpdateClubDetails} onUpdateClubRegistrationStatus={handleUpdateClubRegistrationStatus} />;
            }
        }
        if (adminLeague) {
            const adminLeagueData = processedLeagues.find(l => l.id === adminLeague.id);
            if (!adminLeagueData) { handleLogout(); return null; }
            switch (view.name) {
                case 'admin_league':
                    return <AdminLeaguePage league={adminLeagueData} onSelectChampionship={champ => setView({name: 'admin_championship', leagueId: adminLeagueData.id, championshipId: champ.id})} onCreateChampionship={handleCreateChampionship} onCreateOfficial={handleCreateOfficial} onUpdateOfficial={handleUpdateOfficial} onDeleteOfficial={handleDeleteOfficial} />;
                case 'admin_championship':
                    const adminChampionship = adminLeagueData.championships.find(c => c.id === view.championshipId);
                    if (adminChampionship) return <AdminChampionshipPage championship={adminChampionship} league={adminLeagueData} onBack={() => setView({name: 'admin_league', leagueId: adminLeagueData.id})} onSelectMatch={(match) => setView({ name: 'admin_match_summary', leagueId: adminLeagueData.id, championshipId: adminChampionship.id, matchId: match.id })} onCreateClub={handleCreateClub} onUpdateMatch={handleUpdateMatch} onNavigateToCreateMatches={() => setView({ name: 'admin_create_matches', leagueId: adminLeagueData.id, championshipId: adminChampionship.id })} onUpdatePlayer={handleUpdatePlayer} onCreatePlayer={handleCreatePlayer} onDeletePlayer={handleDeletePlayer} onCreateStaff={handleCreateStaff} onUpdateStaff={handleUpdateStaff} onDeleteStaff={handleDeleteStaff} onSaveFinancials={handleSaveFinancials} onUpdateClubRegistrationStatus={handleUpdateClubRegistrationStatus} onUpdateClubFinePaymentStatus={handleUpdateClubFinePaymentStatus} onUpdateClubDetails={handleUpdateClubDetails} />;
                    break;
                case 'admin_match_summary':
                    const summaryChamp = adminLeagueData.championships.find(c => c.id === view.championshipId);
                    const summaryMatch = summaryChamp?.matches.find(m => m.id === view.matchId);
                    if (summaryChamp && summaryMatch) return <AdminMatchSummaryPage match={summaryMatch} league={adminLeagueData} championship={summaryChamp} onBack={() => setView({ name: 'admin_championship', leagueId: adminLeagueData.id, championshipId: summaryChamp.id })} onUpdateMatch={handleUpdateMatch} />;
                    break;
                case 'admin_create_matches':
                    const createMatchesChamp = adminLeagueData.championships.find(c => c.id === view.championshipId);
                    if (createMatchesChamp) return <CreateMatchesPage championship={createMatchesChamp} onBack={() => setView({ name: 'admin_championship', leagueId: adminLeagueData.id, championshipId: createMatchesChamp.id })} onGenerateMatches={(config) => handleGenerateMatches(createMatchesChamp.id, config)} />;
                    break;
            }
        }
    }
    
    switch (view.name) {
        case 'home':
            return <HomePage leagues={processedLeagues} onSelectLeague={league => setView({ name: 'league', leagueId: league.id })} />;
        case 'league':
            if (currentLeague) return <LeaguePage league={currentLeague} onSelectChampionship={champ => setView({ name: 'championship', leagueId: currentLeague.id, championshipId: champ.id })} onBack={() => setView({ name: 'home' })} isAdminMode={false} user={user} onCreateChampionship={handleCreateChampionship} />;
            break;
        case 'championship':
            if (currentChampionship && currentLeague) return <ChampionshipPage championship={currentChampionship} league={currentLeague} onBack={() => setView({ name: 'league', leagueId: currentLeague.id })} onSelectMatch={match => setView({ name: 'match', leagueId: currentLeague.id, championshipId: currentChampionship.id, matchId: match.id })} isAdminMode={false} user={user} onCreateClub={handleCreateClub} onGenerateMatches={() => {}} />;
            break;
        case 'match':
            if (currentMatch && currentLeague && currentChampionship) return <MatchSummaryPage match={currentMatch} league={currentLeague} onBack={() => setView({ name: 'championship', leagueId: currentLeague.id, championshipId: currentChampionship.id })} />;
            break;
        case 'create_league':
            return <CreateLeaguePage onBack={() => setView({ name: 'home' })} onLeagueCreated={() => { fetchData(); setView({ name: 'home' }); }} user={user} />;
    }
    return null;
  };

  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen font-sans">
      <Header
        onTitleClick={() => isAdminMode ? handleLogout() : setView({ name: 'home' })}
        onAdminClick={handleAdminClick}
        onMenuClick={() => setIsSidebarOpen(true)}
        onLogoutClick={handleLogout}
        isAdminMode={isAdminMode}
        user={user}
      />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} leagues={processedLeagues} onSelectLeague={league => { setView({ name: 'league', leagueId: league.id }); setIsSidebarOpen(false); }} />
      <main className="container mx-auto px-4 py-8">
        {renderContent()}
      </main>
      <Footer />
      <AdminModal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} onNavigateToCreateLeague={() => { setIsAdminModalOpen(false); setView({ name: 'create_league' }); }} onLogin={handleLogin} user={user} />
      <AdminActionsModal isOpen={isAdminActionsModalOpen} onClose={() => setIsAdminActionsModalOpen(false)} onLogout={handleLogout} />
    </div>
  );
};

export default App;
