import React from 'react';
import { League } from '../types';

interface HomePageProps {
  leagues: League[];
  onSelectLeague: (league: League) => void;
}

const HomePage: React.FC<HomePageProps> = ({ leagues, onSelectLeague }) => {

  if (leagues.length === 0) {
    return (
      <div className="text-center py-20">
        <h1 className="text-4xl md:text-5xl font-extrabold text-green-400">Bem-vindo ao LigaFull</h1>
        <p className="mt-4 text-gray-400">Nenhuma liga encontrada.</p>
        <p className="text-sm text-gray-500">Administradores podem criar uma nova liga clicando no ícone de configurações.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-green-400">Ligas Disponíveis</h1>
         <p className="mt-2 text-sm text-gray-400">Para explorar mais ligas, clique no ícone de menu no canto superior esquerdo.</p>
      </div>
      
      <div className="space-y-6">
        {leagues.map(league => (
          <div 
            key={league.id} 
            className="bg-gray-800 rounded-lg shadow-lg overflow-hidden cursor-pointer group flex items-center transition-all duration-300 hover:bg-gray-700 hover:shadow-xl"
            onClick={() => onSelectLeague(league)}
          >
            <img src={league.logoUrl} alt={`${league.name} logo`} className="w-24 h-24 sm:w-32 sm:h-32 object-cover flex-shrink-0" />
            <div className="p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white group-hover:text-green-400 transition-colors duration-300">{league.name}</h2>
              <p className="text-gray-400 text-sm">{league.city && league.state ? `${league.city}, ${league.state}` : 'Local não informado'}</p>
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
