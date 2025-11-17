

import React, { useState } from 'react';
import { Club, Player, TechnicalStaff, Championship, Match, ChampionshipFinancials } from '../../../types';
import * as leagueService from '../../../services/leagueService';

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
  onSaveFinancials: (championshipId: string, financials: ChampionshipFinancials) => void;
  onUpdateClubRegistrationStatus: (championshipId: string, clubId: string, isPaid: boolean) => void;
  onUpdateClubFinePaymentStatus: (championshipId: string, clubId: string, round: number, isPaid: boolean) => void;
  onUpdateClubDetails: (clubId: string, details: { name?: string; logoUrl?: string; whatsapp?: string; }) => void;
  // Player Props
  onUpdatePlayer: (clubId: string, updatedPlayer: Player) => void;
  onCreatePlayer: (clubId: string, name: string, position: string, nickname: string, cpf: string, photoUrl: string, birthDate: string) => void;
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

const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.487 5.235 3.487 8.413 0 6.557-5.338 11.892-11.894 11.892-1.99 0-3.903-.51-5.633-1.447l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.447-4.435-9.884-9.888-9.884-5.448 0-9.886 4.434-9.889 9.884-.001 2.225.651 4.315 1.731 6.086l.099.197-.54 1.968 1.98- .529z" />
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
    onSaveFinancials,
    onUpdateClubRegistrationStatus,
    onUpdateClubFinePaymentStatus,
    onUpdateClubDetails,
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
      financials: false,
  });
  
  // Club form state
  const [showAddClubForm, setShowAddClubForm] = useState(false);
  const [newClubName, setNewClubName] = useState('');
  const [newClubAbbr, setNewClubAbbr] = useState('');
  const [newClubWhatsapp, setNewClubWhatsapp] = useState('');
  const [newClubLogoFile, setNewClubLogoFile] = useState<File | null>(null);
  const [newClubLogoPreview, setNewClubLogoPreview] = useState<string>('');

  // Club edit state
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [editingClubLogoFile, setEditingClubLogoFile] = useState<File | null>(null);
  const [editingClubLogoPreview, setEditingClubLogoPreview] = useState<string>('');
  
  // Player form state
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showAddPlayerFormForClub, setShowAddPlayerFormForClub] = useState<string | null>(null);
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
  const [showAddStaffFormForClub, setShowAddStaffFormForClub] = useState<string | null>(null);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('');


  const toggleClub = (clubId: string) => {
    const isOpeningNewClub = expandedClub !== clubId;
    if (editingClub && editingClub.id !== clubId) {
        setEditingClub(null); // Close editing form if opening another club
    }
    setExpandedClub(prevId => (prevId === clubId ? null : clubId));
    if (isOpeningNewClub) {
        setOpenSections({ performance: false, players: true, staff: false, financials: false });
    }
  };

  const toggleSection = (section: keyof typeof openSections) => {
      setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

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

  const handleAddClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClubName.trim() || !newClubAbbr.trim() || !newClubWhatsapp.trim()) {
        alert("Nome, Abreviação e WhatsApp são obrigatórios.");
        return;
    }
    
    let uploadedLogoUrl = '';
    if (newClubLogoFile) {
        try {
            uploadedLogoUrl = await leagueService.uploadImage(newClubLogoFile);
        } catch (error) {
            alert(`Erro no upload do logo: ${(error as Error).message}`);
            return;
        }
    }

    const cleanWhatsapp = newClubWhatsapp.replace(/\D/g, '');
    onCreateClub(newClubName.trim(), newClubAbbr.trim().toUpperCase(), uploadedLogoUrl, cleanWhatsapp);
    
    setNewClubName(''); setNewClubAbbr(''); setNewClubWhatsapp('');
    setNewClubLogoFile(null); setNewClubLogoPreview('');
    setShowAddClubForm(false);
  };
  
  // Club Edit Handlers
    const handleEditClub = (club: Club) => {
        setEditingClub(JSON.parse(JSON.stringify(club))); // Deep copy
        setExpandedClub(club.id);
        setEditingClubLogoPreview(club.logoUrl);
        setEditingClubLogoFile(null);
    };

    const handleCancelEdit = () => {
        setEditingClub(null);
        setEditingClubLogoFile(null);
        setEditingClubLogoPreview('');
    };

    const handleSaveClub = async () => {
        if (!editingClub) return;

        let uploadedLogoUrl: string | undefined = undefined;
        if (editingClubLogoFile) {
            try {
                uploadedLogoUrl = await leagueService.uploadImage(editingClubLogoFile);
            } catch (error) {
                alert(`Erro ao fazer upload do logo: ${(error as Error).message}`);
                return;
            }
        }

        const detailsToUpdate: { name?: string; logoUrl?: string; whatsapp?: string } = {};
        const originalClub = clubs.find(c => c.id === editingClub.id);
        if (!originalClub) return;

        const cleanedWhatsapp = (editingClub.whatsapp || '').replace(/\D/g, '');

        if (editingClub.name.trim() && editingClub.name.trim() !== originalClub.name) {
            detailsToUpdate.name = editingClub.name.trim();
        }
        if (cleanedWhatsapp && cleanedWhatsapp !== originalClub.whatsapp) {
            detailsToUpdate.whatsapp = cleanedWhatsapp;
        }
        if (uploadedLogoUrl) {
            detailsToUpdate.logoUrl = uploadedLogoUrl;
        }

        if (Object.keys(detailsToUpdate).length > 0) {
            onUpdateClubDetails(editingClub.id, detailsToUpdate);
        }
        
        handleCancelEdit();
    };

  const handleGenerateClubAccess = (clubId: string) => {
    if (!championship.financials) {
        alert("Dados financeiros do campeonato não encontrados.");
        return;
    }
    const newToken = crypto.randomUUID().split('-')[0]; // Short, 8-char token
    const updatedFinancials: ChampionshipFinancials = {
        ...championship.financials,
        clubAdminTokens: {
            ...championship.financials.clubAdminTokens,
            [clubId]: newToken
        }
    };
    onSaveFinancials(championship.id, updatedFinancials);
  };

  const handleSendWhatsapp = (club: Club, token: string) => {
    if (!club.whatsapp) {
      alert('Este clube não possui um número de WhatsApp cadastrado.');
      return;
    }
    const magicLink = `${window.location.origin}${window.location.pathname}?token=${token}`;
    const message = `Olá! Aqui está o seu link de acesso para gerenciar o ${club.name} no campeonato ${championship.name}:\n\n${magicLink}\n\nEste link é único, pessoal e intransferível.`;
    const encodedMessage = encodeURIComponent(message);
    const phoneNumber = club.whatsapp.replace(/\D/g, '');
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
  };

  // Player Handlers
  const handleAddPlayer = async (e: React.FormEvent, clubId: string) => {
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

    onCreatePlayer(clubId, newPlayerName.trim(), newPlayerPosition.trim(), newPlayerNickname.trim(), newPlayerCpf.trim(), uploadedPhotoUrl, newPlayerBirthDate);
    setNewPlayerName(''); setNewPlayerPosition(''); setNewPlayerNickname(''); setNewPlayerCpf(''); setNewPlayerBirthDate('');
    setNewPlayerPhotoFile(null); setNewPlayerPhotoPreview('');
    setShowAddPlayerFormForClub(null);
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(JSON.parse(JSON.stringify(player)));
    setEditingPlayerPhotoFile(null); 
    setEditingPlayerPhotoPreview(''); 
  };
  
  const handleSavePlayer = async (clubId: string) => {
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
    
    onUpdatePlayer(clubId, playerToSave);
    setEditingPlayer(null);
    setEditingPlayerPhotoFile(null);
    setEditingPlayerPhotoPreview('');
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
           <div className="flex items-center gap-4">
                {newClubLogoPreview ? <img src={newClubLogoPreview} alt="Prévia" className="w-12 h-12 rounded-full object-cover"/> : <div className="w-12 h-12 rounded-full bg-gray-600"/>}
                <input type="file" onChange={(e) => handleFileChange(e, setNewClubLogoFile, setNewClubLogoPreview)} accept="image/*" className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-600/20 file:text-green-300 hover:file:bg-green-600/30"/>
           </div>
          <input 
            type="tel" 
            value={newClubWhatsapp} 
            onChange={(e) => setNewClubWhatsapp(maskPhone(e.target.value))} 
            placeholder="WhatsApp (XX) XXXXX-XXXX"
            required
            className="w-full bg-gray-800 border-gray-600 rounded p-2 text-white"
          />
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

            const finesByRound = getClubFinesByRound(club, championship);
            const registrationFee = championship.financials?.registrationFeePerClub || 0;
            const isRegistrationPaid = championship.financials?.clubPayments?.[club.id] || false;
            
            const unpaidFines = finesByRound
                .filter(fine => !championship.financials?.finePayments?.[club.id]?.[fine.round])
                .reduce((acc, curr) => acc + curr.totalFine, 0);

            const totalDue = (isRegistrationPaid ? 0 : registrationFee) + unpaidFines;
            const clubToken = championship.financials?.clubAdminTokens?.[club.id];

            return (
            <div key={club.id} className="bg-gray-700/50 rounded-lg overflow-hidden">
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center cursor-pointer flex-grow" onClick={() => toggleClub(club.id)}>
                        <img src={club.logoUrl} alt={club.name} className="w-12 h-12 rounded-full mr-4 object-cover" />
                        <span className="font-bold text-lg text-white">{club.name} ({club.abbreviation})</span>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); handleEditClub(club); }} className="text-blue-400 text-sm font-semibold hover:text-blue-300">
                            Editar
                        </button>
                        <svg xmlns="http://www.w3.org/2000/svg" onClick={() => toggleClub(club.id)} className={`h-6 w-6 text-gray-400 transition-transform cursor-pointer ${expandedClub === club.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>

              {expandedClub === club.id && (
                <div className="bg-gray-800 p-4 space-y-4 animate-fade-in-down">
                 {editingClub?.id === club.id ? (
                        <div className="p-4 bg-gray-900/50 rounded-lg">
                            <h4 className="font-bold text-green-400 text-base mb-4">Editar {club.name}</h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Nome do Clube</label>
                                    <input type="text" value={editingClub.name} onChange={e => setEditingClub({...editingClub, name: e.target.value})} className="w-full bg-gray-700 border-gray-600 rounded p-2 text-white"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Logo do Clube</label>
                                    <div className="flex items-center gap-4">
                                        <img src={editingClubLogoPreview || club.logoUrl || `https://i.pravatar.cc/150?u=${club.id}`} alt="Prévia" className="w-12 h-12 rounded-full object-cover"/>
                                        <input type="file" onChange={(e) => handleFileChange(e, setEditingClubLogoFile, setEditingClubLogoPreview)} accept="image/*" className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-600/20 file:text-green-300 hover:file:bg-green-600/30"/>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">WhatsApp</label>
                                    <input type="tel" value={editingClub.whatsapp || ''} onChange={e => setEditingClub({...editingClub, whatsapp: maskPhone(e.target.value)})} placeholder="(XX) XXXXX-XXXX" className="w-full bg-gray-700 border-gray-600 rounded p-2 text-white"/>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={handleCancelEdit} className="py-1 px-3 rounded text-gray-300 hover:text-white">Cancelar</button>
                                <button type="button" onClick={handleSaveClub} className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded">Salvar Alterações</button>
                            </div>
                        </div>
                    ) : (
                    <>
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
                            <input type="text" value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} placeholder="Nome Completo" required className="bg-gray-900 p-1 rounded w-full text-sm uppercase"/>
                            <div className="flex gap-2">
                                <input type="text" value={newPlayerNickname} onChange={e => setNewPlayerNickname(e.target.value)} placeholder="Apelido" className="bg-gray-900 p-1 rounded w-full text-sm"/>
                                <input type="text" value={newPlayerCpf} onChange={e => setNewPlayerCpf(maskCPF(e.target.value))} placeholder="CPF" className="bg-gray-900 p-1 rounded w-full text-sm"/>
                            </div>
                            <input type="date" value={newPlayerBirthDate} onChange={e => setNewPlayerBirthDate(e.target.value)} className="bg-gray-900 p-1 rounded w-full text-sm" placeholder="Data de Nascimento" />
                            <div className="flex items-center gap-4">
                                    {newPlayerPhotoPreview ? <img src={newPlayerPhotoPreview} alt="Prévia" className="w-10 h-10 rounded-full object-cover"/> : <div className="w-10 h-10 rounded-full bg-gray-600"/>}
                                    <input type="file" onChange={(e) => handleFileChange(e, setNewPlayerPhotoFile, setNewPlayerPhotoPreview)} accept="image/*" className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-600/20 file:text-green-300 hover:file:bg-green-600/30"/>
                            </div>
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
                                        <input value={editingPlayer.name} onChange={e => setEditingPlayer({...editingPlayer, name: e.target.value})} className="bg-gray-700 p-1 rounded text-sm uppercase" placeholder="Nome"/>
                                        <div className="flex gap-2">
                                        <input value={editingPlayer.nickname || ''} onChange={e => setEditingPlayer({...editingPlayer, nickname: e.target.value})} className="bg-gray-700 p-1 rounded text-sm w-full" placeholder="Apelido"/>
                                        <input value={editingPlayer.cpf || ''} onChange={e => setEditingPlayer({...editingPlayer, cpf: maskCPF(e.target.value)})} className="bg-gray-700 p-1 rounded text-sm w-full" placeholder="CPF"/>
                                        </div>
                                        <input type="date" value={editingPlayer.birthDate?.split('T')[0] || ''} onChange={e => setEditingPlayer({...editingPlayer, birthDate: e.target.value})} className="bg-gray-700 p-1 rounded text-sm w-full" />
                                        <div className="flex items-center gap-4">
                                            <img src={editingPlayerPhotoPreview || editingPlayer.photoUrl || `https://i.pravatar.cc/150?u=${player.id}`} alt="Prévia" className="w-10 h-10 rounded-full object-cover"/>
                                            <input type="file" onChange={(e) => handleFileChange(e, setEditingPlayerPhotoFile, setEditingPlayerPhotoPreview)} accept="image/*" className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-600/20 file:text-green-300 hover:file:bg-green-600/30"/>
                                    </div>
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
                            <input type="text" value={newStaffName} onChange={e => setNewStaffName(e.target.value)} placeholder="Nome" required className="bg-gray-900 p-1 rounded w-full text-sm uppercase"/>
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
                                    <input value={editingStaff.name} onChange={e => setEditingStaff({...editingStaff, name: e.target.value})} className="bg-gray-700 p-1 rounded w-2/5 uppercase"/>
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

                        {/* Financials Section */}
                        <CollapsibleSection title="Financeiro" isOpen={openSections.financials} onToggle={() => toggleSection('financials')}>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between items-center p-2 bg-gray-900/50 rounded-lg">
                                <div>
                                    <p className="font-semibold text-gray-300">Taxa de Inscrição</p>
                                    <p className="text-xl font-bold text-white">{registrationFee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs font-bold ${isRegistrationPaid ? 'text-green-400' : 'text-yellow-400'}`}>
                                        {isRegistrationPaid ? 'PAGO' : 'PENDENTE'}
                                    </span>
                                    <label htmlFor={`paid-toggle-${club.id}`} className="flex items-center cursor-pointer">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                id={`paid-toggle-${club.id}`}
                                                className="sr-only peer"
                                                checked={isRegistrationPaid}
                                                onChange={(e) => onUpdateClubRegistrationStatus(championship.id, club.id, e.target.checked)}
                                            />
                                            <div className="block bg-gray-600 w-12 h-6 rounded-full peer-checked:bg-green-600"></div>
                                            <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5"></div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {isRegistrationPaid && (
                            <div className="p-3 bg-gray-900/50 rounded-lg">
                                    <h5 className="font-semibold text-gray-300 mb-2">Acesso do Clube</h5>
                                    {clubToken ? (
                                        <button 
                                            onClick={() => handleSendWhatsapp(club, clubToken)} 
                                            disabled={!club.whatsapp}
                                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed"
                                        >
                                            <WhatsAppIcon />
                                            Enviar Acesso via WhatsApp
                                        </button>
                                    ) : (
                                        <button onClick={() => handleGenerateClubAccess(club.id)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg text-sm">
                                            Gerar Link de Acesso
                                        </button>
                                    )}
                                    {!club.whatsapp && clubToken && (
                                        <p className="text-xs text-red-400 mt-2 text-center">Cadastre o WhatsApp do clube para poder enviar o link.</p>
                                    )}
                                </div>
                            )}

                            <div className="p-3 bg-gray-900/50 rounded-lg">
                                <p className="font-semibold text-gray-300 mb-2">Multas por Rodada</p>
                                {finesByRound.length > 0 ? (
                                    <div className="space-y-3">
                                        {finesByRound.map(({ round, totalFine, cards }) => {
                                            const isRoundPaid = championship.financials?.finePayments?.[club.id]?.[round] || false;
                                            return (
                                                <div key={round} className="p-2 bg-gray-800/70 rounded">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <span className="font-bold text-white">{round}ª Rodada: </span>
                                                            <span className="font-semibold text-red-400">{totalFine.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className={`text-xs font-bold ${isRoundPaid ? 'text-green-400' : 'text-yellow-400'}`}>
                                                                {isRoundPaid ? 'PAGO' : 'PENDENTE'}
                                                            </span>
                                                            <label htmlFor={`fine-paid-toggle-${club.id}-${round}`} className="flex items-center cursor-pointer">
                                                                <div className="relative">
                                                                    <input
                                                                        type="checkbox"
                                                                        id={`fine-paid-toggle-${club.id}-${round}`}
                                                                        className="sr-only peer"
                                                                        checked={isRoundPaid}
                                                                        onChange={(e) => onUpdateClubFinePaymentStatus(championship.id, club.id, round, e.target.checked)}
                                                                    />
                                                                    <div className="block bg-gray-600 w-10 h-5 rounded-full peer-checked:bg-green-600"></div>
                                                                    <div className="dot absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5"></div>
                                                                </div>
                                                            </label>
                                                        </div>
                                                    </div>
                                                    <ul className="mt-2 pl-4 space-y-1 text-xs text-gray-400">
                                                        {cards.map((card, index) => (
                                                            <li key={index} className="flex items-center gap-2">
                                                                {card.type === 'yellow_card' ? <div className="w-2 h-3 bg-yellow-400 rounded-sm flex-shrink-0" /> : <div className="w-2 h-3 bg-red-600 rounded-sm flex-shrink-0" />}
                                                                <span>{card.playerName} ({new Date(card.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })})</span>
                                                                <span className="ml-auto font-mono">{card.fine.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
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
                                <span className="font-bold text-xl text-red-300">{totalDue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                        </div>
                        </CollapsibleSection>
                    </>
                    )}
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