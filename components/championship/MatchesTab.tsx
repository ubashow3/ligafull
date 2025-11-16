

import React, { useState, useMemo } from 'react';
// FIX: Import ChampionshipWizardConfig and remove unused ChampionshipFormat.
import { Match, Club, ChampionshipWizardConfig } from '../../types';
import MatchGenerationModal from './MatchGenerationModal';

interface MatchesTabProps {
  matches: Match[];
  isAdminMode: boolean;
  onSelectMatch: (match: Match) => void;
  // FIX: Updated prop to use ChampionshipWizardConfig for consistency.
  onGenerateMatches: (config: ChampionshipWizardConfig) => void;
  clubs: Club[];
}

const MatchesTab: React.FC<MatchesTabProps> = ({ matches, isAdminMode, onSelectMatch, onGenerateMatches, clubs }) => {
  const [isGenerationModalOpen, setIsGenerationModalOpen] = useState(false);
  
  const totalRounds = useMemo(() => {
    return matches.reduce((max, match) => match.round > max ? match.round : max, 0);
  }, [matches]);

  const [currentRound, setCurrentRound] = useState(1);
  
  const statusInfo = {
    scheduled: { text: 'Agendado', color: 'bg-blue-500/20 text-blue-300' },
    in_progress: { text: 'Em Andamento', color: 'bg-yellow-500/20 text-yellow-300' },
    finished: { text: 'Finalizado', color: 'bg-green-500/20 text-green-300' },
  };

  const handleNextRound = () => {
    if (currentRound < totalRounds) {
      setCurrentRound(currentRound + 1);
    }
  };

  const handlePrevRound = () => {
    if (currentRound > 1) {
      setCurrentRound(currentRound - 1);
    }
  };
  
  const filteredMatches = useMemo(() => {
    return matches.filter(match => match.round === currentRound);
  }, [matches, currentRound]);
  
  const formatMatchDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const dayOfWeek = date.toLocaleDateString('pt-BR', { weekday: 'long' });
    const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${day} • ${dayOfWeek.split('-')[0]} • ${time}`;
  };

  return (
    <div className="animate-fade-in">
      <MatchGenerationModal 
        isOpen={isGenerationModalOpen}
        onClose={() => setIsGenerationModalOpen(false)}
        championshipClubs={clubs}
        onGenerateMatches={(config) => {
            onGenerateMatches(config);
            setIsGenerationModalOpen(false);
        }}
      />
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">JOGOS</h2>
      
      {isAdminMode && matches.length === 0 && clubs.length >= 2 && (
        <div className="bg-gray-800 p-4 rounded-lg mb-6 text-center">
            <h3 className="font-bold text-lg text-white mb-2">Construir Tabela de Jogos</h3>
            <p className="text-gray-400 text-sm mb-4">Escolha um formato para gerar o calendário de partidas para os {clubs.length} clubes inscritos.</p>
             <button
                onClick={() => setIsGenerationModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center transition-colors"
              >
                Construir Tabela de Jogos
            </button>
        </div>
      )}

      {matches.length > 0 && (
         <div className="flex items-center justify-between mb-4">
          <button onClick={handlePrevRound} disabled={currentRound === 1} className="p-2 rounded-full disabled:opacity-30 hover:bg-gray-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h3 className="text-xl font-bold text-white tracking-wider">{currentRound}ª RODADA</h3>
          <button onClick={handleNextRound} disabled={currentRound === totalRounds} className="p-2 rounded-full disabled:opacity-30 hover:bg-gray-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}
      
      {matches.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
            Nenhuma partida agendada.
            {isAdminMode && clubs.length < 2 && " Adicione pelo menos 2 clubes para gerar os jogos."}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map(match => (
            <div key={match.id} className="bg-gray-700/50 rounded-lg p-4">
              <div className="text-center text-xs text-gray-400 mb-3">
                <p>{match.location}</p>
                <p>{formatMatchDateTime(match.date)}</p>
                <div className="mt-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusInfo[match.status].color}`}>
                        {statusInfo[match.status].text}
                    </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col items-center text-center w-2/5">
                  <img src={match.homeTeam.logoUrl} alt={match.homeTeam.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full mb-2 object-cover" />
                  <span className="font-bold text-sm sm:text-base text-white">{match.homeTeam.name}</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-white text-center">
                  {match.homeScore != null && match.awayScore != null ? `${match.homeScore} x ${match.awayScore}` : 'x'}
                </div>
                <div className="flex flex-col items-center text-center w-2/5">
                  <img src={match.awayTeam.logoUrl} alt={match.awayTeam.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full mb-2 object-cover" />
                  <span className="font-bold text-sm sm:text-base text-white">{match.awayTeam.name}</span>
                </div>
              </div>
              <div className="text-center mt-4">
                 <button 
                    onClick={() => onSelectMatch(match)}
                    className="text-sm bg-gray-600 hover:bg-gray-500 text-green-400 font-semibold py-1 px-3 rounded-full transition-colors"
                >
                    Súmula do Jogo
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MatchesTab;