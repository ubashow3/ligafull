import React from 'react';

interface HeaderProps {
  onTitleClick?: () => void;
  onAdminClick?: () => void;
  onMenuClick?: () => void;
  isAdminMode?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onTitleClick, onAdminClick, onMenuClick, isAdminMode }) => {
  return (
    <header className="bg-gray-800 shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          {!isAdminMode && (
            <button 
              onClick={onMenuClick} 
              className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
              aria-label="Menu de Ligas"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          <div 
            className="text-2xl sm:text-3xl font-bold text-white tracking-tight cursor-pointer flex items-center gap-2"
            onClick={onTitleClick}
          >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-green-400">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L8 12v1c0 1.1.9 2 2 2v1.93zm6.9-2.53c-.25.58-.56 1.12-.9 1.6l-2.6-2.6V12c0-1.1-.9-2-2-2h-1L6.3 5.47c.59-.34 1.23-.6 1.9-.77v1.3c0 .55.45 1 1 1h2c.55 0 1-.45 1-1V5.07c3.5.63 6.15 3.58 6.15 7.13 0 .79-.14 1.56-.39 2.27z" fill="currentColor"/>
              </svg>
            <h1><span className="text-green-400">Liga</span>Full</h1>
          </div>
        </div>

        <button 
          onClick={onAdminClick} 
          className={`p-2 rounded-full transition-colors duration-300 ${isAdminMode ? 'bg-green-500/20 text-green-400' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
          aria-label="Configurações de Administrador"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;