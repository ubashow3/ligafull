import React, { useState } from 'react';

interface CreateLeaguePageProps {
  onBack: () => void;
  onCreateLeague: (name: string, logoUrl: string, email: string, password: string, city: string, state: string) => void;
  isLoading: boolean;
}

const CreateLeaguePage: React.FC<CreateLeaguePageProps> = ({ onBack, onCreateLeague, isLoading }) => {
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (name.trim() && email.trim() && password.trim() && city.trim() && state.trim()) {
      onCreateLeague(name.trim(), logoUrl.trim(), email.trim(), password.trim(), city.trim(), state.trim());
    } else {
      alert('Todos os campos, exceto o logo, são obrigatórios.');
    }
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <button 
        onClick={onBack}
        disabled={isLoading}
        className="mb-6 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center transition-colors disabled:opacity-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Voltar
      </button>

      <div className="bg-gray-800 p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-white mb-6">Criar Nova Liga</h1>
        
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <fieldset disabled={isLoading}>
            <div>
                <label htmlFor="league-name" className="block text-sm font-medium text-gray-300">Nome da Liga</label>
                <input 
                  type="text" 
                  name="league-name" 
                  id="league-name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm disabled:opacity-50" 
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                  <label htmlFor="league-city" className="block text-sm font-medium text-gray-300">Cidade</label>
                  <input 
                    type="text" 
                    name="league-city" 
                    id="league-city" 
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm disabled:opacity-50" 
                  />
              </div>
              <div>
                  <label htmlFor="league-state" className="block text-sm font-medium text-gray-300">Estado (UF)</label>
                  <input 
                    type="text" 
                    name="league-state" 
                    id="league-state" 
                    maxLength={2}
                    value={state}
                    onChange={(e) => setState(e.target.value.toUpperCase())}
                    required
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm disabled:opacity-50" 
                    placeholder="Ex: SP"
                  />
              </div>
            </div>

             <div>
                <label htmlFor="admin-email" className="block text-sm font-medium text-gray-300">E-mail do Administrador</label>
                <input 
                  type="email" 
                  name="admin-email" 
                  id="admin-email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm disabled:opacity-50" 
                />
            </div>
            
            <div>
                <label htmlFor="league-password" className="block text-sm font-medium text-gray-300">Senha do Administrador</label>
                <input 
                  type="password" 
                  name="league-password" 
                  id="league-password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm disabled:opacity-50" 
                />
            </div>

            <div>
                <label htmlFor="league-logo" className="block text-sm font-medium text-gray-300">Logo da Liga (URL)</label>
                <input 
                  type="text" 
                  name="league-logo" 
                  id="league-logo" 
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm disabled:opacity-50" 
                  placeholder="https://exemplo.com/logo.png"
                />
            </div>
          </fieldset>
            <div className="flex justify-end gap-4 pt-4">
              <button 
                type="button" 
                onClick={onBack}
                disabled={isLoading}
                className="py-2 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
              >
                  Cancelar
              </button>
              <button 
                type="submit" 
                disabled={isLoading}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 flex items-center justify-center w-32 disabled:bg-gray-500 disabled:cursor-not-allowed"
              >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Criando...
                    </>
                  ) : (
                    'Criar Liga'
                  )}
              </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLeaguePage;