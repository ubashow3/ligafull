import React, { useState } from 'react';
import { Club, Player, Championship, Match } from '../../types';

interface ClubsTabProps {
  clubs: Club[];
  championship: Championship;
  isAdminMode: boolean;
  onCreateClub: (name: string, abbreviation: string, logoUrl: string, whatsapp: string) => void;
  onPlayerClick: (player: Player) => void;
}

const getPlayerSuspensionDetails = (playerId: string, championship: Championship) => {
    const playerEvents = championship.matches
        .flatMap(match => match.events.map(event => ({ ...event, round: match.round, date: match.date })))
        .filter(event => event.playerId === playerId && (event.type === 'yellow_card' || event.type === 'red_card'))
        .sort((a, b) => (a.round as number) - (b.round as number) || new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const cardHistory = playerEvents.map(event => ({
        type: event.type,
        date: event.date,
        round: event.round,
    }));

    if (playerEvents.length === 0) {
        return { isSuspended: false, suspensionRound: null, cardHistory: [] };
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
        return { isSuspended: true, suspensionRound: upcomingSuspensions[0], cardHistory };
    }

    return { isSuspended: false, suspensionRound: null, cardHistory };
};

const ResultDot: React.FC<{result: 'W' | 'D' | 'L'}> = ({ result }) => {
    const style = {
        'W': { color: 'bg-green-500', title: 'Vitória' },
        'D': { color: 'bg-yellow-500', title: 'Empate' },
        'L': { color: 'bg-red-500', title: 'Derrota' }
    };
    return <span className={`block w-4 h-4 rounded-full ${style[result].color}`} title={style[result].title}></span>;
}

const MatchResultDisplay: React.FC<{match: Match}> = ({ match }) => (
    <div className="flex items-center justify-center gap-2 text-sm">
        <img src={match.homeTeam.logoUrl} alt={match.homeTeam.name} className="w-5 h-5 rounded-full object-cover"/>
        <span className="font-semibold">{match.homeTeam.abbreviation}</span>
        <span className="font-bold text-white">{match.homeScore} x {match.awayScore}</span>
        <span className="font-semibold">{match.awayTeam.abbreviation}</span>
        <img src={match.awayTeam.logoUrl} alt={match.awayTeam.name} className="w-5 h-5 rounded-full object-cover"/>
    </div>
);

const NextMatchDisplay: React.FC<{match: Match}> = ({ match }) => (
    <div className="flex flex-col items-center text-sm">
         <div className="flex items-center justify-center gap-2">
            <img src={match.homeTeam.logoUrl} alt={match.homeTeam.name} className="w-5 h-5 rounded-full object-cover"/>
            <span className="font-semibold">{match.homeTeam.abbreviation}</span>
            <span className="font-bold text-white">vs</span>
            <span className="font-semibold">{match.awayTeam.abbreviation}</span>
            <img src={match.awayTeam.logoUrl} alt={match.awayTeam.name} className="w-5 h-5 rounded-full object-cover"/>
        </div>
        <span className="text-xs text-gray-400 mt-1">{new Date(match.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', weekday: 'short' })}</span>
    </div>
);

interface CollapsibleSectionProps {
    title: string;
    children: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, isOpen, onToggle }) => (
    <div className="p-4 bg-gray-900/50 rounded-lg">
        <div className="flex justify-between items-center cursor-pointer" onClick={onToggle}>
            <h4 className="font-bold text-green-400 text-base">{title}</h4>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        </div>
        {isOpen && <div className="mt-3 animate-fade-in">{children}</div>}
    </div>
);


const ClubsTab: React.FC<ClubsTabProps> = ({ clubs, championship, isAdminMode, onCreateClub, onPlayerClick }) => {
  const [expandedClub, setExpandedClub] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState({
      performance: false,
      players: true,
      staff: false,
  });
  const [showAddClubForm, setShowAddClubForm] = useState(false);
  const [newClubName, setNewClubName] = useState('');
  const [newClubAbbr, setNewClubAbbr] = useState('');
  const [newClubLogo, setNewClubLogo] = useState('');
  const [newClubWhatsapp, setNewClubWhatsapp] = useState('');


  const toggleClub = (clubId: string) => {
    const isOpeningNewClub = expandedClub !== clubId;
    setExpandedClub(prevId => (prevId === clubId ? null : clubId));
    if (isOpeningNewClub) {
        setOpenSections({ performance: false, players: true, staff: false }); // Reset on opening a new club
    }
  };

  const toggleSection = (section: keyof typeof openSections) => {
      setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleAddClub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClubName.trim() || !newClubAbbr.trim()) {
      alert("Nome e abreviação do clube são obrigatórios.");
      return;
    }
    onCreateClub(newClubName.trim(), newClubAbbr.trim().toUpperCase(), newClubLogo.trim(), newClubWhatsapp.trim());
    setNewClubName('');
    setNewClubAbbr('');
    setNewClubLogo('');
    setNewClubWhatsapp('');
    setShowAddClubForm(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">CLUBES</h2>
        {isAdminMode && (
          <button 
            onClick={() => setShowAddClubForm(!showAddClubForm)}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Adicionar Clube
          </button>
        )}
      </div>

      {showAddClubForm && isAdminMode && (
        <form onSubmit={handleAddClub} className="bg-gray-700/50 p-4 rounded-lg mb-6 animate-fade-in-down space-y-3">
          <input 
            type="text"
            value={newClubName}
            onChange={(e) => setNewClubName(e.target.value)}
            placeholder="Nome do Clube"
            required
            className="w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white"
          />
          <input 
            type="text"
            value={newClubAbbr}
            onChange={(e) => setNewClubAbbr(e.target.value)}
            placeholder="Abreviação (ex: RMD)"
            maxLength={3}
            required
            className="w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white"
          />
           <input 
            type="text"
            value={newClubLogo}
            onChange={(e) => setNewClubLogo(e.target.value)}
            placeholder="URL do Logo (Opcional)"
            className="w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white"
          />
          <input 
            type="tel"
            value={newClubWhatsapp}
            onChange={(e) => setNewClubWhatsapp(e.target.value)}
            placeholder="WhatsApp (ex: 55119...)"
            className="w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowAddClubForm(false)} className="text-gray-300 hover:text-white font-bold py-1 px-3 rounded-lg">Cancelar</button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-lg">Salvar Clube</button>
          </div>
        </form>
      )}

      {clubs.length === 0 ? (
         <div className="text-center py-10 text-gray-400">Nenhum clube inscrito neste campeonato.</div>
      ) : (
        <div className="space-y-4">
          {clubs.map(club => {
            const standing = championship.standings.find(s => s.clubId === club.id);
            const standingPosition = standing ? championship.standings.indexOf(standing) + 1 : null;

            const finishedMatches = championship.matches
                .filter(m => m.status === 'finished' && (m.homeTeam.id === club.id || m.awayTeam.id === club.id))
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            const lastMatch = finishedMatches[0] || null;

            const scheduledMatches = championship.matches
                .filter(m => m.status === 'scheduled' && (m.homeTeam.id === club.id || m.awayTeam.id === club.id))
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            const nextMatch = scheduledMatches[0] || null;

            const lastFiveResults = finishedMatches.slice(0, 5).map(match => {
                const isHome = match.homeTeam.id === club.id;
                if (match.homeScore === match.awayScore) return 'D';
                if (isHome) {
                    return match.homeScore! > match.awayScore! ? 'W' : 'L';
                } else {
                    return match.awayScore! > match.homeScore! ? 'W' : 'L';
                }
            }).reverse();

            return (
            <div key={club.id} className="bg-gray-700/50 rounded-lg overflow-hidden">
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-700"
                onClick={() => toggleClub(club.id)}
              >
                <div className="flex items-center">
                  <img src={club.logoUrl} alt={club.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover mr-4" />
                  <span className="font-bold text-base sm:text-lg text-white">{club.name} ({club.abbreviation})</span>
                </div>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-6 w-6 text-gray-400 transition-transform ${expandedClub === club.id ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              {expandedClub === club.id && (
                <div className="bg-gray-800 p-4 animate-fade-in-down space-y-4">
                 
                  <CollapsibleSection title="Desempenho no Campeonato" isOpen={openSections.performance} onToggle={() => toggleSection('performance')}>
                    <div className="space-y-4 text-sm text-gray-300">
                        <div>
                            <span className="font-semibold text-gray-400">Posição:</span>
                            <span className="font-bold text-white ml-2">{standingPosition ? `${standingPosition}º lugar` : 'N/A'}</span>
                        </div>
                        
                        <div>
                            <p className="font-semibold text-gray-400 mb-1">Últimos 5 Jogos:</p>
                            <div className="flex gap-1.5">
                                {lastFiveResults.length > 0 
                                    ? lastFiveResults.map((res, i) => <ResultDot key={i} result={res} />)
                                    : <span className="text-xs text-gray-500">Nenhum jogo finalizado.</span>
                                }
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 pt-1">
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-500"></div> V - Vitória</div>
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-yellow-500"></div> E - Empate</div>
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500"></div> D - Derrota</div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <div>
                                <p className="font-semibold text-gray-400 mb-1">Último Resultado:</p>
                                {lastMatch ? <MatchResultDisplay match={lastMatch} /> : <span className="text-xs text-gray-500">N/A</span>}
                            </div>
                            <div>
                                <p className="font-semibold text-gray-400 mb-1">Próximo Jogo:</p>
                                {nextMatch ? <NextMatchDisplay match={nextMatch} /> : <span className="text-xs text-gray-500">N/A</span>}
                            </div>
                        </div>
                    </div>
                  </CollapsibleSection>
                  
                  <CollapsibleSection title="Jogadores" isOpen={openSections.players} onToggle={() => toggleSection('players')}>
                    <ul className="text-sm text-gray-300 divide-y divide-gray-700">
                      {club.players.map(player => {
                        const suspensionDetails = getPlayerSuspensionDetails(player.id, championship);
                        return (
                          <li key={player.id} className="py-2 flex flex-col">
                            <div className="flex items-center cursor-pointer hover:bg-gray-700/50 rounded-md -mx-2 px-2 py-1" onClick={() => onPlayerClick(player)}>
                              <img src={player.photoUrl || `https://i.pravatar.cc/150?u=${player.id}`} alt={player.name} className="w-8 h-8 rounded-full object-cover mr-3" />
                              <div>
                                <div>
                                    <span className="font-medium text-white">{player.nickname || player.name}</span>
                                    <span className="text-gray-400 text-xs ml-2">({player.position})</span>
                                </div>
                                {player.nickname && <p className="text-xs text-gray-400">{player.name}</p>}
                              </div>
                            </div>
                             {suspensionDetails.cardHistory.length > 0 && (
                                <div className="mt-2 pl-12">
                                    {suspensionDetails.isSuspended && (
                                        <span className="text-xs font-bold bg-red-600/50 text-red-300 px-2 py-0.5 rounded-full">
                                            SUSPENSO ({suspensionDetails.suspensionRound}ª Rodada)
                                        </span>
                                    )}
                                    <ul className={`${suspensionDetails.isSuspended ? 'mt-2' : ''} space-y-1 text-xs text-gray-400`}>
                                        {suspensionDetails.cardHistory.map((card, index) => (
                                            <li key={index} className="flex items-center gap-2">
                                            {card.type === 'yellow_card' ? <div className="w-2.5 h-3.5 bg-yellow-400 rounded-sm flex-shrink-0" /> : <div className="w-2.5 h-3.5 bg-red-600 rounded-sm flex-shrink-0" />}
                                            <span>{new Date(card.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                                            <span>({card.round as number}ª Rodada)</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                             )}
                          </li>
                        )
                      })}
                      {club.players.length === 0 && <li className="py-2 text-center text-gray-500">Nenhum jogador cadastrado.</li>}
                    </ul>
                  </CollapsibleSection>

                  <CollapsibleSection title="Comissão Técnica" isOpen={openSections.staff} onToggle={() => toggleSection('staff')}>
                    <ul className="text-sm text-gray-300">
                      {club.technicalStaff.map(staff => (
                        <li key={staff.id}><strong>{staff.role}:</strong> {staff.name}</li>
                      ))}
                      {club.technicalStaff.length === 0 && <li className="py-2 text-center text-gray-500">Nenhum membro da comissão técnica cadastrado.</li>}
                    </ul>
                  </CollapsibleSection>

                </div>
              )}
            </div>
          )})}
        </div>
      )}
    </div>
  );
};

export default ClubsTab;