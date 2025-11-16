import React, { useState, useMemo } from 'react';
import { Championship, League, Match, Player, TechnicalStaff, ChampionshipWizardConfig, ChampionshipFinancials } from '../../types';
import AdminStandingsTab from '../../components/admin/championship/AdminStandingsTab';
import AdminMatchesTab from '../../components/admin/championship/AdminMatchesTab';
import AdminClubsTab from '../../components/admin/championship/AdminClubsTab';
import AdminTopScorersTab from '../../components/admin/championship/AdminTopScorersTab';
import AdminFinancialsTab from '../../components/admin/championship/AdminFinancialsTab';
import PlayerDetailsModal from '../../components/PlayerDetailsModal';

type ActiveTab = 'matches' | 'clubs' | 'standings' | 'top_scorers' | 'financials';

// Moved to top level to prevent re-creation on render
const TabButton: React.FC<{ tabName: ActiveTab, label: string, activeTab: ActiveTab, onClick: (tab: ActiveTab) => void }> = ({ tabName, label, activeTab, onClick }) => (
    <button
      onClick={() => onClick(tabName)}
      className={`px-3 py-2 sm:px-4 text-sm sm:text-base font-medium rounded-t-lg transition-colors duration-300 ${activeTab === tabName ? 'bg-gray-700 text-green-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
    >
      {label}
    </button>
);

interface AdminChampionshipPageProps {
  championship: Championship;
  league: League;
  onBack: () => void;
  onSelectMatch: (match: Match) => void;
  onCreateClub: (name: string, abbreviation: string, logoUrl: string, whatsapp: string) => void;
  onGenerateMatches: (config: ChampionshipWizardConfig) => void;
  onUpdateMatch: (updatedMatch: Match) => void;
  onNavigateToCreateMatches: () => void;
  onSaveFinancials: (championshipId: string, financials: ChampionshipFinancials) => void;
  onUpdateClubRegistrationStatus: (championshipId: string, clubId: string, isPaid: boolean) => void;
  onUpdateClubFinePaymentStatus: (championshipId: string, clubId: string, round: number, isPaid: boolean) => void;
  // Player props
  onUpdatePlayer: (clubId: string, updatedPlayer: Player) => void;
  onCreatePlayer: (clubId: string, name: string, position: string, nickname: string, cpf: string, photoUrl: string) => void;
  onDeletePlayer: (clubId: string, playerId: string) => void;
  // Staff props
  onCreateStaff: (clubId: string, name: string, role: string) => void;
  onUpdateStaff: (clubId: string, updatedStaff: TechnicalStaff) => void;
  onDeleteStaff: (clubId: string, staffId: string) => void;
}

const AdminChampionshipPage: React.FC<AdminChampionshipPageProps> = ({
  championship,
  league,
  onBack,
  onSelectMatch,
  onCreateClub,
  onGenerateMatches,
  onUpdateMatch,
  onNavigateToCreateMatches,
  onSaveFinancials,
  onUpdateClubRegistrationStatus,
  onUpdateClubFinePaymentStatus,
  onUpdatePlayer,
  onCreatePlayer,
  onDeletePlayer,
  onCreateStaff,
  onUpdateStaff,
  onDeleteStaff,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('clubs');
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
          <TabButton tabName="matches" label="Jogos" activeTab={activeTab} onClick={setActiveTab} />
          <TabButton tabName="clubs" label="Clubes" activeTab={activeTab} onClick={setActiveTab} />
          <TabButton tabName="standings" label="Classificação" activeTab={activeTab} onClick={setActiveTab} />
          <TabButton tabName="top_scorers" label="Artilharia" activeTab={activeTab} onClick={setActiveTab} />
          <TabButton tabName="financials" label="Financeiro" activeTab={activeTab} onClick={setActiveTab} />
        </nav>
      </div>

      <div>
        {activeTab === 'matches' && (
          <AdminMatchesTab
            matches={championship.matches}
            onSelectMatch={onSelectMatch}
            league={league}
            championshipId={championship.id}
            onGenerateMatches={onGenerateMatches}
            onUpdateMatch={onUpdateMatch}
            clubs={championship.clubs}
            onNavigateToCreateMatches={onNavigateToCreateMatches}
          />
        )}
        {activeTab === 'clubs' && (
            <AdminClubsTab 
                clubs={championship.clubs}
                championship={championship}
                leagueSlug={league.slug}
                championshipId={championship.id}
                onCreateClub={onCreateClub}
                onUpdatePlayer={onUpdatePlayer}
                onCreatePlayer={onCreatePlayer}
                onDeletePlayer={onDeletePlayer}
                onCreateStaff={onCreateStaff}
                onUpdateStaff={onUpdateStaff}
                onDeleteStaff={onDeleteStaff}
                onPlayerClick={setSelectedPlayer}
                onUpdateClubRegistrationStatus={onUpdateClubRegistrationStatus}
                onUpdateClubFinePaymentStatus={onUpdateClubFinePaymentStatus}
            />
        )}
        {activeTab === 'standings' && <AdminStandingsTab standings={championship.standings} />}
        {activeTab === 'top_scorers' && <AdminTopScorersTab topScorers={topScorers} />}
        {activeTab === 'financials' && (
            <AdminFinancialsTab 
                championship={championship}
                onSave={(financials) => onSaveFinancials(championship.id, financials)}
            />
        )}
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

export default AdminChampionshipPage;