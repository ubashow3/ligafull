import React, { useState } from 'react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToCreateLeague: () => void;
  onLogin: (email: string, password: string) => void;
}

const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, onNavigateToCreateLeague, onLogin }) => {
  const [leagueEmail, setLeagueEmail] = useState('');
  const [leaguePassword, setLeaguePassword] = useState('');

  if (!isOpen) return null;

  const handleLeagueLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (leagueEmail && leaguePassword) {
      onLogin(leagueEmail, leaguePassword);
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
            <h2 className="text-xl font-bold text-white">Área Restrita da Liga</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>

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
      </div>
    </div>
  );
};

export default AdminModal;