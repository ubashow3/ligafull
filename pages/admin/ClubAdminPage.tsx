


import React, { useState, useMemo, useEffect } from 'react';
import { League, Championship, Club, Player, TechnicalStaff, Match } from '../../types';
import * as leagueService from '../../services/leagueService';

interface ClubAdminPageProps {
  league: League;
  championship: Championship;
  club: Club;
  onUpdatePlayer: (clubId: string, updatedPlayer: Player) => void;
  onCreatePlayer: (clubId: string, name: string, position: string, nickname: string, cpf: string, photoUrl: string, birthDate: string) => void;
  onDeletePlayer: (clubId: string, playerId: string) => void;
  onCreateStaff: (clubId: string, name: string, role: string) => void;
  onUpdateStaff: (clubId: string, updatedStaff: TechnicalStaff) => void;
  onDeleteStaff: (clubId: string, staffId: string) => void;
  onUpdateClubDetails: (clubId: string, details: { name?: string; logoUrl?: string }) => void;
}

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
);

const maskCPF = (value: string) => {
  if (!value) return "";
  value = value.replace(/\D/g, '');
  value = value.replace(/(\d{3})(\d)/, '$1.$2');
  value = value.replace(/(\d{3})(\d)/, '$1.$2');
  value = value.replace(/(\d{3})(\d{2})$/, '$1-$2');
  return value.slice(0, 14);
};

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

const getClubFinesByRound = (club: Club, championship: Championship) => {
    const yellowFine = championship.financials?.yellowCardFine || 0;
    const redFine = championship.financials?.redCardFine || 0;
    const playerIds = new Set(club.players.map(p => p.id));
    
    const finesByRound: { [round: number]: { totalFine: number; cards: any[] } } = {};

    championship.matches.forEach(match => {
        if (match.status === 'finished' || match.status === 'in_progress') {
             match.events.forEach(event => {
                if (playerIds.has(event.playerId)) {
                    if (event.type === 'yellow_card' || event.type === 'red_card') {
                        if (!finesByRound[match.round]) {
                            finesByRound[match.round] = { totalFine: 0, cards: [] };
                        }
                        const fine = event.type === 'yellow_card' ? yellowFine : redFine;
                        finesByRound[match.round].totalFine += fine;
                        finesByRound[match.round].cards.push({
                            ...event,
                            fine,
                            date: match.date
                        });
                    }
                }
            });
        }
    });

    return Object.entries(finesByRound).map(([round, data]) => ({
        round: parseInt(round, 10),
        ...data
    })).sort((a, b) => a.round - b.round);
};

