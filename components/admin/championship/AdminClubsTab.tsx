import React, { useState } from 'react';
import { Club, Player, TechnicalStaff, Championship, Match } from '../../../types';

const maskCPF = (value: string) => {
  if (!value) return "";
  value = value.replace(/\D/g, '');
  value = value.replace(/(\d{3})(\d)/, '$1.$2');
  value = value.replace(/(\d{3})(\d)/, '$1.$2');
  value = value.replace(/(\d{3})(\d{2})$/, '$1-$2');
  return value.slice(0, 14);
};

const maskPhone = (value: string) => {
  if (!value) return "";
  value = value.replace(/\D/g, '');
  value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
  value = value.replace(/(\d{5})(\d)/, '$1-$2');
  return value.slice(0, 15); // (XX) XXXXX-XXXX
};

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

interface AdminClubsTabProps {
  clubs: Club[];
  championship: Championship;
  leagueSlug: string;
  championshipId: string;
  onCreateClub: (name: string, abbreviation: string, logoUrl: string, whatsapp: string) => void;
  onPlayerClick: (player: Player) => void;
  // Player Props
  onUpdatePlayer: (clubId: string, updatedPlayer: Player) => void;
  onCreatePlayer: (clubId: string, name: string, position: string, nickname: string, cpf: string, photoUrl: string) => void;
  onDeletePlayer: (clubId: string, playerId: string) => void;
  // Staff Props
  onCreateStaff: (clubId: string, name: string, role: string) => void;
  onUpdateStaff: (clubId: string, updatedStaff: TechnicalStaff) => void;
  onDeleteStaff: (clubId: string, staffId: string) => void;
}

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
);

const positions = ['Goleiro', 'Defensor', 'Lateral', 'Meio-campo', 'Volante', 'Ponta', 'Atacante'];


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


