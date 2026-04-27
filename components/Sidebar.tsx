
import React from 'react';
import { League } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  leagues: League[];
  onSelectLeague: (league: League) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, leagues, onSelectLeague }) => {
  if (!isOpen) return null;

  const handleLeagueClick = (e: React.MouseEvent, league: League) => {
    e.preventDefault();
    onSelectLeague(league);
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${isOpen ? 'bg-black bg-opacity-75' : 'bg-transparent pointer-events-none'}`}
      onClick={onClose}
      aria-hidden={!isOpen}
    >
      <div
        className={`fixed top-0 left-0 h-full bg-gray-800 w-72 shadow-xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sidebar-title"
      >
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 id="sidebar-title" className="text-xl font-bold text-white">Ligas Disponíveis</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Fechar menu">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <nav className="p-4 flex flex-col h-[calc(100%-64px)]">
          <ul className="space-y-2 flex-grow overflow-y-auto no-scrollbar">
            {leagues.map(league => (
              <li key={league.id}>
                <a
                  href={`#/league/${league.slug}`}
                  onClick={(e) => handleLeagueClick(e, league)}
                  className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <img src={league.logoUrl || undefined} alt={league.name} className="w-8 h-8 rounded-full mr-3 object-cover flex-shrink-0" />
                  <span className="text-white font-medium">{league.name}</span>
                </a>
              </li>
            ))}
          </ul>

          {/* Ad Space in Sidebar */}
          <div className="mt-auto p-4 bg-gray-900 rounded-xl border border-gray-700">
             <span className="text-[8px] text-gray-500 font-bold uppercase block mb-2">Espaço Patrocinado</span>
             <img src="https://logodownload.org/wp-content/uploads/2014/07/adidas-logo-0.png" className="w-12 mx-auto filter grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer" alt="Adidas" />
             <p className="text-[10px] text-gray-400 text-center mt-2 font-medium">Equipamento profissional para sua liga.</p>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
