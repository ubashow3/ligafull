import React, { useState, useEffect, useMemo } from 'react';
import { League } from '../types';

interface Estado {
  id: number;
  sigla: string;
  nome: string;
}

interface Cidade {
  id: number;
  nome: string;
}

interface HomePageProps {
  leagues: League[];
  onSelectLeague: (league: League) => void;
}

const HomePage: React.FC<HomePageProps> = ({ leagues, onSelectLeague }) => {
  const [estados, setEstados] = useState<Estado[]>([]);
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [selectedEstado, setSelectedEstado] = useState(''); // Stores state abbreviation (e.g., 'SP')
  const [selectedCidade, setSelectedCidade] = useState('');
  
  const [loadingEstados, setLoadingEstados] = useState(true);
  const [loadingCidades, setLoadingCidades] = useState(false);

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
      } finally {
        setLoadingEstados(false);
      }
    };
    fetchEstados();
  }, []);

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
      } finally {
        setLoadingCidades(false);
      }
    };
    fetchCidades();
  }, [selectedEstado]);
  
  const filteredLeagues = useMemo(() => {
      if (!selectedEstado) return [];
      if (!selectedCidade) {
          return leagues.filter(l => l.state === selectedEstado);
      }
      return leagues.filter(l => l.state === selectedEstado && l.city === selectedCidade);
  }, [leagues, selectedEstado, selectedCidade]);

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-green-400">Encontre sua Liga</h1>
        <p className="mt-2 text-sm text-gray-400">Selecione um estado e uma cidade para ver as ligas disponíveis.</p>
      </div>

      {/* Filters */}
      <div className="max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          <div>
              <label htmlFor="league-state-filter" className="block text-sm font-medium text-gray-300">Estado</label>
              <select 
                id="league-state-filter" 
                value={selectedEstado}
                onChange={(e) => { setSelectedEstado(e.target.value); setSelectedCidade(''); }}
                disabled={loadingEstados}
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="" disabled>{loadingEstados ? 'Carregando...' : 'Selecione um estado'}</option>
                {estados.map(estado => (
                  <option key={estado.id} value={estado.sigla}>{estado.nome}</option>
                ))}
              </select>
          </div>
          <div>
              <label htmlFor="league-city-filter" className="block text-sm font-medium text-gray-300">Cidade</label>
              <select 
                id="league-city-filter" 
                value={selectedCidade}
                onChange={(e) => setSelectedCidade(e.target.value)}
                disabled={!selectedEstado || loadingCidades}
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                 <option value="">{loadingCidades ? 'Carregando...' : (selectedEstado ? 'Todas as cidades' : 'Escolha um estado')}</option>
                {cidades.map(cidade => (
                  <option key={cidade.id} value={cidade.nome}>{cidade.nome}</option>
                ))}
              </select>
          </div>
      </div>
      
      {/* Leagues List */}
      <div className="space-y-6">
        {selectedEstado && filteredLeagues.length === 0 && (
            <div className="text-center py-10 text-gray-400">
                <p>Nenhuma liga encontrada para a localidade selecionada.</p>
                <p className="text-sm text-gray-500 mt-1">Administradores podem criar uma nova liga clicando no ícone de configurações.</p>
            </div>
        )}
        {filteredLeagues.map(league => (
          <div 
            key={league.id} 
            className="bg-gray-800 rounded-lg shadow-lg overflow-hidden cursor-pointer group flex items-center transition-all duration-300 hover:bg-gray-700 hover:shadow-xl"
            onClick={() => onSelectLeague(league)}
          >
            <img src={league.logoUrl} alt={`${league.name} logo`} className="w-24 h-24 sm:w-32 sm:h-32 object-cover flex-shrink-0" />
            <div className="p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white group-hover:text-green-400 transition-colors duration-300">{league.name}</h2>
              <p className="text-gray-400 text-sm">{league.city}, {league.state}</p>
              <div className="flex items-center gap-4 mt-2 text-sm sm:text-base text-gray-400">
                <span>{league.championships.length} campeonato(s) ativo(s)</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;