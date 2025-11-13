import React, { useState, useEffect } from 'react';

// Interfaces for IBGE API data
interface Estado {
  id: number;
  sigla: string;
  nome: string;
}

interface Cidade {
  id: number;
  nome: string;
}


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
  
  // State for location dropdowns
  const [estados, setEstados] = useState<Estado[]>([]);
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [selectedEstado, setSelectedEstado] = useState(''); // Stores state abbreviation (e.g., 'SP')
  const [selectedCidade, setSelectedCidade] = useState('');
  
  const [loadingEstados, setLoadingEstados] = useState(true);
  const [loadingCidades, setLoadingCidades] = useState(false);


  // Fetch states on component mount
  useEffect(() => {
    const fetchEstados = async () => {
      try {
        setLoadingEstados(true);
        const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
        if (!response.ok) throw new Error('Failed to fetch states');
        const data: Estado[] = await response.json();
        setEstados(data);
      } catch (error) {
        console.error("Error fetching states:", error);
        alert("Não foi possível carregar a lista de estados. Tente novamente.");
      } finally {
        setLoadingEstados(false);
      }
    };
    fetchEstados();
  }, []);

  // Fetch cities when a state is selected
  useEffect(() => {
    if (!selectedEstado) {
      setCidades([]);
      setSelectedCidade('');
      return;
    }

    const fetchCidades = async () => {
      try {
        setLoadingCidades(true);
        const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedEstado}/municipios`);
        if (!response.ok) throw new Error('Failed to fetch cities');
        const data: Cidade[] = await response.json();
        setCidades(data);
      } catch (error) {
        console.error("Error fetching cities:", error);
        alert("Não foi possível carregar a lista de cidades. Tente novamente.");
      } finally {
        setLoadingCidades(false);
      }
    };
    
    fetchCidades();
  }, [selectedEstado]);

  const handleEstadoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedEstado(e.target.value);
    setSelectedCidade(''); // Reset city selection
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (name.trim() && email.trim() && password.trim() && selectedCidade && selectedEstado) {
      onCreateLeague(name.trim(), logoUrl.trim(), email.trim(), password.trim(), selectedCidade, selectedEstado);
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
                  <label htmlFor="league-state" className="block text-sm font-medium text-gray-300">Estado</label>
                  <select 
                    id="league-state" 
                    name="league-state"
                    value={selectedEstado}
                    onChange={handleEstadoChange}
                    required
                    disabled={loadingEstados || isLoading}
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm disabled:opacity-50"
                  >
                    <option value="" disabled>{loadingEstados ? 'Carregando...' : 'Selecione um estado'}</option>
                    {estados.map(estado => (
                      <option key={estado.id} value={estado.sigla}>{estado.nome}</option>
                    ))}
                  </select>
              </div>
              <div>
                  <label htmlFor="league-city" className="block text-sm font-medium text-gray-300">Cidade</label>
                  <select 
                    id="league-city" 
                    name="league-city"
                    value={selectedCidade}
                    onChange={(e) => setSelectedCidade(e.target.value)}
                    required
                    disabled={!selectedEstado || loadingCidades || isLoading}
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm disabled:opacity-50"
                  >
                     <option value="" disabled>{loadingCidades ? 'Carregando cidades...' : (selectedEstado ? 'Selecione uma cidade' : 'Escolha um estado primeiro')}</option>
                    {cidades.map(cidade => (
                      <option key={cidade.id} value={cidade.nome}>{cidade.nome}</option>
                    ))}
                  </select>
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
