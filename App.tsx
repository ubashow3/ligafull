import React, { useState, useMemo } from 'react';
import { mockLeagues } from './data/mockData';
import { League, Championship, Club, Match, Player, TechnicalStaff, Official, ChampionshipFinancials, ChampionshipWizardConfig, Standing } from './types';
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

// Helper function to generate a slug
const generateSlug = (name: string) => {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
};

// Helper function to calculate standings
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
        if (!standingsMap.has(match.homeTeam.id) || !standingsMap.has(match.awayTeam.id)) return;
        
        const home = standingsMap.get(match.homeTeam.id)!;
        const away = standingsMap.get(match.awayTeam.id)!;
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
  const [leaguesData, setLeaguesData] = useState<League[]>(mockLeagues);
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

  // Synchronization effect to keep selected items in sync with the main data source
  // This prevents stale state issues after updates
  React.useEffect(() => {
    if (selectedLeague) {
      const updatedLeague = leaguesData.find(l => l.id === selectedLeague.id);
      setSelectedLeague(updatedLeague || null);
      if (selectedChampionship) {
        const updatedChampionship = updatedLeague?.championships.find(c => c.id === selectedChampionship.id);
        setSelectedChampionship(updatedChampionship || null);
        if (selectedMatch) {
          const updatedMatch = updatedChampionship?.matches.find(m => m.id === selectedMatch.id);
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

  const handleLogin = (email: string, pass: string) => {
    const league = leaguesData.find(l => l.adminEmail === email && l.adminPassword === pass);
    if (league) {
      setIsAdminMode(true);
      setLoggedInLeagueAdminId(league.id);
      setSelectedLeague(league);
      setCurrentPage('admin_league');
      setIsAdminModalOpen(false);
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
  const handleCreateLeague = async (name: string, logoUrl: string, email: string, password: string) => {
    setIsCreatingLeague(true);
    // Simulate network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newLeague: League = {
      id: `liga-${Date.now()}`, name, slug: generateSlug(name),
      logoUrl: logoUrl || `https://picsum.photos/seed/${Date.now()}/200/200`,
      adminEmail: email, adminPassword: password,
      referees: [], tableOfficials: [], championships: [],
    };

    setLeaguesData(prev => [...prev, newLeague]);
    
    // Directly log in with the newly created league object to avoid race conditions
    setIsAdminMode(true);
    setLoggedInLeagueAdminId(newLeague.id);
    setSelectedLeague(newLeague);
    setCurrentPage('admin_league');
    setIsAdminModalOpen(false);
    
    setIsCreatingLeague(false);
  };

  const handleCreateChampionship = (leagueId: string, champName: string) => {
    const newChampionship: Championship = {
      id: `champ-${leagueId}-${Date.now()}`,
      name: champName,
      clubs: [],
      matches: [],
      standings: [],
      financials: null,
      clubFinancials: null,
    };
    
    setLeaguesData(prevLeagues => {
      let updatedLeague: League | undefined;
      const newLeaguesData = prevLeagues.map(l => {
        if (l.id === leagueId) {
          updatedLeague = {
            ...l,
            championships: [...l.championships, newChampionship],
          };
          return updatedLeague;
        }
        return l;
      });
      
      // Explicitly update selectedLeague to ensure the UI re-renders with the new data.
      if (updatedLeague && selectedLeague?.id === updatedLeague.id) {
        setSelectedLeague(updatedLeague);
      }
      
      return newLeaguesData;
    });
  };
    
  const handleCreateClub = (name: string, abbreviation: string, logoUrl: string, whatsapp: string) => {
    if (!selectedLeague || !selectedChampionship) return;
    const newClub: Club = {
      id: `club-${Date.now()}`, name, abbreviation,
      logoUrl: logoUrl || `https://picsum.photos/seed/${Date.now()}/100/100`,
      whatsapp, players: [], technicalStaff: [],
    };
    setLeaguesData(prev => prev.map(l => l.id === selectedLeague.id ? { ...l, championships: l.championships.map(c => c.id === selectedChampionship.id ? { ...c, clubs: [...c.clubs, newClub] } : c) } : l));
  };
    
  // New, powerful match generation logic
    const generateMatchesLogic = (clubs: Club[], config: ChampionshipWizardConfig): Match[] => {
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

    // --- Phase 2: Playoffs ---
    if (config.playoffs && config.playoffTeamsPerGroup > 0) {
        const totalQualifiers = config.format === 'ROUND_ROBIN' 
            ? config.playoffTeamsPerGroup 
            : config.numGroups * config.playoffTeamsPerGroup;
        
        if (totalQualifiers > 1) {
            const playoffRounds = generatePlayoffMatches(totalQualifiers, currentRound, config);
            matches.push(...playoffRounds);
        }
    }

    // Assign unique IDs and dates
    return matches.map((match, index) => ({
        ...match,
        id: `m-${Date.now()}-${index}`,
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

      // Simple ordering for playoffs: 1st vs Last, 2nd vs 2nd-to-last, etc.
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

  const handleGenerateMatches = (config: ChampionshipWizardConfig) => {
    if (!selectedLeague || !selectedChampionship) return;
    
    setLeaguesData(prevLeagues => {
      let updatedLeague: League | undefined;
      let updatedChampionship: Championship | undefined;

      const newLeaguesData = prevLeagues.map(l => {
        if (l.id !== selectedLeague.id) return l;
        
        const newChampionships = l.championships.map(c => {
          if (c.id !== selectedChampionship.id) return c;
          const newMatches = generateMatchesLogic(c.clubs, config);
          const newStandings = calculateStandings(c.clubs, newMatches);
          updatedChampionship = { ...c, matches: newMatches, standings: newStandings };
          return updatedChampionship;
        });

        updatedLeague = { ...l, championships: newChampionships };
        return updatedLeague;
      });
      
      // Atomic state update to prevent stale state.
      if (updatedLeague) setSelectedLeague(updatedLeague);
      if (updatedChampionship) setSelectedChampionship(updatedChampionship);
      
      return newLeaguesData;
    });
    
    setCurrentPage('admin_championship');
  };

  const recalculateAllFinancials = (championship: Championship): Championship => {
      if (!championship.financials) return championship;
      const { registrationFeePerClub = 0, yellowCardFine = 0, redCardFine = 0 } = championship.financials;

      const newClubFinancials = championship.clubs.map(club => {
          let totalFines = 0;
          championship.matches.forEach(match => {
              match.events.forEach(event => {
                  if (club.players.some(p => p.id === event.playerId)) {
                      if (event.type === 'yellow_card') totalFines += yellowCardFine;
                      if (event.type === 'red_card') totalFines += redCardFine;
                  }
              });
          });
          const existingFinancials = championship.clubFinancials?.find(cf => cf.clubId === club.id);
          const amountPaid = existingFinancials?.amountPaid || 0;
          const balance = (registrationFeePerClub + totalFines) - amountPaid;
          return { clubId: club.id, registrationFeeDue: registrationFeePerClub, totalFines, amountPaid, balance };
      });
      return { ...championship, clubFinancials: newClubFinancials };
  };

  const handleUpdateMatch = (updatedMatch: Match) => {
    if (!selectedLeague || !selectedChampionship) return;
    
    const leagueId = selectedLeague.id;
    const championshipId = selectedChampionship.id;

    setLeaguesData(prev => prev.map(l => {
      if (l.id !== leagueId) return l;
      return {
        ...l,
        championships: l.championships.map(c => {
          if (c.id !== championshipId) return c;
          
          const updatedMatches = c.matches.map(m => m.id === updatedMatch.id ? updatedMatch : m);
          
          const updatedClubs = c.clubs.map(club => {
            const newPlayers = club.players.map(p => ({...p, goals: 0}));
            return {...club, players: newPlayers};
          });

          updatedMatches.forEach(match => {
            if (match.status === 'finished') {
              match.events.forEach(event => {
                if (event.type === 'goal') {
                   const clubToUpdate = updatedClubs.find(cl => cl.players.some(p => p.id === event.playerId));
                   if (clubToUpdate) {
                       const player = clubToUpdate.players.find(p => p.id === event.playerId);
                       if (player) player.goals++;
                   }
                }
              });
            }
          });

          const newStandings = calculateStandings(updatedClubs, updatedMatches);
          let updatedChampionship: Championship = { ...c, matches: updatedMatches, standings: newStandings, clubs: updatedClubs };
          updatedChampionship = recalculateAllFinancials(updatedChampionship);

          return updatedChampionship;
        })
      };
    }));
  };
  
  const handleCreateOfficial = (type: 'referees' | 'tableOfficials', data: Omit<Official, 'id'>) => {
    if (!loggedInLeagueAdminId) return;
    const newOfficial: Official = { ...data, id: `${type}-${Date.now()}` };
    setLeaguesData(prev => prev.map(l =>
        l.id === loggedInLeagueAdminId ? { ...l, [type]: [...l[type], newOfficial] } : l
    ));
  };
  const handleUpdateOfficial = (type: 'referees' | 'tableOfficials', data: Official) => {
    if (!loggedInLeagueAdminId) return;
    setLeaguesData(prev => prev.map(l =>
        l.id === loggedInLeagueAdminId ? { ...l, [type]: l[type].map(o => o.id === data.id ? data : o) } : l
    ));
  };
  const handleDeleteOfficial = (type: 'referees' | 'tableOfficials', id: string) => {
    if (!loggedInLeagueAdminId) return;
    setLeaguesData(prev => prev.map(l =>
        l.id === loggedInLeagueAdminId ? { ...l, [type]: l[type].filter(o => o.id !== id) } : l
    ));
  };

  const handleCreatePlayer = (clubId: string, name: string, position: string, nickname: string, cpf: string, photoUrl: string) => {
      if (!selectedLeague || !selectedChampionship) return;
      const newPlayer: Player = {
          id: `player-${Date.now()}`, name, position, nickname, cpf,
          photoUrl: photoUrl || `https://i.pravatar.cc/150?u=${Date.now()}`,
          goals: 0
      };
      setLeaguesData(prev => prev.map(l => l.id === selectedLeague.id ? {
          ...l, championships: l.championships.map(c => c.id === selectedChampionship.id ? {
              ...c, clubs: c.clubs.map(cl => cl.id === clubId ? { ...cl, players: [...cl.players, newPlayer] } : cl)
          } : c)
      } : l));
  };
  const handleUpdatePlayer = (clubId: string, updatedPlayer: Player) => {
      if (!selectedLeague || !selectedChampionship) return;
      setLeaguesData(prev => prev.map(l => l.id === selectedLeague.id ? {
          ...l, championships: l.championships.map(c => c.id === selectedChampionship.id ? {
              ...c, clubs: c.clubs.map(cl => cl.id === clubId ? {
                  ...cl, players: cl.players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p)
              } : cl)
          } : c)
      } : l));
  };
  const handleDeletePlayer = (clubId: string, playerId: string) => {
      if (!selectedLeague || !selectedChampionship) return;
      setLeaguesData(prev => prev.map(l => l.id === selectedLeague.id ? {
          ...l, championships: l.championships.map(c => c.id === selectedChampionship.id ? {
              ...c, clubs: c.clubs.map(cl => cl.id === clubId ? {
                  ...cl, players: cl.players.filter(p => p.id !== playerId)
              } : cl)
          } : c)
      } : l));
  };
  
  const handleCreateStaff = (clubId: string, name: string, role: string) => {
      if (!selectedLeague || !selectedChampionship) return;
      const newStaff: TechnicalStaff = { id: `staff-${Date.now()}`, name, role };
      setLeaguesData(prev => prev.map(l => l.id === selectedLeague.id ? {
          ...l, championships: l.championships.map(c => c.id === selectedChampionship.id ? {
              ...c, clubs: c.clubs.map(cl => cl.id === clubId ? { ...cl, technicalStaff: [...cl.technicalStaff, newStaff] } : cl)
          } : c)
      } : l));
  };
  const handleUpdateStaff = (clubId: string, updatedStaff: TechnicalStaff) => {
      if (!selectedLeague || !selectedChampionship) return;
      setLeaguesData(prev => prev.map(l => l.id === selectedLeague.id ? {
          ...l, championships: l.championships.map(c => c.id === selectedChampionship.id ? {
              ...c, clubs: c.clubs.map(cl => cl.id === clubId ? {
                  ...cl, technicalStaff: cl.technicalStaff.map(s => s.id === updatedStaff.id ? updatedStaff : s)
              } : cl)
          } : c)
      } : l));
  };
  const handleDeleteStaff = (clubId: string, staffId: string) => {
      if (!selectedLeague || !selectedChampionship) return;
      setLeaguesData(prev => prev.map(l => l.id === selectedLeague.id ? {
          ...l, championships: l.championships.map(c => c.id === selectedChampionship.id ? {
              ...c, clubs: c.clubs.map(cl => cl.id === clubId ? {
                  ...cl, technicalStaff: cl.technicalStaff.filter(s => s.id !== staffId)
              } : cl)
          } : c)
      } : l));
  };

  const handleSaveFinancials = (championshipId: string, financials: ChampionshipFinancials) => {
      if (!selectedLeague) return;
      setLeaguesData(prev => prev.map(l => l.id === selectedLeague.id ? {
          ...l, championships: l.championships.map(c => {
              if (c.id === championshipId) {
                  return recalculateAllFinancials({ ...c, financials });
              }
              return c;
          })
      } : l));
  };

  const handleUpdateClubPayment = (clubId: string, amount: number) => {
      if (!selectedLeague || !selectedChampionship) return;
      setLeaguesData(prev => prev.map(l => l.id === selectedLeague.id ? {
          ...l, championships: l.championships.map(c => c.id === selectedChampionship.id ? {
              ...c, clubFinancials: (c.clubFinancials || []).map(cf => cf.clubId === clubId ? {
                  ...cf, amountPaid: amount, balance: (cf.registrationFeeDue + cf.totalFines) - amount
              } : cf)
          } : c)
      } : l));
  };

  // Render Logic
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage leagues={leaguesData} onSelectLeague={handleSelectLeague} />;
      case 'league':
        return selectedLeague && <LeaguePage league={selectedLeague} onSelectChampionship={handleSelectChampionship} onBack={handleBack} isAdminMode={false} onCreateChampionship={handleCreateChampionship} />;
      case 'championship':
        return selectedLeague && selectedChampionship && <ChampionshipPage league={selectedLeague} championship={selectedChampionship} onBack={handleBack} onSelectMatch={handleSelectMatch} isAdminMode={false} onCreateClub={handleCreateClub} onGenerateMatches={handleGenerateMatches} />;
      case 'match':
        return selectedLeague && selectedMatch && <MatchSummaryPage league={selectedLeague} match={selectedMatch} onBack={handleBack} />;
      case 'create_league':
        return <CreateLeaguePage onBack={handleBack} onCreateLeague={handleCreateLeague} isLoading={isCreatingLeague} />;
      // Admin Pages
      case 'admin_league':
        return selectedLeague && <AdminLeaguePage league={selectedLeague} onSelectChampionship={handleSelectChampionship} onCreateChampionship={handleCreateChampionship} onCreateOfficial={handleCreateOfficial} onUpdateOfficial={handleUpdateOfficial} onDeleteOfficial={handleDeleteOfficial} onSaveFinancials={handleSaveFinancials} />;
      case 'admin_championship':
        return selectedLeague && selectedChampionship && <AdminChampionshipPage league={selectedLeague} championship={selectedChampionship} onBack={handleBack} onSelectMatch={handleSelectMatch} onCreateClub={handleCreateClub} onGenerateMatches={handleGenerateMatches} onUpdateMatch={handleUpdateMatch} onUpdateClubPayment={handleUpdateClubPayment} onUpdatePlayer={handleUpdatePlayer} onCreatePlayer={handleCreatePlayer} onDeletePlayer={handleDeletePlayer} onCreateStaff={handleCreateStaff} onUpdateStaff={handleUpdateStaff} onDeleteStaff={handleDeleteStaff} onNavigateToCreateMatches={handleNavigateToCreateMatches} />;
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