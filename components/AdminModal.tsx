import React, { useState } from 'react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToCreateLeague: () => void;
  onLogin: (email: string, password: string) => void;
}

const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, onNavigateToCreateLeague, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin(email, password);
    } else {
      alert('Por favor, preencha o e-mail e a senha.');
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
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Acesso do Administrador</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="admin-email-login" className="block text-sm font-medium text-gray-300">E-mail</label>
            <input 
              type="email" 
              id="admin-email-login"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="admin-password-login" className="block text-sm font-medium text-gray-300">Senha</label>
            <input 
              type="password" 
              id="admin-password-login"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Entrar
          </button>
        </form>
        <div className="text-center mt-4">
            <button 
                onClick={onNavigateToCreateLeague} 
                className="text-sm text-green-400 hover:underline"
            >
                Não tem uma liga? Crie uma agora.
            </button>
        </div>
      </div>
    </div>
  );
};

export default AdminModal;