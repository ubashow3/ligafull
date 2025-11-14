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
  const [details, setDetails] = useState({
    location: match.location,
    date: match.date.split('T')[0],
    time: new Date(match.date).toTimeString().slice(0, 5),
    referee: match.referee || '',
    assistant1: match.assistant1 || '',
    assistant2: match.assistant2 || '',
    tableOfficial: match.tableOfficial || '',
    homeTeamId: match.homeTeam.id,
    awayTeamId: match.awayTeam.id,
  });

  const isPlayoffMatch = useMemo(() => match.homeTeam.abbreviation === 'TBD' || match.awayTeam.abbreviation === 'TBD', [match]);
  
  const realClubs = useMemo(() => championshipClubs.filter(c => c.abbreviation !== 'TBD'), [championshipClubs]);

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
      referee: details.referee,
      assistant1: details.assistant1,
      assistant2: details.assistant2,
      tableOfficial: details.tableOfficial,
    };
    onSave(updatedMatch);
  };
  
  const renderRefereeOptions = (currentSelection?: string) => {
      const otherReferees = [details.referee, details.assistant1, details.assistant2].filter(a => a && a !== currentSelection);
      return league.referees.map(r => (
          <option key={r.id} value={r.name} disabled={otherReferees.includes(r.name)}>{r.name}</option>
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
                <select name="referee" value={details.referee} onChange={handleChange} className="mt-1 w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
                    <option value="">Não definido</option>
                    {renderRefereeOptions(details.referee)}
                </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-300">Assistente 1</label>
                    <select name="assistant1" value={details.assistant1} onChange={handleChange} className="mt-1 w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
                        <option value="">Não definido</option>
                        {renderRefereeOptions(details.assistant1)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300">Assistente 2</label>
                    <select name="assistant2" value={details.assistant2} onChange={handleChange} className="mt-1 w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
                        <option value="">Não definido</option>
                        {renderRefereeOptions(details.assistant2)}
                    </select>
                </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-300">Mesário</label>
                <select name="tableOfficial" value={details.tableOfficial} onChange={handleChange} className="mt-1 w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
                    <option value="">Não definido</option>
                    {league.tableOfficials.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
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