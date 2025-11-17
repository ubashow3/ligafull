import React, { useState, useMemo } from 'react';
import { League, Championship, Club, Player, TechnicalStaff } from '../../types';
import * as leagueService from '../../services/leagueService';
import AdminClubsTab from '../../components/admin/championship/AdminClubsTab'; // Re-using a good chunk of logic

interface ClubAdminPageProps {
  league: League;
  championship: Championship;
  club: Club;
  onUpdatePlayer: (clubId: string, updatedPlayer: Player) => void;
  onCreatePlayer: (clubId: string, name: string, position: string, nickname: string, cpf: string, photoUrl: string) => void;
  onDeletePlayer: (clubId: string, playerId: string) => void;
  onCreateStaff: (clubId: string, name: string, role: string) => void;
  onUpdateStaff: (clubId: string, updatedStaff: TechnicalStaff) => void;
  onDeleteStaff: (clubId: string, staffId: string) => void;
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

const ClubAdminPage: React.FC<ClubAdminPageProps> = ({
  league,
  championship,
  club,
  onUpdatePlayer,
  onCreatePlayer,
  onDeletePlayer,
  onCreateStaff,
  onUpdateStaff,
  onDeleteStaff
}) => {
  const [activeTab, setActiveTab] = useState<'players' | 'staff'>('players');
  
  // Player form state
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showAddPlayerForm, setShowAddPlayerForm] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPosition, setNewPlayerPosition] = useState('');
  const [newPlayerNickname, setNewPlayerNickname] = useState('');
  const [newPlayerCpf, setNewPlayerCpf] = useState('');
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

  const registrationDeadline = useMemo(() => {
    const deadlineStr = championship.financials?.playerRegistrationDeadline;
    if (!deadlineStr) return null;
    // The input type="date" returns YYYY-MM-DD. To compare correctly, 
    // we need to set the time to the end of that day.
    const deadline = new Date(deadlineStr);
    deadline.setHours(23, 59, 59, 999);
    return deadline;
  }, [championship]);

  const isRegistrationClosed = registrationDeadline ? new Date() > registrationDeadline : false;
  
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

  // Player Handlers
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

    onCreatePlayer(club.id, newPlayerName.trim(), newPlayerPosition.trim(), newPlayerNickname.trim(), newPlayerCpf.trim(), uploadedPhotoUrl);
    setNewPlayerName(''); setNewPlayerPosition(''); setNewPlayerNickname(''); setNewPlayerCpf('');
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

  // Staff Handlers
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
        <div className="flex items-center mb-8">
            <img src={club.logoUrl} alt={`${club.name} logo`} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover mr-4 sm:mr-6 border-4 border-gray-700"/>
            <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white">{club.name}</h1>
                <p className="text-gray-400">Painel do Clube - {championship.name}</p>
            </div>
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

        {/* Players Tab */}
        {activeTab === 'players' && (
            <div className="space-y-4">
                <div className="flex justify-end">
                    <button onClick={() => setShowAddPlayerForm(true)} disabled={isRegistrationClosed} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center disabled:bg-gray-500 disabled:cursor-not-allowed">
                        <PlusIcon /> <span className="ml-2">Adicionar Jogador</span>
                    </button>
                </div>

                {showAddPlayerForm && (
                    <form onSubmit={handleAddPlayer} className="space-y-2 p-3 bg-gray-700/50 rounded-md">
                        <input type="text" value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} placeholder="Nome Completo" required className="bg-gray-900 p-2 rounded w-full"/>
                        <div className="flex gap-2">
                           <input type="text" value={newPlayerNickname} onChange={e => setNewPlayerNickname(e.target.value)} placeholder="Apelido" className="bg-gray-900 p-2 rounded w-full"/>
                           <input type="text" value={newPlayerCpf} onChange={e => setNewPlayerCpf(maskCPF(e.target.value))} placeholder="CPF" className="bg-gray-900 p-2 rounded w-full"/>
                        </div>
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
                               <input value={editingPlayer.name} onChange={e => setEditingPlayer({...editingPlayer, name: e.target.value})} className="bg-gray-700 p-1 rounded" placeholder="Nome"/>
                               <div className="flex gap-2">
                                 <input value={editingPlayer.nickname || ''} onChange={e => setEditingPlayer({...editingPlayer, nickname: e.target.value})} className="bg-gray-700 p-1 rounded w-full" placeholder="Apelido"/>
                                 <input value={editingPlayer.cpf || ''} onChange={e => setEditingPlayer({...editingPlayer, cpf: maskCPF(e.target.value)})} className="bg-gray-700 p-1 rounded w-full" placeholder="CPF"/>
                               </div>
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

        {/* Staff Tab */}
        {activeTab === 'staff' && (
            <div className="space-y-4">
                <div className="flex justify-end">
                    <button onClick={() => setShowAddStaffForm(true)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center">
                        <PlusIcon /> <span className="ml-2">Adicionar Membro</span>
                    </button>
                </div>
                {showAddStaffForm && (
                     <form onSubmit={handleAddStaff} className="flex gap-2 items-center p-3 bg-gray-700/50 rounded-md">
                         <input type="text" value={newStaffName} onChange={e => setNewStaffName(e.target.value)} placeholder="Nome" required className="bg-gray-900 p-2 rounded w-full"/>
                         <input type="text" value={newStaffRole} onChange={e => setNewStaffRole(e.target.value)} placeholder="Cargo" required className="bg-gray-900 p-2 rounded w-full"/>
                         <button type="submit" className="bg-blue-600 text-white px-3 py-2 rounded">Salvar</button>
                         <button type="button" onClick={() => setShowAddStaffForm(false)} className="text-gray-400 text-2xl">&times;</button>
                     </form>
                )}
                 {club.technicalStaff.map(staff => (
                    <div key={staff.id} className="bg-gray-800 p-3 rounded-md flex justify-between items-center">
                        {editingStaff?.id === staff.id ? (
                            <>
                               <input value={editingStaff.name} onChange={e => setEditingStaff({...editingStaff, name: e.target.value})} className="bg-gray-700 p-1 rounded w-2/5"/>
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

    </div>
  );
};

export default ClubAdminPage;