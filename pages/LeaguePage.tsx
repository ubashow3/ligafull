import React, { useState, useEffect } from 'react';
import { League, Championship } from '../types';

interface LeaguePageProps {
  league: League;
  onSelectChampionship: (championship: Championship) => void;
  onBack: () => void;
  isAdminMode: boolean;
  onCreateChampionship: (leagueId: string, champName: string) => void;
}

const LeaguePage: React.FC<LeaguePageProps> = ({ league, onSelectChampionship, onBack, isAdminMode, onCreateChampionship }) => {
  const [showAddChampForm, setShowAddChampForm] = useState(false);
  const [newChampName, setNewChampName] = useState('');

  useEffect(() => {
    if (isAdminMode) return;

    const favoriteLeagueId = localStorage.getItem('favoriteLeagueId');
    if (favoriteLeagueId === league.id) {
        return; // It's already the favorite, do nothing.
    }

    const message = favoriteLeagueId
        ? `Deseja trocar sua liga preferida por "${league.name}"?`
        : `Deseja definir "${league.name}" como sua liga preferida? Ela aparecerá no topo da lista na página inicial.`;

    // Use a timeout to prevent the confirm dialog from blocking the initial page render
    setTimeout(() => {
        if (window.confirm(message)) {
            localStorage.setItem('favoriteLeagueId', league.id);
            alert(`"${league.name}" foi definida como sua liga preferida!`);
        }
    }, 500);
  }, [league.id, league.name, isAdminMode]);


  const handleAddChampionship = (e: React.FormEvent) => {
    e.preventDefault();
    if (newChampName.trim() === '') return;
    onCreateChampionship(league.id, newChampName.trim());
    setNewChampName('');
    setShowAddChampForm(false);
  };
  
  return (
    <div className="animate-fade-in">
      {!isAdminMode && (
        <button 
          onClick={onBack}
          className="mb-6 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Voltar
        </button>
      )}

      <div className="flex items-center mb-8">
        <img src={league.logoUrl} alt={`${league.name} logo`} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover mr-4 sm:mr-6 border-4 border-gray-700"/>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">{league.name}</h1>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-green-400">Campeonatos</h2>
        {isAdminMode && (
          <button 
            onClick={() => setShowAddChampForm(!showAddChampForm)}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center transition-colors"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Adicionar Campeonato
          </button>
        )}
      </div>
      
      {showAddChampForm && isAdminMode && (
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
            <h3 className="text-xl font-bold text-white">{champ.name}</h3>
            <p className="text-gray-400 mt-1">{champ.clubs.length} clubes participantes</p>
          </div>
        ))}
         {league.championships.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            Nenhum campeonato criado nesta liga.
            {isAdminMode && " Use o botão 'Adicionar Campeonato' para começar."}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaguePage;