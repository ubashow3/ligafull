import React, { useState, useEffect } from 'react';
import { League } from '../types';

interface HomePageProps {
  leagues: League[];
  onSelectLeague: (league: League) => void;
}

// Haversine formula to calculate distance between two points on Earth
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};


const HomePage: React.FC<HomePageProps> = ({ leagues, onSelectLeague }) => {
  const [sortedLeagues, setSortedLeagues] = useState<League[]>(leagues);
  const [locationStatus, setLocationStatus] = useState<'pending' | 'success' | 'error'>('pending');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const leaguesWithDistance = leagues.map(league => {
            if (league.latitude && league.longitude) {
              const distance = calculateDistance(latitude, longitude, league.latitude, league.longitude);
              return { ...league, distance };
            }
            return league;
          }).sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
          
          setSortedLeagues(leaguesWithDistance);
          setLocationStatus('success');
        },
        () => {
          // User denied permission or an error occurred
          setLocationStatus('error');
          setSortedLeagues(leagues);
        }
      );
    } else {
      // Geolocation not supported by the browser
      setLocationStatus('error');
      setSortedLeagues(leagues);
    }
  }, [leagues]);

  const renderStatusMessage = () => {
    switch(locationStatus) {
        case 'pending':
            return <p className="mt-2 text-sm text-gray-400">Buscando sua localização para ordenar as ligas...</p>;
        case 'error':
            return <p className="mt-2 text-sm text-yellow-400">Não foi possível obter sua localização. Exibindo em ordem padrão.</p>;
        case 'success':
            return <p className="mt-2 text-sm text-gray-400">Ligas ordenadas pela proximidade.</p>;
        default:
            return <p className="mt-2 text-sm text-gray-400">Para explorar mais ligas, clique no ícone de menu no canto superior esquerdo.</p>;
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-green-400">Bem-vindo</h1>
        {renderStatusMessage()}
      </div>
      
      <div className="space-y-6">
        {sortedLeagues.map(league => (
          <div 
            key={league.id} 
            className="bg-gray-800 rounded-lg shadow-lg overflow-hidden cursor-pointer group flex items-center transition-all duration-300 hover:bg-gray-700 hover:shadow-xl"
            onClick={() => onSelectLeague(league)}
          >
            <img src={league.logoUrl} alt={`${league.name} logo`} className="w-24 h-24 sm:w-32 sm:h-32 object-cover flex-shrink-0" />
            <div className="p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white group-hover:text-green-400 transition-colors duration-300">{league.name}</h2>
              <p className="text-gray-400 text-sm">{league.city && league.state ? `${league.city}, ${league.state}` : ''}</p>
              <div className="flex items-center gap-4 mt-2 text-sm sm:text-base text-gray-400">
                <span>{league.championships.length} campeonato(s) ativo(s)</span>
                {league.distance !== undefined && (
                    <span className="flex items-center gap-1 bg-gray-700 px-2 py-0.5 rounded-full text-xs">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                        {`~${league.distance.toFixed(0)} km`}
                    </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;