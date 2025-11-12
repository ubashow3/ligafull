import React from 'react';
import { Match, League, Player } from '../types';

const SoccerBallIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16zM5.045 3.21A6.963 6.963 0 0 0 3.21 5.045L4.5 6.5 6.5 4.5 5.045 3.21zm.332 7.788L4.5 9.5 3.21 10.955a6.963 6.963 0 0 0 1.833 1.833L6.5 11.5l-1.123-1.502zM10.955 12.79a6.963 6.963 0 0 0 1.833-1.833L11.5 9.5l-1.502 1.123 1.957 2.167zm.732-5.002L11.5 6.5 12.79 5.045a6.963 6.963 0 0 0 1.833 1.833L13.5 8.5l-1.813-.712zM8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"/>
    </svg>
);
const YellowCardIcon = () => <div className="w-3 h-4 bg-yellow-400 inline-block rounded-sm" />;
const RedCardIcon = () => <div className="w-3 h-4 bg-red-600 inline-block rounded-sm" />;

interface MatchSummaryPageProps {
  match: Match;
  league: League;
  onBack: () => void;
}

const StatusBadge: React.FC<{ status: 'scheduled' | 'in_progress' | 'finished' }> = ({ status }) => {
    const statusInfo = {
        scheduled: { text: 'Agendado', color: 'bg-blue-500/20 text-blue-300' },
        in_progress: { text: 'Em Andamento', color: 'bg-yellow-500/20 text-yellow-300' },
        finished: { text: 'Finalizado', color: 'bg-green-500/20 text-green-300' },
    };

    const info = statusInfo[status];

    return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${info.color}`}>
            {info.text}
        </span>
    );
};

const MatchSummaryPage: React.FC<MatchSummaryPageProps> = ({ match, league, onBack }) => {
  const [activeTab, setActiveTab] = React.useState<'home' | 'away'>('home');

  const formatMatchDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const dayOfWeek = date.toLocaleDateString('pt-BR', { weekday: 'long' });
    const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${day} • ${dayOfWeek.split('-')[0]} • ${time}`;
  };

  const renderPlayerList = (players: Player[]) => (
    <div className="w-full animate-fade-in">
        <ul className="divide-y divide-gray-700 bg-gray-900/50 rounded-md">
            {players.map(player => (
                <li key={player.id} className="p-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                       <img src={player.photoUrl || `https://i.pravatar.cc/150?u=${player.id}`} alt={player.name} className="w-10 h-10 rounded-full object-cover"/>
                       <div>
                         <p className="text-sm sm:text-base font-medium text-white">{player.nickname || player.name}</p>
                         <p className="text-xs text-gray-400">{player.position}</p> 
                       </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {match.events.filter(e => e.playerId === player.id).map((event, index) => (
                            <span key={`${event.playerId}-${index}`} className="flex items-center space-x-1 text-xs text-gray-300">
                                {event.type === 'goal' && <SoccerBallIcon />}
                                {event.type === 'yellow_card' && <YellowCardIcon />}
                                {event.type === 'red_card' && <RedCardIcon />}
                            </span>
                        ))}
                    </div>
                </li>
            ))}
             {players.length === 0 && <li className="py-4 text-center text-gray-500">Nenhum jogador cadastrado neste time.</li>}
        </ul>
    </div>
  );

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

      <div className="bg-gray-800 rounded-lg p-4 sm:p-6 shadow-lg">
          <div className="flex items-center justify-center space-x-2 sm:space-x-4 mb-6">
              <div className="flex flex-col items-center text-center w-2/5">
                <img src={match.homeTeam.logoUrl} alt={match.homeTeam.name} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full mb-2 object-cover" />
                <span className="font-bold text-base sm:text-lg text-white">{match.homeTeam.name}</span>
              </div>
              <div className="text-xl sm:text-3xl font-bold text-white text-center">
                {match.status === 'finished' ? `${match.homeScore} x ${match.awayScore}` : 'x'}
              </div>
              <div className="flex flex-col items-center text-center w-2/5">
                <img src={match.awayTeam.logoUrl} alt={match.awayTeam.name} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full mb-2 object-cover" />
                <span className="font-bold text-base sm:text-lg text-white">{match.awayTeam.name}</span>
              </div>
          </div>
          
          <div className="border-t border-b border-gray-700 py-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs sm:text-sm text-gray-300">
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <strong className="text-gray-400 mr-2">Local:</strong>
                    <span className="text-right">{match.location}</span>
                </div>
                <div className="flex justify-between items-center">
                    <strong className="text-gray-400 mr-2">Data/Hora:</strong>
                    <span className="text-right">{formatMatchDate(match.date)}</span>
                </div>
                 <div className="flex justify-between items-center">
                    <strong className="text-gray-400 mr-2">Status:</strong>
                    <StatusBadge status={match.status} />
                </div>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <strong className="text-gray-400 mr-2">Árbitro:</strong>
                    <span className="text-right">{match.referee || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                    <strong className="text-gray-400 mr-2">Assistentes:</strong>
                    <span className="text-right">{[match.assistant1, match.assistant2].filter(Boolean).join(', ') || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                    <strong className="text-gray-400 mr-2">Mesário:</strong>
                    <span className="text-right">{match.tableOfficial || 'N/A'}</span>
                </div>
            </div>
          </div>
      
          <div className="mt-6">
            <div className="border-b-2 border-gray-700 flex">
                <button onClick={() => setActiveTab('home')} className={`w-1/2 py-3 text-sm sm:text-base font-medium transition-colors ${activeTab === 'home' ? 'border-b-2 border-green-500 text-white' : 'text-gray-400'}`}>{match.homeTeam.name}</button>
                <button onClick={() => setActiveTab('away')} className={`w-1/2 py-3 text-sm sm:text-base font-medium transition-colors ${activeTab === 'away' ? 'border-b-2 border-green-500 text-white' : 'text-gray-400'}`}>{match.awayTeam.name}</button>
            </div>
            
            <div className="mt-4">
              {activeTab === 'home' && renderPlayerList(match.homeTeam.players)}
              {activeTab === 'away' && renderPlayerList(match.awayTeam.players)}
            </div>
          </div>
      </div>
    </div>
  );
};

export default MatchSummaryPage;