const AdminClubsTab: React.FC<AdminClubsTabProps> = ({ 
    clubs, 
    championship,
    leagueSlug,
    championshipId,
    onCreateClub, 
    onPlayerClick,
    onUpdatePlayer, 
    onCreatePlayer, 
    onDeletePlayer,
    onCreateStaff,
    onUpdateStaff,
    onDeleteStaff
}) => {
  const [expandedClub, setExpandedClub] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState({
      performance: false,
      players: true,
      staff: false,
  });
  
  // Club form state
  const [showAddClubForm, setShowAddClubForm] = useState(false);
  const [newClubName, setNewClubName] = useState('');
  const [newClubAbbr, setNewClubAbbr] = useState('');
  const [newClubLogo, setNewClubLogo] = useState('');
  const [newClubWhatsapp, setNewClubWhatsapp] = useState('');
  
  // Player form state
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showAddPlayerFormForClub, setShowAddPlayerFormForClub] = useState<string | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPosition, setNewPlayerPosition] = useState('');
  const [newPlayerNickname, setNewPlayerNickname] = useState('');
  const [newPlayerCpf, setNewPlayerCpf] = useState('');
  const [newPlayerPhotoUrl, setNewPlayerPhotoUrl] = useState('');

  // Staff form state
  const [editingStaff, setEditingStaff] = useState<TechnicalStaff | null>(null);
  const [showAddStaffFormForClub, setShowAddStaffFormForClub] = useState<string | null>(null);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('');


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
    if (!newClubName.trim() || !newClubAbbr.trim()) return;
    const cleanWhatsapp = '+55' + newClubWhatsapp.replace(/\D/g, '');
    onCreateClub(newClubName.trim(), newClubAbbr.trim().toUpperCase(), newClubLogo.trim(), cleanWhatsapp);
    setNewClubName(''); setNewClubAbbr(''); setNewClubLogo(''); setNewClubWhatsapp('');
    setShowAddClubForm(false);
  };

  // Player Handlers
  const handleAddPlayer = (e: React.FormEvent, clubId: string) => {
    e.preventDefault();
    if (!newPlayerName.trim() || !newPlayerPosition.trim()) return;
    onCreatePlayer(clubId, newPlayerName.trim(), newPlayerPosition.trim(), newPlayerNickname.trim(), newPlayerCpf.trim(), newPlayerPhotoUrl.trim());
    setNewPlayerName(''); setNewPlayerPosition(''); setNewPlayerNickname(''); setNewPlayerCpf(''); setNewPlayerPhotoUrl('');
    setShowAddPlayerFormForClub(null);
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(JSON.parse(JSON.stringify(player)));
  };
  
  const handleSavePlayer = (clubId: string) => {
    if (!editingPlayer) return;
    onUpdatePlayer(clubId, editingPlayer);
    setEditingPlayer(null);
  };

  // Staff Handlers
  const handleAddStaff = (e: React.FormEvent, clubId: string) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffRole.trim()) return;
    onCreateStaff(clubId, newStaffName.trim(), newStaffRole.trim());
    setNewStaffName(''); setNewStaffRole('');
    setShowAddStaffFormForClub(null);
  };

  const handleSaveStaff = (clubId: string) => {
    if (!editingStaff) return;
    onUpdateStaff(clubId, editingStaff);
    setEditingStaff(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">CLUBES</h2>
        <button onClick={() => setShowAddClubForm(!showAddClubForm)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center">
          <PlusIcon />
          <span className="ml-2">Adicionar Clube</span>
        </button>
      </div>

      {showAddClubForm && (
        <form onSubmit={handleAddClub} className="bg-gray-700/50 p-4 rounded-lg mb-6 space-y-3 animate-fade-in-down">
          <input type="text" value={newClubName} onChange={(e) => setNewClubName(e.target.value)} placeholder="Nome do Clube" required className="w-full bg-gray-800 border-gray-600 rounded p-2 text-white"/>
          <input type="text" value={newClubAbbr} onChange={(e) => setNewClubAbbr(e.target.value)} placeholder="Abreviação (3 letras)" maxLength={3} required className="w-full bg-gray-800 border-gray-600 rounded p-2 text-white"/>
          <input type="text" value={newClubLogo} onChange={(e) => setNewClubLogo(e.target.value)} placeholder="URL do Logo (Opcional)" className="w-full bg-gray-800 border-gray-600 rounded p-2 text-white"/>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 pointer-events-none">+55</span>
            <input 
              type="tel" 
              value={newClubWhatsapp} 
              onChange={(e) => setNewClubWhatsapp(maskPhone(e.target.value))} 
              placeholder="(XX) XXXXX-XXXX" 
              className="w-full bg-gray-800 border-gray-600 rounded p-2 pl-12 text-white"
            />
          </div>
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowAddClubForm(false)} className="py-1 px-3 rounded text-gray-300 hover:text-white">Cancelar</button><button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded">Salvar</button></div>
        </form>
      )}

      {clubs.length === 0 ? (
        <div className="text-center py-10 text-gray-400">Nenhum clube inscrito.</div>
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
              <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-700" onClick={() => toggleClub(club.id)}>
                <div className="flex items-center"><img src={club.logoUrl} alt={club.name} className="w-12 h-12 rounded-full mr-4 object-cover" /><span className="font-bold text-lg text-white">{club.name} ({club.abbreviation})</span></div>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-gray-400 transition-transform ${expandedClub === club.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
              {expandedClub === club.id && (
                <div className="bg-gray-800 p-4 space-y-4 animate-fade-in-down">
                  
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

                  {/* Players Section */}
                  <CollapsibleSection title="Jogadores" isOpen={openSections.players} onToggle={() => toggleSection('players')}>
                    <div className="flex items-center justify-end mb-2">
                        <button onClick={() => setShowAddPlayerFormForClub(club.id)} className="text-green-400 p-1 rounded-full hover:bg-green-500/20 text-sm flex items-center gap-1">
                            <PlusIcon /> Adicionar
                        </button>
                    </div>
                    {showAddPlayerFormForClub === club.id && (
                      <form onSubmit={(e) => handleAddPlayer(e, club.id)} className="space-y-2 p-2 bg-gray-700/50 rounded-md mb-2">
                          <input type="text" value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} placeholder="Nome Completo" required className="bg-gray-900 p-1 rounded w-full text-sm"/>
                          <div className="flex gap-2">
                             <input type="text" value={newPlayerNickname} onChange={e => setNewPlayerNickname(e.target.value)} placeholder="Apelido" className="bg-gray-900 p-1 rounded w-full text-sm"/>
                             <input type="text" value={newPlayerCpf} onChange={e => setNewPlayerCpf(maskCPF(e.target.value))} placeholder="CPF" className="bg-gray-900 p-1 rounded w-full text-sm"/>
                          </div>
                           <input type="text" value={newPlayerPhotoUrl} onChange={e => setNewPlayerPhotoUrl(e.target.value)} placeholder="URL da Foto" className="bg-gray-900 p-1 rounded w-full text-sm"/>
                          <select value={newPlayerPosition} onChange={e => setNewPlayerPosition(e.target.value)} required className="bg-gray-900 p-1 rounded w-full text-sm">
                              <option value="" disabled>Posição</option>
                              {positions.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                          </select>
                          <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowAddPlayerFormForClub(null)} className="text-gray-400 text-sm">Cancelar</button><button type="submit" className="bg-blue-600 text-white px-2 py-1 rounded text-sm">Salvar</button></div>
                      </form>
                    )}
                    <ul className="text-sm text-gray-300 divide-y divide-gray-700">
                      {club.players.map(player => {
                          const suspensionDetails = getPlayerSuspensionDetails(player.id, championship);
                          return (
                            <li key={player.id} className="py-2 flex flex-col">
                              {editingPlayer?.id === player.id ? (
                                <div className="flex-grow flex flex-col gap-2 p-2 bg-gray-900/50 rounded-md">
                                    <input value={editingPlayer.name} onChange={e => setEditingPlayer({...editingPlayer, name: e.target.value})} className="bg-gray-700 p-1 rounded text-sm" placeholder="Nome"/>
                                    <div className="flex gap-2">
                                      <input value={editingPlayer.nickname || ''} onChange={e => setEditingPlayer({...editingPlayer, nickname: e.target.value})} className="bg-gray-700 p-1 rounded text-sm w-full" placeholder="Apelido"/>
                                      <input value={editingPlayer.cpf || ''} onChange={e => setEditingPlayer({...editingPlayer, cpf: maskCPF(e.target.value)})} className="bg-gray-700 p-1 rounded text-sm w-full" placeholder="CPF"/>
                                    </div>
                                    <input value={editingPlayer.photoUrl || ''} onChange={e => setEditingPlayer({...editingPlayer, photoUrl: e.target.value})} className="bg-gray-700 p-1 rounded text-sm" placeholder="URL da Foto"/>
                                    <select value={editingPlayer.position} onChange={e => setEditingPlayer({...editingPlayer, position: e.target.value})} className="bg-gray-700 p-1 rounded text-sm">
                                        {positions.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                                    </select>
                                    <div className="flex justify-end gap-1"><button onClick={() => handleSavePlayer(club.id)} className="text-green-400 px-2 py-1 text-xs">Salvar</button><button onClick={() => setEditingPlayer(null)} className="text-gray-400 px-2 py-1 text-xs">Cancelar</button></div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex justify-between items-start">
                                    <div className="flex-grow flex items-center gap-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); onPlayerClick(player); }}>
                                        <img src={player.photoUrl || `https://i.pravatar.cc/150?u=${player.id}`} alt={player.name} className="w-8 h-8 rounded-full object-cover"/>
                                        <div>
                                            <span className="font-medium text-white">{player.nickname || player.name}</span>
                                            <span className="text-gray-400 text-xs ml-2">({player.position})</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 flex-shrink-0 ml-2">
                                        <button onClick={(e) => { e.stopPropagation(); handleEditPlayer(player); }} className="text-blue-400 px-2">Editar</button>
                                        <button onClick={(e) => { e.stopPropagation(); window.confirm('Tem certeza?') && onDeletePlayer(club.id, player.id); }} className="text-red-500">Excluir</button>
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
                                </>
                              )}
                            </li>
                          );
                      })}
                      {club.players.length === 0 && <li className="py-2 text-center text-gray-500">Nenhum jogador cadastrado.</li>}
                    </ul>
                  </CollapsibleSection>

                  {/* Technical Staff Section */}
                  <CollapsibleSection title="Comissão Técnica" isOpen={openSections.staff} onToggle={() => toggleSection('staff')}>
                    <div className="flex items-center justify-end mb-2">
                        <button onClick={() => setShowAddStaffFormForClub(club.id)} className="text-green-400 p-1 rounded-full hover:bg-green-500/20 text-sm flex items-center gap-1">
                          <PlusIcon /> Adicionar
                        </button>
                    </div>
                     {showAddStaffFormForClub === club.id && (
                      <form onSubmit={(e) => handleAddStaff(e, club.id)} className="flex gap-2 items-center p-2 bg-gray-700/50 rounded-md mb-2">
                          <input type="text" value={newStaffName} onChange={e => setNewStaffName(e.target.value)} placeholder="Nome" required className="bg-gray-900 p-1 rounded w-full text-sm"/>
                          <input type="text" value={newStaffRole} onChange={e => setNewStaffRole(e.target.value)} placeholder="Cargo" required className="bg-gray-900 p-1 rounded w-full text-sm"/>
                          <button type="submit" className="bg-blue-600 text-white px-2 py-1 rounded text-sm">Salvar</button>
                          <button type="button" onClick={() => setShowAddStaffFormForClub(null)} className="text-gray-400 text-lg">&times;</button>
                      </form>
                    )}
                    <ul className="text-sm text-gray-300 divide-y divide-gray-700">
                      {club.technicalStaff.map(staff => (
                        <li key={staff.id} className="py-2 flex justify-between items-center">
                           {editingStaff?.id === staff.id ? (
                              <>
                                  <input value={editingStaff.name} onChange={e => setEditingStaff({...editingStaff, name: e.target.value})} className="bg-gray-700 p-1 rounded w-2/5"/>
                                  <input value={editingStaff.role} onChange={e => setEditingStaff({...editingStaff, role: e.target.value})} className="bg-gray-700 p-1 rounded w-2/5"/>
                                  <div className="flex gap-1"><button onClick={() => handleSaveStaff(club.id)} className="text-green-400 px-2">OK</button><button onClick={() => setEditingStaff(null)} className="text-gray-400">X</button></div>
                              </>
                          ) : (
                            <>
                              <span><strong>{staff.role}:</strong> {staff.name}</span>
                              <div className="flex gap-1"><button onClick={() => setEditingStaff(JSON.parse(JSON.stringify(staff)))} className="text-blue-400 px-2">Editar</button><button onClick={() => window.confirm('Tem certeza?') && onDeleteStaff(club.id, staff.id)} className="text-red-500">Excluir</button></div>
                            </>
                           )}
                        </li>
                      ))}
                      {club.technicalStaff.length === 0 && <li className="py-2 text-center text-gray-500">Nenhum membro cadastrado.</li>}
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

export default AdminClubsTab;