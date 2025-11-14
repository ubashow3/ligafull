import React, { useState } from 'react';
import { League, Championship, Official } from '../../types';
import ManageOfficialsTab from '../../components/admin/league/ManageOfficialsTab';

interface AdminLeaguePageProps {
  league: League;
  onSelectChampionship: (championship: Championship) => void;
  onCreateChampionship: (leagueId: string, champName: string) => void;
  onCreateOfficial: (type: 'referees' | 'tableOfficials', data: Omit<Official, 'id'>) => void;
  onUpdateOfficial: (type: 'referees' | 'tableOfficials', data: Official) => void;
  onDeleteOfficial: (type: 'referees' | 'tableOfficials', id: string) => void;
}

type ActiveTab = 'championships' | 'referees' | 'tableOfficials';

// Moved to top level to prevent re-creation on render
const TabButton: React.FC<{tabName: ActiveTab, label: string, activeTab: ActiveTab, onClick: (tab: ActiveTab) => void}> = ({ tabName, label, activeTab, onClick }) => (
    <button 
      onClick={() => onClick(tabName)}
      className={`px-3 py-2 sm:px-4 text-sm sm:text-base font-medium rounded-t-lg transition-colors duration-300 ${activeTab === tabName ? 'bg-gray-700 text-green-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
    >
      {label}
    </button>
);

const AdminLeaguePage: React.FC<AdminLeaguePageProps> = ({ 
    league, 
    onSelectChampionship, 
    onCreateChampionship,
    onCreateOfficial,
    onUpdateOfficial,
    onDeleteOfficial
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('championships');
  const [showAddChampForm, setShowAddChampForm] = useState(false);
  const [newChampName, setNewChampName] = useState('');

  const handleAddChampionship = (e: React.FormEvent) => {
    e.preventDefault();
    if (newChampName.trim() === '') return;
    onCreateChampionship(league.id, newChampName.trim());
    setNewChampName('');
    setShowAddChampForm(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center mb-8">
        <img src={league.logoUrl} alt={`${league.name} logo`} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover mr-4 sm:mr-6 border-4 border-gray-700"/>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">{league.name}</h1>
          <p className="text-gray-400">Painel do Administrador</p>
        </div>
      </div>
      
      <div className="border-b border-gray-600 mb-6">
        <nav className="-mb-px flex space-x-2 sm:space-x-4" aria-label="Tabs">
          <TabButton tabName="championships" label="Campeonatos" activeTab={activeTab} onClick={setActiveTab} />
          <TabButton tabName="referees" label="Árbitros" activeTab={activeTab} onClick={setActiveTab} />
          <TabButton tabName="tableOfficials" label="Mesários" activeTab={activeTab} onClick={setActiveTab} />
        </nav>
      </div>
      
      <div className="mt-6">
        {activeTab === 'championships' && (
            <div>
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-green-400">Campeonatos</h2>
                    <button
                    onClick={() => setShowAddChampForm(!showAddChampForm)}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center transition-colors text-sm sm:text-base"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    <span>Campeonato</span>
                    </button>
                </div>
                
                {showAddChampForm && (
                    <form onSubmit={handleAddChampionship} className="bg-gray-700/50 p-4 rounded-lg mb-4 animate-fade-in-down">
                    <input 
                        type="text"
                        value={newChampName}
                        onChange={(e) => setNewChampName(e.target.value)}
                        placeholder="Nome do novo campeonato"
                        className="w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white"
                    />
                    <div className="flex justify-end mt-2">
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-lg">Salvar</button>
                    </div>
                    </form>
                )}

                <div className="space-y-4">
                    {league.championships.map(champ => (
                    <div 
                        key={champ.id} 
                        className="bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 cursor-pointer transition-transform duration-300 hover:scale-105 hover:bg-gray-700"
                        onClick={() => onSelectChampionship(champ)}
                    >
                        <h3 className="text-lg sm:text-xl font-bold text-white">{champ.name}</h3>
                        <p className="text-gray-400 mt-1">{champ.clubs.length} clubes participantes</p>
                    </div>
                    ))}
                    {league.championships.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        Nenhum campeonato criado nesta liga. Use o botão 'Adicionar Campeonato' para começar.
                    </div>
                    )}
                </div>
            </div>
        )}
        {activeTab === 'referees' && (
            <ManageOfficialsTab 
                title="Árbitros"
                officials={league.referees}
                onCreate={(data) => onCreateOfficial('referees', data)}
                onUpdate={(data) => onUpdateOfficial('referees', data)}
                onDelete={(id) => onDeleteOfficial('referees', id)}
            />
        )}
        {activeTab === 'tableOfficials' && (
             <ManageOfficialsTab 
                title="Mesários"
                officials={league.tableOfficials}
                onCreate={(data) => onCreateOfficial('tableOfficials', data)}
                onUpdate={(data) => onUpdateOfficial('tableOfficials', data)}
                onDelete={(id) => onDeleteOfficial('tableOfficials', id)}
            />
        )}
      </div>
    </div>
  );
};

export default AdminLeaguePage;