import React, { useState, useEffect } from 'react';
import { Match, League, Player, MatchEvent, Championship } from '../../types';

interface AdminMatchSummaryPageProps {
  match: Match;
  league: League;
  championship: Championship;
  onBack: () => void;
  onUpdateMatch: (updatedMatch: Match) => void;
}

const AdminMatchSummaryPage: React.FC<AdminMatchSummaryPageProps> = ({ match, league, championship, onBack, onUpdateMatch }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'away'>('home');
  const [editableMatch, setEditableMatch] = useState<Match>(match);

  useEffect(() => {
    setEditableMatch(match);
  }, [match]);

  const homeTeam = championship.clubs.find(c => c.id === match.homeTeam.id) || match.homeTeam;
  const awayTeam = championship.clubs.find(c => c.id === match.awayTeam.id) || match.awayTeam;

  const handleStatChange = (playerId: string, stat: 'goals' | 'yellows' | 'reds', value: string) => {
    const numValue = Math.max(0, parseInt(value, 10) || 0);
    const player = [...homeTeam.players, ...awayTeam.players].find(p => p.id === playerId);
    if (!player) return;

    let eventType: MatchEvent['type'];
    if (stat === 'goals') eventType = 'goal';
    else if (stat === 'yellows') eventType = 'yellow_card';
    else eventType = 'red_card';

    const otherEvents = editableMatch.events.filter(e => !(e.playerId === playerId && e.type === eventType));
    const newEventsForStat: MatchEvent[] = Array(numValue).fill(null).map(() => ({
        type: eventType,
        playerId,
        playerName: player.name,
        minute: 0
    }));
    
    const updatedEvents = [...otherEvents, ...newEventsForStat];
    const homeScore = updatedEvents.filter(e => e.type === 'goal' && homeTeam.players.some(p => p.id === e.playerId)).length;
    const awayScore = updatedEvents.filter(e => e.type === 'goal' && awayTeam.players.some(p => p.id === e.playerId)).length;

    setEditableMatch(prev => ({
        ...prev,
        events: updatedEvents,
        homeScore,
        awayScore,
        status: prev.status === 'scheduled' ? 'in_progress' : prev.status
    }));
  };
  
  const handleSaveChanges = (isFinalizing: boolean = false) => {
    const matchToSave = {
        ...editableMatch,
        status: isFinalizing ? 'finished' : editableMatch.status,
    };
    onUpdateMatch(matchToSave);
    setEditableMatch(matchToSave); // Also update local state to reflect status change
    alert(`Alterações ${isFinalizing ? 'finalizadas' : 'salvas'} com sucesso!`);
  };
  
  const getPlayerStats = (playerId: string) => {
    const stats = { goals: 0, yellows: 0, reds: 0 };
    editableMatch.events.forEach(event => {
        if (event.playerId === playerId) {
            if (event.type === 'goal') stats.goals++;
            if (event.type === 'yellow_card') stats.yellows++;
            if (event.type === 'red_card') stats.reds++;
        }
    });
    return stats;
  };

  const formatMatchDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const dayOfWeek = date.toLocaleDateString('pt-BR', { weekday: 'long' });
    const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${day} • ${dayOfWeek.split('-')[0]} • ${time}`;
  };

  const renderEditablePlayerList = (players: Player[]) => (
    <div className="w-full animate-fade-in">
        <ul className="divide-y divide-gray-700 bg-gray-900/50 rounded-md">
            <li className="p-3 grid grid-cols-4 gap-2 text-xs font-bold text-gray-400">
                <span className="col-span-1">Jogador</span>
                <span className="text-center">Gols</span>
                <span className="text-center">CA</span>
                <span className="text-center">CV</span>
            </li>
            {players.map(player => {
              const stats = getPlayerStats(player.id);
              return (
                <li key={player.id} className="p-3 grid grid-cols-4 gap-2 items-center">
                    <div className="col-span-1">
                       <p className="text-sm sm:text-base font-medium text-white truncate">{player.nickname || player.name}</p>
                       <p className="text-xs text-gray-400">{player.position}</p> 
                    </div>
                    <input 
                        type="number" 
                        min="0"
                        value={stats.goals}
                        onChange={(e) => handleStatChange(player.id, 'goals', e.target.value)}
                        className="bg-gray-700 text-white text-center rounded w-12 sm:w-16 mx-auto p-1 disabled:opacity-50"
                        disabled={editableMatch.status === 'finished'}
                    />
                     <input 
                        type="number" 
                        min="0"
                        value={stats.yellows}
                        onChange={(e) => handleStatChange(player.id, 'yellows', e.target.value)}
                        className="bg-gray-700 text-white text-center rounded w-12 sm:w-16 mx-auto p-1 disabled:opacity-50"
                        disabled={editableMatch.status === 'finished'}
                    />
                     <input 
                        type="number" 
                        min="0"
                        value={stats.reds}
                        onChange={(e) => handleStatChange(player.id, 'reds', e.target.value)}
                        className="bg-gray-700 text-white text-center rounded w-12 sm:w-16 mx-auto p-1 disabled:opacity-50"
                        disabled={editableMatch.status === 'finished'}
                    />
                </li>
            )})}
             {players.length === 0 && <li className="py-4 text-center text-gray-500 col-span-4">Nenhum jogador cadastrado neste time.</li>}
        </ul>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-2">
        <button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
          Voltar
        </button>
        {editableMatch.status !== 'finished' && (
            <div className="flex gap-2">
                <button onClick={() => handleSaveChanges(false)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Salvar Rascunho</button>
                <button onClick={() => handleSaveChanges(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Finalizar Jogo</button>
            </div>
        )}
      </div>
      
      <div className="bg-gray-800 rounded-lg p-4 sm:p-6 shadow-lg">
          <div className="text-center mb-4">
              <h3 className="text-xl sm:text-2xl font-bold text-white">Súmula do Jogo</h3>
              {editableMatch.status === 'finished' && <span className="text-xs bg-red-500/50 text-red-300 px-2 py-1 rounded-full">Súmula Fechada</span>}
          </div>

           <div className="flex items-center justify-center space-x-2 sm:space-x-4 my-6">
              <span className="font-bold text-base sm:text-lg text-white text-right w-2/5 truncate">{homeTeam.name}</span>
              <div className="font-bold text-xl sm:text-2xl text-white">{editableMatch.homeScore ?? '-'} x {editableMatch.awayScore ?? '-'}</div>
              <span className="font-bold text-base sm:text-lg text-white text-left w-2/5 truncate">{awayTeam.name}</span>
          </div>

          <div className="border-t border-b border-gray-700 py-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs sm:text-sm text-gray-300">
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <strong className="text-gray-400 mr-2">Local:</strong>
                    <span className="text-right">{editableMatch.location}</span>
                </div>
                <div className="flex justify-between items-center">
                    <strong className="text-gray-400 mr-2">Data/Hora:</strong>
                    <span className="text-right">{formatMatchDate(editableMatch.date)}</span>
                </div>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <strong className="text-gray-400 mr-2">Árbitro:</strong>
                    <span className="text-right">{editableMatch.referee || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                    <strong className="text-gray-400 mr-2">Assistentes:</strong>
                    <span className="text-right">{[editableMatch.assistant1, editableMatch.assistant2].filter(Boolean).join(', ') || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                    <strong className="text-gray-400 mr-2">Mesário:</strong>
                    <span className="text-right">{editableMatch.tableOfficial || 'N/A'}</span>
                </div>
            </div>
          </div>
      
          <div className="mt-6">
            <div className="border-b-2 border-gray-700 flex">
                <button onClick={() => setActiveTab('home')} className={`w-1/2 py-3 text-sm sm:text-base font-medium transition-colors ${activeTab === 'home' ? 'border-b-2 border-green-500 text-white' : 'text-gray-400'}`}>{homeTeam.name}</button>
                <button onClick={() => setActiveTab('away')} className={`w-1/2 py-3 text-sm sm:text-base font-medium transition-colors ${activeTab === 'away' ? 'border-b-2 border-green-500 text-white' : 'text-gray-400'}`}>{awayTeam.name}</button>
            </div>
            
            <div className="mt-4">
              {activeTab === 'home' && renderEditablePlayerList(homeTeam.players)}
              {activeTab === 'away' && renderEditablePlayerList(awayTeam.players)}
            </div>
          </div>

      </div>
    </div>
  );
};

export default AdminMatchSummaryPage;