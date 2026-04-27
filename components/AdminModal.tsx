import React, { useState } from 'react';
import { UserProfile } from '../types';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToCreateLeague: () => void;
  onLogin: (email: string, pass: string) => void;
  user: UserProfile | null;
}

const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, onNavigateToCreateLeague, onLogin, user }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'create'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate-fade-in backdrop-blur-sm" 
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md mx-4 border border-gray-700" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-white italic tracking-tighter">
                PANEL <span className="text-green-500">ADMIN</span>
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-gray-700/50 p-2 rounded-full">&times;</button>
        </div>

        <div className="flex p-1 bg-gray-900 rounded-xl mb-6">
            <button 
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${activeTab === 'login' ? 'bg-gray-800 text-green-400 shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
                ENTRAR
            </button>
            <button 
                onClick={() => setActiveTab('create')}
                className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${activeTab === 'create' ? 'bg-gray-800 text-green-400 shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
                CRIAR LIGA
            </button>
        </div>

        {activeTab === 'login' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 ml-1">E-mail Administrativo</label>
                    <input 
                        type="email" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-green-500 transition-colors"
                        placeholder="admin@liga.com"
                        required
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 ml-1">Senha de Acesso</label>
                    <input 
                        type="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-green-500 transition-colors"
                        placeholder="••••••••"
                        required
                    />
                </div>
                <button 
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-green-900/20 active:scale-95"
                >
                    ENTRAR NO PAINEL
                </button>
                <p className="text-[10px] text-gray-500 text-center font-bold">Acesso restrito para administradores de ligas.</p>
            </form>
        ) : (
            <div className="space-y-4 text-gray-300">
                <div className="bg-gray-900 rounded-xl p-5 border border-gray-700/50">
                    <p className="text-sm leading-relaxed mb-4">Inicie sua jornada no futebol digital. Crie sua liga, organize campeonatos e conecte clubes e jogadores em uma experiência profissional.</p>
                    <div className="flex items-center gap-3 bg-yellow-400/5 border border-yellow-400/10 p-3 rounded-lg">
                        <span className="text-lg">⚡</span>
                        <p className="text-[10px] text-yellow-400 font-bold uppercase leading-tight">Configuração instantânea e ferramentas completas inclusas.</p>
                    </div>
                </div>
                <button 
                  onClick={onNavigateToCreateLeague} 
                  className="w-full bg-white text-black hover:bg-gray-200 font-black py-4 rounded-xl transition-all shadow-xl active:scale-95"
                >
                  SIM, CRIAR MINHA LIGA
                </button>
                <button 
                  onClick={() => setActiveTab('login')} 
                  className="w-full text-gray-500 hover:text-gray-300 font-bold text-sm transition-colors py-2"
                >
                  Já tenho uma liga, quero entrar
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminModal;