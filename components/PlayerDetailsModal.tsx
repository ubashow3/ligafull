import React from 'react';
import { Player, Championship } from '../types';

const SoccerBallIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16zM5.045 3.21A6.963 6.963 0 0 0 3.21 5.045L4.5 6.5 6.5 4.5 5.045 3.21zm.332 7.788L4.5 9.5 3.21 10.955a6.963 6.963 0 0 0 1.833 1.833L6.5 11.5l-1.123-1.502zM10.955 12.79a6.963 6.963 0 0 0 1.833-1.833L11.5 9.5l-1.502 1.123 1.957 2.167zm.732-5.002L11.5 6.5 12.79 5.045a6.963 6.963 0 0 0 1.833 1.833L13.5 8.5l-1.813-.712zM8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"/>
    </svg>
);
const YellowCardIcon = () => <div className="w-3.5 h-5 bg-yellow-400 inline-block rounded-sm" />;
const RedCardIcon = () => <div className="w-3.5 h-5 bg-red-600 inline-block rounded-sm" />;
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
);
const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
);


interface PlayerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  championship: Championship | null;
}

const getPlayerSuspensionDetails = (playerId: string, championship: Championship) => {
    const playerEvents = championship.matches
        .flatMap(match => match.events.map(event => ({ ...event, round: match.round })))
        .filter(event => event.playerId === playerId && (event.type === 'yellow_card' || event.type === 'red_card'))
        .sort((a, b) => (a.round as number) - (b.round as number));

    if (playerEvents.length === 0) {
        return { isSuspended: false, suspensionRound: null };
    }

    const rounds = [...new Set(championship.matches.map(m => m.round))].sort((a, b) => a - b);
    let lastCompletedRound = 0;
    for (const roundNum of rounds) {
        const allMatchesInRound = championship.matches.filter(m => m.round === roundNum);
        if (allMatchesInRound.length > 0 && allMatchesInRound.every(m => m.status === 'finished')) {
            lastCompletedRound = roundNum;
        } else {
            break; 
        }
    }

    let yellowCardCount = 0;
    const triggeredSuspensionRounds = new Set<number>();

    for (const event of playerEvents) {
        if (event.type === 'red_card') {
            triggeredSuspensionRounds.add((event.round as number) + 1);
        } else if (event.type === 'yellow_card') {
            yellowCardCount++;
            if (yellowCardCount > 0 && yellowCardCount % 3 === 0) {
                triggeredSuspensionRounds.add((event.round as number) + 1);
            }
        }
    }
    
    const upcomingSuspensions = Array.from(triggeredSuspensionRounds)
                                      .filter(round => round > lastCompletedRound)
                                      .sort((a,b) => a-b);

    if (upcomingSuspensions.length > 0) {
        return { isSuspended: true, suspensionRound: upcomingSuspensions[0] };
    }

    return { isSuspended: false, suspensionRound: null };
};


const PlayerDetailsModal: React.FC<PlayerDetailsModalProps> = ({ isOpen, onClose, player, championship }) => {
    if (!isOpen || !player || !championship) return null;

    const calculateAge = (birthDate?: string) => {
      if (!birthDate) return 'N/A';
      try {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return `${age} anos`;
      } catch {
        return 'N/A';
      }
    };

    const playerInfo = React.useMemo(() => {
        if (!championship) return { yellowCards: 0, redCards: 0, isSuspended: false, suspensionRound: null };
        
        const allEvents = championship.matches.flatMap(m => m.events);
        const yellowCards = allEvents.filter(e => e.playerId === player.id && e.type === 'yellow_card').length;
        const redCards = allEvents.filter(e => e.playerId === player.id && e.type === 'red_card').length;
        const suspensionDetails = getPlayerSuspensionDetails(player.id, championship);

        return { yellowCards, redCards, ...suspensionDetails };
    }, [championship, player.id]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-sm mx-4 relative border border-gray-700" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-white p-1 rounded-full">
                    <CloseIcon/>
                </button>

                <div className="p-6">
                    <div className="flex flex-col items-center text-center">
                        <img src={player.photoUrl || `https://i.pravatar.cc/150?u=${player.id}`} alt={player.name} className="w-24 h-24 rounded-full object-cover border-4 border-gray-600 mb-3"/>
                        <h2 className="text-xl font-bold text-white">{player.nickname || player.name}</h2>
                        {player.nickname && <p className="text-sm text-gray-400 -mt-1">{player.name}</p>}

                         {playerInfo.isSuspended && (
                            <span className="mt-2 text-xs font-bold bg-red-600/50 text-red-300 px-3 py-1 rounded-full">
                                SUSPENSO ({playerInfo.suspensionRound}ª RODADA)
                            </span>
                         )}
                    </div>

                    <div className="mt-6 border-t border-gray-700 pt-4 grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-300">
                            <UserIcon/>
                            <span>{player.position}</span>
                        </div>
                         <div className="flex items-center gap-2 text-gray-300">
                            <CalendarIcon/>
                            <span>{calculateAge(player.birthDate)}</span>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                        <div className="bg-gray-700/50 p-3 rounded-lg">
                            <p className="text-xs text-gray-400">Gols</p>
                            <div className="flex items-center justify-center gap-2 mt-1">
                                <SoccerBallIcon />
                                <p className="text-xl font-bold text-white">{player.goals}</p>
                            </div>
                        </div>
                        <div className="bg-gray-700/50 p-3 rounded-lg">
                            <p className="text-xs text-gray-400">Amarelos</p>
                             <div className="flex items-center justify-center gap-2 mt-1">
                                <YellowCardIcon />
                                <p className="text-xl font-bold text-white">{playerInfo.yellowCards}</p>
                            </div>
                        </div>
                        <div className="bg-gray-700/50 p-3 rounded-lg">
                           <p className="text-xs text-gray-400">Vermelhos</p>
                             <div className="flex items-center justify-center gap-2 mt-1">
                                <RedCardIcon />
                                <p className="text-xl font-bold text-white">{playerInfo.redCards}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerDetailsModal;