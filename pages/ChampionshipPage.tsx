import React, { useState, useMemo } from 'react';
// FIX: Import ChampionshipWizardConfig for correct prop typing.
import { Championship, League, Club, Match, Player, ChampionshipWizardConfig } from '../types';
import StandingsTab from '../components/championship/StandingsTab';
import MatchesTab from '../components/championship/MatchesTab';
import ClubsTab from '../components/championship/ClubsTab';
import TopScorersTab from '../components/championship/TopScorersTab';
import PlayerDetailsModal from '../components/PlayerDetailsModal';

type ActiveTab = 'standings' | 'matches' | 'clubs' | 'top_scorers';

// Moved to top level to prevent re-creation on render
const TabButton: React.FC<{tabName: ActiveTab, label: string, activeTab: ActiveTab, onClick: (tab: ActiveTab) => void}> = ({ tabName, label, activeTab, onClick }) => (
    <button 
      onClick={() => onClick(tabName)}
      className={`px-3 py-2 sm:px-4 text-sm sm:text-base font-medium rounded-t-lg transition-colors duration-300 ${activeTab === tabName ? 'bg-gray-700 text-green-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
    >
      {label}
    </button>
);

interface ChampionshipPageProps {
  championship: Championship;
  league: League;
  onBack: () => void;
  onSelectMatch: (match: Match) => void;
  isAdminMode: boolean;
  onCreateClub: (name: string, abbreviation: string, logoUrl: string, whatsapp: string) => void;
  // FIX: Updated prop to use ChampionshipWizardConfig type for consistency.
  onGenerateMatches: (config: ChampionshipWizardConfig) => void;
}

const ChampionshipPage: React.FC<ChampionshipPageProps> = ({ 
  championship, 
  league,
  onBack, 
  onSelectMatch,
  isAdminMode,
  onCreateClub,
  onGenerateMatches
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('standings');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const topScorers = useMemo(() => {
    const allPlayers = championship.clubs.flatMap(club => 
      club.players.map(player => ({ ...player, clubName: club.name, clubLogoUrl: club.logoUrl }))
    );
    return allPlayers
      .filter(player => player.goals > 0)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 10);
  }, [championship.clubs]);

  return (
    <div className="animate-fade-in">
      <button 
        onClick={onBack}
        className="mb-6 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Voltar
      </button>

      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white">{championship.name}</h1>
        <p className="text-gray-400">{league.name}</p>
      </div>

      <div className="border-b border-gray-600 mb-6">
        <nav className="-mb-px flex space-x-2 sm:space-x-4" aria-label="Tabs">
          <TabButton tabName="standings" label="Classificação" activeTab={activeTab} onClick={setActiveTab} />
          <TabButton tabName="matches" label="Jogos" activeTab={activeTab} onClick={setActiveTab} />
          <TabButton tabName="clubs" label="Clubes" activeTab={activeTab} onClick={setActiveTab} />
          <TabButton tabName="top_scorers" label="Artilharia" activeTab={activeTab} onClick={setActiveTab} />
        </nav>
      </div>

      <div>
        {activeTab === 'standings' && <StandingsTab standings={championship.standings} />}
        {activeTab === 'matches' && (
          <MatchesTab 
            matches={championship.matches} 
            isAdminMode={isAdminMode} 
            onSelectMatch={onSelectMatch}
            // FIX: Removed unused props that were causing potential type issues.
            onGenerateMatches={onGenerateMatches}
            clubs={championship.clubs}
          />
        )}
        {activeTab === 'clubs' && <ClubsTab clubs={championship.clubs} championship={championship} isAdminMode={isAdminMode} onCreateClub={onCreateClub} onPlayerClick={setSelectedPlayer} />}
        {activeTab === 'top_scorers' && <TopScorersTab topScorers={topScorers} />}
      </div>
      
      <PlayerDetailsModal
        isOpen={!!selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
        player={selectedPlayer}
        championship={championship}
      />

    </div>
  );
};

export default ChampionshipPage;