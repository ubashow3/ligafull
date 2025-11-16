

import React, { useState, useEffect, useMemo } from 'react';
import { League } from '../types';

interface IBGEState {
  id: number;
  sigla: string;
  nome: string;
}

interface IBGECity {
  id: number;
  nome: string;
}

interface HomePageProps {
  leagues: League[];
  onSelectLeague: (league: League) => void;
}

const StarIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className}`} viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);


const HomePage: React.FC<HomePageProps> = ({ leagues, onSelectLeague }) => {
  const [states, setStates] = useState<IBGEState[]>([]);
  const [cities, setCities] = useState<IBGECity[]>([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [favoriteLeagueId, setFavoriteLeagueId] = useState<string | null>(null);

  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(res => res.json())
      .then(setStates);
    setFavoriteLeagueId(localStorage.getItem('favoriteLeagueId'));
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

  const filteredLeagues = useMemo(() => {
    let sortedLeagues = [...leagues];
    if (favoriteLeagueId) {
        const favoriteIndex = sortedLeagues.findIndex(l => l.id === favoriteLeagueId);
        if (favoriteIndex > -1) {
            const [favoriteLeague] = sortedLeagues.splice(favoriteIndex, 1);
            sortedLeagues.unshift(favoriteLeague);
        }
    }

    return sortedLeagues.filter(league => {
      const stateMatch = !selectedState || league.state === selectedState;
      const cityMatch = !selectedCity || league.city === selectedCity;
      return stateMatch && cityMatch;
    });
  }, [leagues, selectedState, selectedCity, favoriteLeagueId]);

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-green-400">Bem-vindo ao Liga Full</h1>
        <p className="mt-2 text-lg text-gray-300">Sua plataforma para gerenciamento de campeonatos de futebol.</p>
      </div>

      <div className="max-w-4xl mx-auto mb-8 p-4 bg-gray-800/50 rounded-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                  <label htmlFor="state-filter" className="block text-sm font-medium text-gray-300 mb-1">Filtrar por Estado</label>
                  <select
                      id="state-filter"
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"
                  >
                      <option value="">Todos os Estados</option>
                      {states.map(state => <option key={state.id} value={state.sigla}>{state.nome}</option>)}
                  </select>
              </div>
              <div>
                  <label htmlFor="city-filter" className="block text-sm font-medium text-gray-300 mb-1">Filtrar por Cidade</label>
                  <select
                      id="city-filter"
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      disabled={!selectedState}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white disabled:opacity-50"
                  >
                      <option value="">Todos as Cidades</option>
                      {cities.map(city => <option key={city.id} value={city.nome}>{city.nome}</option>)}
                  </select>
              </div>
          </div>
      </div>


      <div className="space-y-6 max-w-4xl mx-auto">
        {filteredLeagues.length === 0 ? (
          <div className="text-center py-10 px-6 bg-gray-800 rounded-lg">
            <h3 className="text-xl font-semibold text-white">Nenhuma liga encontrada.</h3>
            <p className="text-gray-400 mt-2">
              Tente remover os filtros ou crie uma nova liga clicando no ícone de engrenagem no canto superior direito.
            </p>
          </div>
        ) : (
          filteredLeagues.map(league => (
            <div 
              key={league.id} 
              className="bg-gray-800 rounded-lg shadow-lg overflow-hidden cursor-pointer group flex items-center transition-all duration-300 hover:bg-gray-700 hover:shadow-xl"
              onClick={() => onSelectLeague(league)}
            >
              <img src={league.logoUrl} alt={`${league.name} logo`} className="w-24 h-24 sm:w-32 sm:h-32 object-cover flex-shrink-0" />
              <div className="p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white group-hover:text-green-400 transition-colors duration-300 flex items-center gap-2">
                    {league.name}
                    {league.id === favoriteLeagueId && <StarIcon className="text-yellow-400" />}
                </h2>
                <div className="flex items-center gap-4 mt-2 text-sm sm:text-base text-gray-400">
                    <span>{league.city}, {league.state}</span>
                    <span>&bull;</span>
                    <span>{league.championships.length} campeonato(s)</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HomePage;