const ClubAdminPage: React.FC<ClubAdminPageProps> = ({
  league,
  championship,
  club,
  onUpdatePlayer,
  onCreatePlayer,
  onDeletePlayer,
  onCreateStaff,
  onUpdateStaff,
  onDeleteStaff,
  onUpdateClubDetails
}) => {
  const [activeTab, setActiveTab] = useState<'players' | 'staff'>('players');
  
  // Club form state
  const [isEditingClubInfo, setIsEditingClubInfo] = useState(false);
  const [editingClubName, setEditingClubName] = useState(club.name);
  const [editingClubLogoFile, setEditingClubLogoFile] = useState<File | null>(null);
  const [editingClubLogoPreview, setEditingClubLogoPreview] = useState<string>(club.logoUrl);

  // Player form state
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showAddPlayerForm, setShowAddPlayerForm] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPosition, setNewPlayerPosition] = useState('');
  const [newPlayerNickname, setNewPlayerNickname] = useState('');
  const [newPlayerCpf, setNewPlayerCpf] = useState('');
  const [newPlayerBirthDate, setNewPlayerBirthDate] = useState('');
  const [newPlayerPhotoFile, setNewPlayerPhotoFile] = useState<File | null>(null);
  const [newPlayerPhotoPreview, setNewPlayerPhotoPreview] = useState<string>('');

  // Player edit state
  const [editingPlayerPhotoFile, setEditingPlayerPhotoFile] = useState<File | null>(null);
  const [editingPlayerPhotoPreview, setEditingPlayerPhotoPreview] = useState<string>('');

  // Staff form state
  const [editingStaff, setEditingStaff] = useState<TechnicalStaff | null>(null);
  const [showAddStaffForm, setShowAddStaffForm] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('');

  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  const [openSections, setOpenSections] = useState({
    performance: true,
    financials: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e);
      if (!localStorage.getItem('ligaFullA2HSPrompted')) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    setShowInstallPrompt(false);
    if (installPromptEvent) {
        installPromptEvent.prompt();
        const { outcome } = await installPromptEvent.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
    }
    localStorage.setItem('ligaFullA2HSPrompted', 'true');
  };

  const handleDismissInstallClick = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('ligaFullA2HSPrompted', 'true');
  };

  const registrationDeadline = useMemo(() => {
    const deadlineStr = championship.financials?.playerRegistrationDeadline;
    if (!deadlineStr) return null;
    const deadline = new Date(deadlineStr);
    deadline.setHours(23, 59, 59, 999);
    return deadline;
  }, [championship]);

  const isRegistrationClosed = registrationDeadline ? new Date() > registrationDeadline : false;
  
  const performanceData = useMemo(() => {
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
    }).reverse() as ('W' | 'D' | 'L')[];
    
    return { standingPosition, lastFiveResults, lastMatch, nextMatch };
  }, [championship, club.id]);
    
  const financialData = useMemo(() => {
      const finesByRound = getClubFinesByRound(club, championship);
      const registrationFee = championship.financials?.registrationFeePerClub || 0;
      const isRegistrationPaid = championship.financials?.clubPayments?.[club.id] || false;
      
      const unpaidFines = finesByRound
          .filter(fine => !championship.financials?.finePayments?.[club.id]?.[fine.round])
          .reduce((acc, curr) => acc + curr.totalFine, 0);

      const totalDue = (isRegistrationPaid ? 0 : registrationFee) + unpaidFines;
      
      return { finesByRound, registrationFee, isRegistrationPaid, totalDue };
  }, [championship, club]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>, previewSetter: React.Dispatch<React.SetStateAction<string>>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setter(file);
        previewSetter(URL.createObjectURL(file));
    } else {
        setter(null);
        previewSetter('');
    }
  };

  const handleSaveClubInfo = async () => {
    let uploadedLogoUrl: string | undefined = undefined;

    if (editingClubLogoFile) {
        try {
            uploadedLogoUrl = await leagueService.uploadImage(editingClubLogoFile);
        } catch (error) {
            alert(`Erro ao fazer upload do logo: ${(error as Error).message}`);
            return;
        }
    }

    const detailsToUpdate: { name?: string; logoUrl?: string } = {};
    if (editingClubName.trim() && editingClubName.trim() !== club.name) {
        detailsToUpdate.name = editingClubName.trim();
    }
    if (uploadedLogoUrl) {
        detailsToUpdate.logoUrl = uploadedLogoUrl;
    }

    if (Object.keys(detailsToUpdate).length > 0) {
        onUpdateClubDetails(club.id, detailsToUpdate);
    }
    
    setIsEditingClubInfo(false);
    setEditingClubLogoFile(null);
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim() || !newPlayerPosition.trim()) return;

    let uploadedPhotoUrl = '';
    if (newPlayerPhotoFile) {
        try {
            uploadedPhotoUrl = await leagueService.uploadImage(newPlayerPhotoFile);
        } catch (error) {
            alert(`Erro no upload da foto: ${(error as Error).message}`);
            return;
        }
    }

    onCreatePlayer(club.id, newPlayerName.trim(), newPlayerPosition.trim(), newPlayerNickname.trim(), newPlayerCpf.trim(), uploadedPhotoUrl, newPlayerBirthDate);
    setNewPlayerName(''); setNewPlayerPosition(''); setNewPlayerNickname(''); setNewPlayerCpf(''); setNewPlayerBirthDate('');
    setNewPlayerPhotoFile(null); setNewPlayerPhotoPreview('');
    setShowAddPlayerForm(false);
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(JSON.parse(JSON.stringify(player)));
    setEditingPlayerPhotoFile(null); 
    setEditingPlayerPhotoPreview(''); 
  };
  
  const handleSavePlayer = async () => {
    if (!editingPlayer) return;
    
    let playerToSave = { ...editingPlayer };

    if (editingPlayerPhotoFile) {
        try {
            const uploadedPhotoUrl = await leagueService.uploadImage(editingPlayerPhotoFile);
            playerToSave.photoUrl = uploadedPhotoUrl;
        } catch (error) {
            alert(`Erro ao fazer upload da foto: ${(error as Error).message}`);
            return;
        }
    }
    
    onUpdatePlayer(club.id, playerToSave);
    setEditingPlayer(null);
    setEditingPlayerPhotoFile(null);
    setEditingPlayerPhotoPreview('');
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffRole.trim()) return;
    onCreateStaff(club.id, newStaffName.trim(), newStaffRole.trim());
    setNewStaffName(''); setNewStaffRole('');
    setShowAddStaffForm(false);
  };

  const handleSaveStaff = () => {
    if (!editingStaff) return;
    onUpdateStaff(club.id, editingStaff);
    setEditingStaff(null);
  };

  return (
    <div className="animate-fade-in">
        <div className="flex items-start mb-8 gap-4">
            {isEditingClubInfo ? (
                <div className="relative group">
                    <img src={editingClubLogoPreview || club.logoUrl} alt={`${club.name} logo`} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-gray-700"/>
                    <label htmlFor="club-logo-upload" className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </label>
                    <input id="club-logo-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setEditingClubLogoFile, setEditingClubLogoPreview)}/>
                </div>
            ) : (
                <img src={club.logoUrl} alt={`${club.name} logo`} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-gray-700"/>
            )}
            <div className="flex-grow">
                {isEditingClubInfo ? (
                    <input 
                        type="text" 
                        value={editingClubName} 
                        onChange={(e) => setEditingClubName(e.target.value)} 
                        className="bg-gray-700 text-2xl md:text-3xl font-extrabold text-white p-2 rounded-lg w-full"
                    />
                ) : (
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white">{club.name}</h1>
                )}
                <p className="text-gray-400">Painel do Clube - {championship.name}</p>
            </div>
             {isEditingClubInfo ? (
                <div className="flex gap-2">
                    <button onClick={handleSaveClubInfo} className="bg-green-600 hover:bg-green-700 text-white font-bold p-2 rounded-lg text-sm">Salvar</button>
                    <button onClick={() => setIsEditingClubInfo(false)} className="text-gray-300 hover:text-white p-2 rounded-lg text-sm">Cancelar</button>
                </div>
            ) : (
                <button onClick={() => { setIsEditingClubInfo(true); setEditingClubName(club.name); setEditingClubLogoPreview(club.logoUrl); }} className="bg-gray-700 hover:bg-gray-600 text-white font-bold p-2 rounded-lg text-sm">Editar</button>
            )}
        </div>

        <div className="space-y-4 mb-8">
            <CollapsibleSection title="Desempenho no Campeonato" isOpen={openSections.performance} onToggle={() => toggleSection('performance')}>
                <div className="space-y-4 text-sm text-gray-300">
                    <div>
                        <span className="font-semibold text-gray-400">Posição:</span>
                        <span className="font-bold text-white ml-2">{performanceData.standingPosition ? `${performanceData.standingPosition}º lugar` : 'N/A'}</span>
                    </div>
                    <div>
                        <p className="font-semibold text-gray-400 mb-1">Últimos 5 Jogos:</p>
                        <div className="flex gap-1.5">
                            {performanceData.lastFiveResults.length > 0
                                ? performanceData.lastFiveResults.map((res, i) => <ResultDot key={i} result={res} />)
                                : <span className="text-xs text-gray-500">Nenhum jogo finalizado.</span>
                            }
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div>
                            <p className="font-semibold text-gray-400 mb-1">Último Resultado:</p>
                            {performanceData.lastMatch ? <MatchResultDisplay match={performanceData.lastMatch} /> : <span className="text-xs text-gray-500">N/A</span>}
                        </div>
                        <div>
                            <p className="font-semibold text-gray-400 mb-1">Próximo Jogo:</p>
                            {performanceData.nextMatch ? <NextMatchDisplay match={performanceData.nextMatch} /> : <span className="text-xs text-gray-500">N/A</span>}
                        </div>
                    </div>
                </div>
            </CollapsibleSection>
            <CollapsibleSection title="Financeiro" isOpen={openSections.financials} onToggle={() => toggleSection('financials')}>
                 <div className="space-y-4 text-sm">
                    <div className="flex justify-between items-center p-2 bg-gray-900/50 rounded-lg">
                        <div>
                            <p className="font-semibold text-gray-300">Taxa de Inscrição</p>
                            <p className="text-xl font-bold text-white">{financialData.registrationFee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                        <span className={`text-sm font-bold px-3 py-1 rounded-full ${financialData.isRegistrationPaid ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            {financialData.isRegistrationPaid ? 'PAGO' : 'PENDENTE'}
                        </span>
                    </div>

                    <div className="p-3 bg-gray-900/50 rounded-lg">
                        <p className="font-semibold text-gray-300 mb-2">Multas por Rodada</p>
                        {financialData.finesByRound.length > 0 ? (
                            <div className="space-y-3">
                                {financialData.finesByRound.map(({ round, totalFine }) => {
                                    const isRoundPaid = championship.financials?.finePayments?.[club.id]?.[round] || false;
                                    return (
                                        <div key={round} className="flex justify-between items-center p-2 bg-gray-800/70 rounded">
                                            <div>
                                                <span className="font-bold text-white">{round}ª Rodada: </span>
                                                <span className="font-semibold text-red-400">{totalFine.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                            </div>
                                            <span className={`text-xs font-bold ${isRoundPaid ? 'text-green-400' : 'text-yellow-400'}`}>
                                                {isRoundPaid ? 'PAGO' : 'PENDENTE'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-500 text-center">Nenhuma multa registrada.</p>
                        )}
                    </div>
                    
                    <div className="flex justify-between p-3 bg-red-500/10 rounded-lg mt-2">
                        <span className="font-bold text-red-300">Total a Pagar:</span>
                        <span className="font-bold text-xl text-red-300">{financialData.totalDue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                </div>
            </CollapsibleSection>
        </div>

        <div className="border-b border-gray-600 mb-6">
            <nav className="-mb-px flex space-x-2 sm:space-x-4" aria-label="Tabs">
                <button onClick={() => setActiveTab('players')} className={`px-4 py-2 font-medium text-sm rounded-t-lg ${activeTab === 'players' ? 'bg-gray-700 text-green-400' : 'text-gray-400'}`}>Jogadores</button>
                <button onClick={() => setActiveTab('staff')} className={`px-4 py-2 font-medium text-sm rounded-t-lg ${activeTab === 'staff' ? 'bg-gray-700 text-green-400' : 'text-gray-400'}`}>Comissão Técnica</button>
            </nav>
        </div>

        {isRegistrationClosed && activeTab === 'players' && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative mb-4" role="alert">
                <strong className="font-bold">Atenção!</strong>
                <span className="block sm:inline ml-2">O período de inscrição de jogadores encerrou em {registrationDeadline?.toLocaleDateString('pt-BR')}. Não é mais possível adicionar ou editar atletas.</span>
            </div>
        )}

        {activeTab === 'players' && (
            <div className="space-y-4">
                <div className="flex justify-end">
                    <button onClick={() => setShowAddPlayerForm(true)} disabled={isRegistrationClosed} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center disabled:bg-gray-500 disabled:cursor-not-allowed">
                        <PlusIcon /> <span className="ml-2">Adicionar Jogador</span>
                    </button>
                </div>

                {showAddPlayerForm && (
                    <form onSubmit={handleAddPlayer} className="space-y-2 p-3 bg-gray-700/50 rounded-md">
                        <input type="text" value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} placeholder="Nome Completo" required className="bg-gray-900 p-2 rounded w-full uppercase"/>
                        <div className="flex gap-2">
                           <input type="text" value={newPlayerNickname} onChange={e => setNewPlayerNickname(e.target.value)} placeholder="Apelido" className="bg-gray-900 p-2 rounded w-full"/>
                           <input type="text" value={newPlayerCpf} onChange={e => setNewPlayerCpf(maskCPF(e.target.value))} placeholder="CPF" className="bg-gray-900 p-2 rounded w-full"/>
                        </div>
                        <input type="date" value={newPlayerBirthDate} onChange={e => setNewPlayerBirthDate(e.target.value)} className="bg-gray-900 p-2 rounded w-full" placeholder="Data de Nascimento" />
                        <div className="flex items-center gap-4">
                            {newPlayerPhotoPreview ? <img src={newPlayerPhotoPreview} alt="Prévia" className="w-10 h-10 rounded-full object-cover"/> : <div className="w-10 h-10 rounded-full bg-gray-600"/>}
                            <input type="file" onChange={(e) => handleFileChange(e, setNewPlayerPhotoFile, setNewPlayerPhotoPreview)} accept="image/*" className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-green-600/20 file:text-green-300 hover:file:bg-green-600/30"/>
                        </div>
                        <select value={newPlayerPosition} onChange={e => setNewPlayerPosition(e.target.value)} required className="bg-gray-900 p-2 rounded w-full">
                            <option value="" disabled>Posição</option>
                            {positions.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                        </select>
                        <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowAddPlayerForm(false)} className="text-gray-400">Cancelar</button><button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">Salvar</button></div>
                    </form>
                )}

                {club.players.map(player => (
                    <div key={player.id} className="bg-gray-800 p-3 rounded-md">
                        {editingPlayer?.id === player.id ? (
                           <div className="flex-grow flex flex-col gap-2">
                               <input value={editingPlayer.name} onChange={e => setEditingPlayer({...editingPlayer, name: e.target.value})} className="bg-gray-700 p-1 rounded uppercase" placeholder="Nome"/>
                               <div className="flex gap-2">
                                 <input value={editingPlayer.nickname || ''} onChange={e => setEditingPlayer({...editingPlayer, nickname: e.target.value})} className="bg-gray-700 p-1 rounded w-full" placeholder="Apelido"/>
                                 <input value={editingPlayer.cpf || ''} onChange={e => setEditingPlayer({...editingPlayer, cpf: maskCPF(e.target.value)})} className="bg-gray-700 p-1 rounded w-full" placeholder="CPF"/>
                               </div>
                               <input type="date" value={editingPlayer.birthDate?.split('T')[0] || ''} onChange={e => setEditingPlayer({...editingPlayer, birthDate: e.target.value})} className="bg-gray-700 p-1 rounded w-full" />
                               <div className="flex items-center gap-4">
                                   <img src={editingPlayerPhotoPreview || editingPlayer.photoUrl || `https://i.pravatar.cc/150?u=${player.id}`} alt="Prévia" className="w-10 h-10 rounded-full object-cover"/>
                                   <input type="file" onChange={(e) => handleFileChange(e, setEditingPlayerPhotoFile, setEditingPlayerPhotoPreview)} accept="image/*" className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-green-600/20 file:text-green-300 hover:file:bg-green-600/30"/>
                              </div>
                               <select value={editingPlayer.position} onChange={e => setEditingPlayer({...editingPlayer, position: e.target.value})} className="bg-gray-700 p-1 rounded">
                                   {positions.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                               </select>
                               <div className="flex justify-end gap-1"><button onClick={handleSavePlayer} className="text-green-400 px-2 py-1">Salvar</button><button onClick={() => setEditingPlayer(null)} className="text-gray-400 px-2 py-1">Cancelar</button></div>
                           </div>
                        ) : (
                           <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <img src={player.photoUrl || `https://i.pravatar.cc/150?u=${player.id}`} alt={player.name} className="w-10 h-10 rounded-full object-cover"/>
                                    <div>
                                        <p className="font-medium text-white">{player.nickname || player.name}</p>
                                        <p className="text-sm text-gray-400">{player.position}</p>
                                    </div>
                                </div>
                                {!isRegistrationClosed && (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEditPlayer(player)} className="text-blue-400">Editar</button>
                                        <button onClick={() => window.confirm('Tem certeza?') && onDeletePlayer(club.id, player.id)} className="text-red-500">Excluir</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )}

        {activeTab === 'staff' && (
            <div className="space-y-4">
                <div className="flex justify-end">
                    <button onClick={() => setShowAddStaffForm(true)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center">
                        <PlusIcon /> <span className="ml-2">Adicionar Membro</span>
                    </button>
                </div>
                {showAddStaffForm && (
                     <form onSubmit={handleAddStaff} className="flex gap-2 items-center p-3 bg-gray-700/50 rounded-md">
                         <input type="text" value={newStaffName} onChange={e => setNewStaffName(e.target.value)} placeholder="Nome" required className="bg-gray-900 p-2 rounded w-full uppercase"/>
                         <input type="text" value={newStaffRole} onChange={e => setNewStaffRole(e.target.value)} placeholder="Cargo" required className="bg-gray-900 p-2 rounded w-full"/>
                         <button type="submit" className="bg-blue-600 text-white px-3 py-2 rounded">Salvar</button>
                         <button type="button" onClick={() => setShowAddStaffForm(false)} className="text-gray-400 text-2xl">&times;</button>
                     </form>
                )}
                 {club.technicalStaff.map(staff => (
                    <div key={staff.id} className="bg-gray-800 p-3 rounded-md flex justify-between items-center">
                        {editingStaff?.id === staff.id ? (
                            <>
                               <input value={editingStaff.name} onChange={e => setEditingStaff({...editingStaff, name: e.target.value})} className="bg-gray-700 p-1 rounded w-2/5 uppercase"/>
                               <input value={editingStaff.role} onChange={e => setEditingStaff({...editingStaff, role: e.target.value})} className="bg-gray-700 p-1 rounded w-2/5"/>
                               <div className="flex gap-1"><button onClick={handleSaveStaff} className="text-green-400 px-2">OK</button><button onClick={() => setEditingStaff(null)} className="text-gray-400">X</button></div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <p className="font-medium text-white">{staff.name}</p>
                                    <p className="text-sm text-gray-400">{staff.role}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingStaff(JSON.parse(JSON.stringify(staff)))} className="text-blue-400">Editar</button>
                                    <button onClick={() => window.confirm('Tem certeza?') && onDeleteStaff(club.id, staff.id)} className="text-red-500">Excluir</button>
                                </div>
                            </>
                        )}
                    </div>
                 ))}
            </div>
        )}

        {showInstallPrompt && installPromptEvent && (
            <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 bg-gray-700 p-4 text-white flex items-center justify-between shadow-lg z-50 animate-fade-in-up rounded-lg max-w-md ml-auto">
                <div className="flex items-center gap-4">
                    <img src={league.logoUrl} alt="League Logo" className="w-10 h-10 rounded-full flex-shrink-0" />
                    <div>
                        <p className="font-bold">Acesso Rápido!</p>
                        <p className="text-sm text-gray-300">Instale o app para facilitar o acesso.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleDismissInstallClick} className="text-sm text-gray-400 hover:text-white px-3 py-1">Agora não</button>
                    <button onClick={handleInstallClick} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm">Instalar</button>
                </div>
            </div>
        )}

    </div>
  );
};

export default ClubAdminPage;
