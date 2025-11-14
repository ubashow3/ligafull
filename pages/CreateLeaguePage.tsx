

import React, { useState, useEffect } from 'react';
import * as leagueService from '../services/leagueService';

interface IBGEState {
  id: number;
  sigla: string;
  nome: string;
}

interface IBGECity {
  id: number;
  nome: string;
}

interface CreateLeaguePageProps {
  onBack: () => void;
  onCreateLeague: (name: string, logoUrl: string, email: string, password: string, state: string, city: string) => void;
  isLoading: boolean;
}

const CreateLeaguePage: React.FC<CreateLeaguePageProps> = ({ onBack, onCreateLeague, isLoading }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [states, setStates] = useState<IBGEState[]>([]);
  const [cities, setCities] = useState<IBGECity[]>([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(res => res.json())
      .then(setStates);
  }, []);

  useEffect(() => {
    if (selectedState) {
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedState}/municipios`)
        .then(res => res.json())
        .then(setCities);
    } else {
      setCities([]);
    }
    setSelectedCity('');
  }, [selectedState]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setLogoFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setLogoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    } else {
        setLogoFile(null);
        setLogoPreview('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!name.trim() || !email.trim() || !password.trim() || !selectedState || !selectedCity) {
      alert('Todos os campos, exceto o logo, são obrigatórios.');
      return;
    }
    
    let uploadedLogoUrl = '';
    if (logoFile) {
        try {
            uploadedLogoUrl = await leagueService.uploadImage(logoFile);
        } catch (error) {
            alert(`Erro ao fazer upload do logo: ${(error as Error).message}`);
            return; 
        }
    }

    onCreateLeague(name.trim(), uploadedLogoUrl, email.trim(), password.trim(), selectedState, selectedCity);
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
                <input type="text" name="league-name" id="league-name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm disabled:opacity-50" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-300">Estado</label>
                    <select id="state" value={selectedState} onChange={e => setSelectedState(e.target.value)} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm disabled:opacity-50">
                        <option value="" disabled>Selecione o Estado</option>
                        {states.map(state => <option key={state.id} value={state.sigla}>{state.nome}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-300">Cidade</label>
                    <select id="city" value={selectedCity} onChange={e => setSelectedCity(e.target.value)} required disabled={!selectedState} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm disabled:opacity-50">
                        <option value="" disabled>Selecione a Cidade</option>
                        {cities.map(city => <option key={city.id} value={city.nome}>{city.nome}</option>)}
                    </select>
                </div>
            </div>

            <div>
                <label htmlFor="admin-email" className="block text-sm font-medium text-gray-300">E-mail do Administrador</label>
                <input type="email" name="admin-email" id="admin-email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm disabled:opacity-50" />
            </div>
            
            <div>
                <label htmlFor="league-password" className="block text-sm font-medium text-gray-300">Senha do Administrador</label>
                <input type="password" name="league-password" id="league-password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm disabled:opacity-50" />
            </div>
            
            <div>
                <label htmlFor="league-logo-file" className="block text-sm font-medium text-gray-300">Logo da Liga</label>
                <div className="mt-1 flex items-center gap-4">
                    {logoPreview ? (
                        <img src={logoPreview} alt="Prévia do logo" className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                    )}
                    <input 
                        type="file" 
                        name="league-logo-file" 
                        id="league-logo-file" 
                        onChange={handleFileChange} 
                        accept="image/png, image/jpeg, image/webp"
                        className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-600/20 file:text-green-300 hover:file:bg-green-600/30 disabled:opacity-50"
                    />
                </div>
            </div>

          </fieldset>
            <div className="flex justify-end gap-4 pt-4">
              <button type="button" onClick={onBack} disabled={isLoading} className="py-2 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50">
                  Cancelar
              </button>
              <button type="submit" disabled={isLoading} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 flex items-center justify-center w-32 disabled:bg-gray-500 disabled:cursor-not-allowed">
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24">
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