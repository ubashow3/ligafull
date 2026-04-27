
import React, { useState, useEffect } from 'react';
import { League, Championship, UserProfile } from '../types';
import NewsFeed from '../components/NewsFeed';

interface LeaguePageProps {
  league: League;
  user: UserProfile | null;
  onSelectChampionship: (championship: Championship) => void;
  onBack: () => void;
  isAdminMode: boolean;
  onCreateChampionship: (leagueId: string, champName: string) => void;
}

type LeagueView = 'resenha' | 'campeonatos';

const LeaguePage: React.FC<LeaguePageProps> = ({ league, user, onSelectChampionship, onBack, isAdminMode, onCreateChampionship }) => {
  const [activeView, setActiveView] = useState<LeagueView>('resenha');
  const [showAddChampForm, setShowAddChampForm] = useState(false);
  const [newChampName, setNewChampName] = useState('');

  const coverImage = league.coverUrl || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200';

  useEffect(() => {
    if (isAdminMode) return;
    const favoriteLeagueId = localStorage.getItem('favoriteLeagueId');
    if (favoriteLeagueId === league.id) return;

    setTimeout(() => {
        if (window.confirm(`Deseja definir "${league.name}" como sua liga preferida? Ela aparecerá no topo na sua próxima visita.`)) {
            localStorage.setItem('favoriteLeagueId', league.id);
        }
    }, 1500);
  }, [league.id, league.name, isAdminMode]);

  const handleAddChampionship = (e: React.FormEvent) => {
    e.preventDefault();
    if (newChampName.trim() === '') return;
    onCreateChampionship(league.id, newChampName.trim());
    setNewChampName('');
    setShowAddChampForm(false);
  };
  
  return (
    <div className="animate-fade-in -mt-8 min-h-screen bg-[#18191a]">
      {/* Header Estilo Facebook */}
      <div className="bg-[#242526] shadow-md border-b border-white/5">
        <div className="max-w-5xl mx-auto relative">
          {/* Foto de Capa */}
          <div className="h-44 sm:h-72 md:h-96 w-full overflow-hidden rounded-b-2xl relative group">
            <img src={coverImage || undefined} alt="Capa da Liga" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            
            {!isAdminMode && (
                <button 
                  onClick={onBack}
                  className="absolute top-4 left-4 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white font-bold py-2 px-4 rounded-xl inline-flex items-center transition-all border border-white/10 text-xs z-20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Todas as Ligas
                </button>
            )}
          </div>

          {/* Avatar e Informações da Liga */}
          <div className="px-4 sm:px-8 flex flex-col items-center sm:items-end sm:flex-row gap-4 sm:gap-6 -mt-16 sm:-mt-20 pb-6 relative z-10">
            <div className="relative">
                <div className="w-32 h-32 sm:w-44 sm:h-44 rounded-full border-[6px] border-[#242526] shadow-2xl bg-[#18191a] overflow-hidden">
                    <img src={league.logoUrl || undefined} alt={`${league.name} logo`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
            </div>
            
            <div className="flex-grow text-center sm:text-left mb-2">
                <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tighter leading-none mb-1 italic uppercase">{league.name}</h1>
                <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">
                    {league.city}, {league.state} • <span className="text-green-500">{league.championships.length} Campeonatos</span>
                </p>
            </div>

            <div className="flex gap-2 mb-2">
                {isAdminMode && (
                    <button 
                        onClick={() => setShowAddChampForm(!showAddChampForm)}
                        className="bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all flex items-center gap-2 shadow-lg"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        Novo Campeonato
                    </button>
                )}
                <button className="bg-[#3a3b3c] hover:bg-[#4e4f50] text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all">
                   Seguir Liga
                </button>
            </div>
          </div>

          {/* Abas Estilo Facebook */}
          <div className="border-t border-white/5 px-4 sm:px-8 flex gap-2">
            <button 
                onClick={() => setActiveView('resenha')}
                className={`py-4 px-6 text-sm font-black uppercase tracking-tighter transition-all relative ${activeView === 'resenha' ? 'text-[#1877F2]' : 'text-gray-400 hover:bg-white/5'}`}
            >
                Resenha ⚡
                {activeView === 'resenha' && <div className="absolute bottom-0 left-0 w-full h-[4px] bg-[#1877F2] rounded-t-full"></div>}
            </button>
            <button 
                onClick={() => setActiveView('campeonatos')}
                className={`py-4 px-6 text-sm font-black uppercase tracking-tighter transition-all relative ${activeView === 'campeonatos' ? 'text-[#1877F2]' : 'text-gray-400 hover:bg-white/5'}`}
            >
                Campeonatos 🏆
                {activeView === 'campeonatos' && <div className="absolute bottom-0 left-0 w-full h-[4px] bg-[#1877F2] rounded-t-full"></div>}
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo Centralizado (Feed ou Campeonatos) */}
      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in-up">
        {activeView === 'resenha' ? (
            user ? (
                <NewsFeed league={league} user={user} />
            ) : (
                <div className="text-center py-20 text-gray-500 font-bold animate-pulse uppercase tracking-widest">Carregando feed social...</div>
            )
        ) : (
            <div className="space-y-6">
                {showAddChampForm && isAdminMode && (
                    <form onSubmit={handleAddChampionship} className="bg-[#242526] p-8 rounded-3xl border border-white/5 animate-fade-in-down shadow-2xl mb-8">
                        <h3 className="text-white font-black text-xl mb-6 uppercase italic">Configurar Novo Campeonato</h3>
                        <input 
                            type="text"
                            value={newChampName}
                            onChange={(e) => setNewChampName(e.target.value)}
                            placeholder="Nome do campeonato (ex: Copa Verão 2024)"
                            className="w-full bg-[#3a3b3c] border-none rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-[#1877F2] mb-6"
                        />
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setShowAddChampForm(false)} className="text-gray-400 font-bold uppercase tracking-tighter px-6 py-2">Cancelar</button>
                            <button type="submit" className="bg-[#1877F2] hover:bg-[#166fe5] text-white font-black px-8 py-3 rounded-2xl text-sm uppercase tracking-tighter shadow-lg">Salvar Campeonato</button>
                        </div>
                    </form>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {league.championships.map(champ => (
                        <div 
                            key={champ.id} 
                            className="bg-[#242526] p-8 rounded-[32px] border border-white/5 cursor-pointer transition-all hover:bg-[#3a3b3c] hover:scale-[1.02] group relative overflow-hidden shadow-xl"
                            onClick={() => onSelectChampionship(champ)}
                        >
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" /></svg>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white leading-none group-hover:text-[#1877F2] transition-colors uppercase italic">{champ.name}</h3>
                                    <p className="text-gray-500 text-xs font-black uppercase tracking-widest mt-2">{champ.clubs.length} Clubes Inscritos</p>
                                </div>
                            </div>
                            <div className="mt-8 flex items-center justify-between">
                                <span className="text-[10px] text-[#1877F2] font-black uppercase tracking-widest bg-[#1877F2]/10 px-3 py-1 rounded-full">Ver Tabela e Jogos</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                            </div>
                        </div>
                    ))}
                    {league.championships.length === 0 && (
                        <div className="col-span-2 text-center py-24 bg-[#242526]/50 rounded-[40px] border border-dashed border-white/10">
                            <p className="text-gray-600 font-black uppercase tracking-[0.2em] italic">Nenhum campeonato ativo no momento</p>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default LeaguePage;
