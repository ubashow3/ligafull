
import React, { useState, useMemo } from 'react';
import { Championship, League, Club, Match, Player, ChampionshipWizardConfig, UserProfile } from '../types';
import StandingsTab from '../components/championship/StandingsTab';
import MatchesTab from '../components/championship/MatchesTab';
import ClubsTab from '../components/championship/ClubsTab';
import TopScorersTab from '../components/championship/TopScorersTab';
import PlayerDetailsModal from '../components/PlayerDetailsModal';

type ActiveTab = 'standings' | 'matches' | 'clubs' | 'top_scorers';

const TabButton: React.FC<{tabName: ActiveTab, label: string, activeTab: ActiveTab, onClick: (tab: ActiveTab) => void}> = ({ tabName, label, activeTab, onClick }) => (
    <button 
      onClick={() => onClick(tabName)}
      className={`px-3 py-2 sm:px-4 text-sm sm:text-base font-medium rounded-t-lg transition-colors duration-300 ${activeTab === tabName ? 'bg-gray-700 text-green-400 border-b-2 border-green-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
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
  user: UserProfile | null;
  onCreateClub: (name: string, abbreviation: string, logoUrl: string, whatsapp: string) => void;
  onGenerateMatches: (config: ChampionshipWizardConfig) => void;
}

const ChampionshipPage: React.FC<ChampionshipPageProps> = ({ 
  championship, 
  league,
  onBack, 
  onSelectMatch,
  isAdminMode,
  user,
  onCreateClub,
  onGenerateMatches
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('standings');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      <button 
        onClick={onBack}
        className="mb-6 bg-gray-800/50 hover:bg-gray-700 text-gray-400 font-bold py-2 px-4 rounded-xl inline-flex items-center transition-all border border-white/5"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Voltar para a Liga
      </button>

      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic">{championship.name}</h1>
        <p className="text-green-500 font-bold tracking-[0.3em] uppercase text-xs mt-1">{league.name}</p>
      </div>

      <div className="border-b border-gray-600 mb-6 overflow-x-auto no-scrollbar">
        <nav className="-mb-px flex space-x-1 sm:space-x-4 min-w-max" aria-label="Tabs">
          <TabButton tabName="standings" label="Classificação" activeTab={activeTab} onClick={setActiveTab} />
          <TabButton tabName="matches" label="Jogos" activeTab={activeTab} onClick={setActiveTab} />
          <TabButton tabName="clubs" label="Clubes" activeTab={activeTab} onClick={setActiveTab} />
          <TabButton tabName="top_scorers" label="Artilharia" activeTab={activeTab} onClick={setActiveTab} />
        </nav>
      </div>

      <div className="animate-fade-in-up">
        {activeTab === 'standings' && <StandingsTab standings={championship.standings} />}
        {activeTab === 'matches' && (
          <MatchesTab 
            matches={championship.matches} 
            isAdminMode={isAdminMode} 
            onSelectMatch={onSelectMatch}
            clubs={championship.clubs}
            onGenerateMatches={onGenerateMatches}
          />
        )}
        {activeTab === 'clubs' && <ClubsTab clubs={championship.clubs} championship={championship} isAdminMode={isAdminMode} onPlayerClick={setSelectedPlayer} onCreateClub={onCreateClub} />}
        {activeTab === 'top_scorers' && <TopScorersTab topScorers={championship.topScorers} />}
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
