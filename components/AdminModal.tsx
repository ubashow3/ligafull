import React, { useState } from 'react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToCreateLeague: () => void;
  onLogin: (email: string, password: string) => void;
  onClubLogin: (leagueSlug: string, clubAbbr: string, password: string) => void;
}

const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, onNavigateToCreateLeague, onLogin, onClubLogin }) => {
  const [activeTab, setActiveTab] = useState<'league' | 'club'>('league');
  
  // League login state
  const [leagueEmail, setLeagueEmail] = useState('');
  const [leaguePassword, setLeaguePassword] = useState('');
  
  // Club login state
  const [leagueSlug, setLeagueSlug] = useState('');
  const [clubAbbr, setClubAbbr] = useState('');
  const [clubPassword, setClubPassword] = useState('');

  if (!isOpen) return null;

  const handleLeagueLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (leagueEmail && leaguePassword) {
      onLogin(leagueEmail, leaguePassword);
    }
  };

  const handleClubLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (leagueSlug && clubAbbr && clubPassword) {
      onClubLogin(leagueSlug, clubAbbr, clubPassword);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" 
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-sm mx-4" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-white">Área Restrita</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>

        <div className="border-b border-gray-700 mb-4">
            <nav className="-mb-px flex space-x-4">
                <button onClick={() => setActiveTab('league')} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'league' ? 'border-green-400 text-green-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                    Acesso da Liga
                </button>
                <button onClick={() => setActiveTab('club')} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'club' ? 'border-green-400 text-green-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                    Acesso do Clube
                </button>
            </nav>
        </div>
        
        {activeTab === 'league' && (
            <div className="animate-fade-in">
                <form onSubmit={handleLeagueLogin} className="space-y-4">
                    <div>
                        <label htmlFor="admin-email-login" className="block text-sm font-medium text-gray-300">E-mail</label>
                        <input type="email" id="admin-email-login" value={leagueEmail} onChange={(e) => setLeagueEmail(e.target.value)} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"/>
                    </div>
                    <div>
                        <label htmlFor="admin-password-login" className="block text-sm font-medium text-gray-300">Senha</label>
                        <input type="password" id="admin-password-login" value={leaguePassword} onChange={(e) => setLeaguePassword(e.target.value)} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"/>
                    </div>
                    <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">Entrar</button>
                </form>
                <div className="text-center mt-4">
                    <button onClick={onNavigateToCreateLeague} className="text-sm text-green-400 hover:underline">
                        Não tem uma liga? Crie uma agora.
                    </button>
                </div>
            </div>
        )}

        {activeTab === 'club' && (
             <div className="animate-fade-in">
                <form onSubmit={handleClubLogin} className="space-y-4">
                    <div>
                        <label htmlFor="league-slug-login" className="block text-sm font-medium text-gray-300">URL da Liga</label>
                        <input type="text" id="league-slug-login" value={leagueSlug} onChange={(e) => setLeagueSlug(e.target.value.toLowerCase())} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white" placeholder="ex: minha-liga-2024"/>
                    </div>
                    <div>
                        <label htmlFor="club-abbr-login" className="block text-sm font-medium text-gray-300">Abreviação do Clube</label>
                        <input type="text" id="club-abbr-login" value={clubAbbr} onChange={(e) => setClubAbbr(e.target.value.toUpperCase())} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white" placeholder="ex: FLA"/>
                    </div>
                    <div>
                        <label htmlFor="club-password-login" className="block text-sm font-medium text-gray-300">Senha</label>
                        <input type="password" id="club-password-login" value={clubPassword} onChange={(e) => setClubPassword(e.target.value)} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"/>
                    </div>
                    <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">Entrar</button>
                </form>
             </div>
        )}
      </div>
    </div>
  );
};

export default AdminModal;