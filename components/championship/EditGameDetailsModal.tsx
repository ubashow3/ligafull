import React, { useState, useMemo } from 'react';
import { Match, League, Club } from '../../types';

interface EditGameDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  league: League;
  onSave: (updatedMatch: Match) => void;
  championshipClubs: Club[];
}

const EditGameDetailsModal: React.FC<EditGameDetailsModalProps> = ({ isOpen, onClose, match, league, onSave, championshipClubs }) => {
  const [details, setDetails] = useState(() => {
    let datePart = '';
    let timePart = '00:00';
    
    if (match.date) {
      const parts = match.date.split(/[T ]/);
      datePart = parts[0];
      if (parts[1]) {
        timePart = parts[1].slice(0, 5);
      }
    }

    return {
      location: match.location,
      date: datePart,
      time: timePart,
      refereeId: match.refereeId || '',
      assistant1Id: match.assistant1Id || '',
      assistant2Id: match.assistant2Id || '',
      tableOfficialId: match.tableOfficialId || '',
      homeTeamId: match.homeTeam.id,
      awayTeamId: match.awayTeam.id,
    };
  });

  const isPlayoffMatch = useMemo(() => {
    // A more robust way to check for a placeholder team
    return match.homeTeam.abbreviation === 'TBD' || match.awayTeam.abbreviation === 'TBD';
  }, [match]);
  
  const realClubs = useMemo(() => championshipClubs.filter(c => c.abbreviation !== 'TBD' && c.id !== 'bye'), [championshipClubs]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const homeTeam = championshipClubs.find(c => c.id === details.homeTeamId) || match.homeTeam;
    const awayTeam = championshipClubs.find(c => c.id === details.awayTeamId) || match.awayTeam;

    const updatedMatch: Match = {
      ...match,
      homeTeam,
      awayTeam,
      location: details.location,
      date: `${details.date}T${details.time}:00`,
      refereeId: details.refereeId,
      assistant1Id: details.assistant1Id,
      assistant2Id: details.assistant2Id,
      tableOfficialId: details.tableOfficialId,
      referee: league.referees.find(r => r.id === details.refereeId)?.name || '',
      assistant1: league.referees.find(r => r.id === details.assistant1Id)?.name || '',
      assistant2: league.referees.find(r => r.id === details.assistant2Id)?.name || '',
      tableOfficial: league.tableOfficials.find(r => r.id === details.tableOfficialId)?.name || '',
    };
    onSave(updatedMatch);
  };
  
  const renderRefereeOptions = (currentSelectionId?: string) => {
      const otherRefereeIds = [details.refereeId, details.assistant1Id, details.assistant2Id].filter(id => id && id !== currentSelectionId);
      return league.referees.map(r => (
          <option key={r.id} value={r.id} disabled={otherRefereeIds.includes(r.id)}>{r.name}</option>
      ));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Editar Detalhes do Jogo</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>

        <div className="space-y-4">
            {isPlayoffMatch && (
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="text-md font-semibold text-green-400 mb-2">Definir Times do Mata-Mata</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300">{match.homeTeam.name}</label>
                    <select name="homeTeamId" value={details.homeTeamId} onChange={handleChange} className="mt-1 w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
                        <option value={match.homeTeam.id} disabled>{match.homeTeam.name}</option>
                        {realClubs.map(club => <option key={club.id} value={club.id} disabled={club.id === details.awayTeamId}>{club.name}</option>)}
                    </select>
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-gray-300">{match.awayTeam.name}</label>
                    <select name="awayTeamId" value={details.awayTeamId} onChange={handleChange} className="mt-1 w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
                        <option value={match.awayTeam.id} disabled>{match.awayTeam.name}</option>
                        {realClubs.map(club => <option key={club.id} value={club.id} disabled={club.id === details.homeTeamId}>{club.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}
            <div>
                <label className="block text-sm font-medium text-gray-300">Local</label>
                <input type="text" name="location" value={details.location} onChange={handleChange} className="mt-1 w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"/>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300">Data</label>
                    <input type="date" name="date" value={details.date} onChange={handleChange} className="mt-1 w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Hora</label>
                    <input type="time" name="time" value={details.time} onChange={handleChange} className="mt-1 w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"/>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300">Árbitro</label>
                <select name="refereeId" value={details.refereeId} onChange={handleChange} className="mt-1 w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
                    <option value="">Não definido</option>
                    {renderRefereeOptions(details.refereeId)}
                </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-300">Assistente 1</label>
                    <select name="assistant1Id" value={details.assistant1Id} onChange={handleChange} className="mt-1 w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
                        <option value="">Não definido</option>
                        {renderRefereeOptions(details.assistant1Id)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300">Assistente 2</label>
                    <select name="assistant2Id" value={details.assistant2Id} onChange={handleChange} className="mt-1 w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
                        <option value="">Não definido</option>
                        {renderRefereeOptions(details.assistant2Id)}
                    </select>
                </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-300">Mesário</label>
                <select name="tableOfficialId" value={details.tableOfficialId} onChange={handleChange} className="mt-1 w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
                    <option value="">Não definido</option>
                    {league.tableOfficials.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
            </div>
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <button onClick={onClose} className="text-gray-300 hover:text-white font-bold py-2 px-4 rounded-lg">
            Cancelar
          </button>
          <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center">
            Salvar Detalhes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditGameDetailsModal;