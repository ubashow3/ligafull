import React, { useState, useMemo, useEffect } from 'react';
import { Club, ChampionshipWizardConfig } from '../../types';

interface MatchGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  championshipClubs: Club[];
  onGenerateMatches: (config: ChampionshipWizardConfig) => void;
}

const MatchGenerationModal: React.FC<MatchGenerationModalProps> = ({ isOpen, onClose, championshipClubs: clubs, onGenerateMatches: onGenerate }) => {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<ChampionshipWizardConfig>({
    format: 'ROUND_ROBIN',
    turns: 1,
    playoffs: false,
    playoffTeamsPerGroup: 0,
    numGroups: 1,
    groupPlayType: 'WITHIN_GROUP',
  });

  useEffect(() => {
    // Reset state when modal is opened or clubs change
    if (isOpen) {
        // Smart default for playoff teams
        const defaultPlayoffTeams = clubs.length >= 6 ? 4 : (clubs.length >= 4 ? 2 : 0);
        setConfig({
            format: clubs.length >= 10 ? 'GROUP_STAGE' : 'ROUND_ROBIN',
            turns: 1,
            playoffs: defaultPlayoffTeams > 0,
            playoffTeamsPerGroup: defaultPlayoffTeams,
            numGroups: clubs.length >= 10 ? 2 : 1,
            groupPlayType: 'WITHIN_GROUP',
        });
        setStep(1);
    }
  }, [isOpen, clubs]);
  
  if (!isOpen) return null;

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handleChange = (field: keyof ChampionshipWizardConfig, value: any) => {
    setConfig(prev => {
        const newConfig = { ...prev, [field]: value };
        // If playoffs are turned off, zero out the playoff teams
        if (field === 'playoffs' && !value) {
            newConfig.playoffTeamsPerGroup = 0;
        }
        return newConfig;
    });
  };

  const reviewText = useMemo(() => {
    const formatText = config.format === 'ROUND_ROBIN' ? 'Pontos Corridos' : 'Fase de Grupos';
    const turnsText = config.turns === 1 ? 'Turno Único (Apenas Ida)' : 'Dois Turnos (Ida e Volta)';
    let playoffText = 'Sem fase de mata-mata.';
    if (config.playoffs && config.playoffTeamsPerGroup > 0) {
        const stage = config.playoffTeamsPerGroup === 2 ? 'Final' : config.playoffTeamsPerGroup === 4 ? 'Semifinais' : `Quartas de Final`;
        playoffText = `Classificam-se ${config.playoffTeamsPerGroup} times para a fase de ${stage}.`;
    }
    return { formatText, turnsText, playoffText };
  }, [config]);

  const renderStep = () => {
    switch (step) {
      case 1: // Format
        return (
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">1. Formato da Fase Inicial</h3>
            <p className="text-sm text-gray-400 mb-4">Como os times se enfrentarão na primeira fase?</p>
            <div className="space-y-3">
                <div onClick={() => handleChange('format', 'ROUND_ROBIN')} className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${config.format === 'ROUND_ROBIN' ? 'border-green-500 bg-green-500/10' : 'border-gray-600 bg-gray-700/50 hover:border-green-400'}`}>
                    <input type="radio" name="format" value="ROUND_ROBIN" checked={config.format === 'ROUND_ROBIN'} readOnly className="w-4 h-4 text-green-600 bg-gray-700 border-gray-500 focus:ring-green-500"/>
                    <label className="ml-3 font-bold text-white">Pontos Corridos</label>
                    <p className="text-xs text-gray-400 ml-7">Todos os times se enfrentam no mesmo grupo.</p>
                </div>
                <div onClick={() => clubs.length >= 10 && handleChange('format', 'GROUP_STAGE')} className={`p-3 rounded-lg border-2 transition-all ${clubs.length < 10 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${config.format === 'GROUP_STAGE' ? 'border-green-500 bg-green-500/10' : 'border-gray-600 bg-gray-700/50 hover:border-green-400'}`}>
                    <input type="radio" name="format" value="GROUP_STAGE" checked={config.format === 'GROUP_STAGE'} readOnly disabled={clubs.length < 10} className="w-4 h-4 text-green-600 bg-gray-700 border-gray-500 focus:ring-green-500"/>
                    <label className="ml-3 font-bold text-white">Fase de Grupos</label>
                    <p className="text-xs text-gray-400 ml-7">Os times serão divididos em 2 grupos e jogarão um grupo contra o outro.</p>
                    {clubs.length < 10 && <p className="text-xs text-red-400 mt-1 ml-7">Requer no mínimo 10 clubes.</p>}
                </div>
            </div>
          </div>
        );
      case 2: // Turns & Playoffs
        return (
            <div>
                <h3 className="text-lg font-semibold text-white mb-2">2. Turnos e Fase Final</h3>
                <p className="text-sm text-gray-400 mb-4">Defina o número de turnos e se haverá mata-mata.</p>
                <div className="space-y-4">
                    <div>
                        <label className="font-medium text-gray-300">Turnos da fase inicial:</label>
                        <select value={config.turns} onChange={(e) => handleChange('turns', parseInt(e.target.value))} className="mt-1 w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
                            <option value={1}>1 Turno (Apenas Ida)</option>
                            <option value={2}>2 Turnos (Ida e Volta)</option>
                        </select>
                    </div>
                     <div>
                        <div className="flex items-center">
                           <input type="checkbox" id="playoffs" checked={config.playoffs} onChange={(e) => handleChange('playoffs', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"/>
                           <label htmlFor="playoffs" className="ml-2 block text-sm font-medium text-gray-300">Haverá fase de mata-mata (playoffs)?</label>
                        </div>
                    </div>
                    {config.playoffs && (
                        <div className="animate-fade-in-down">
                            <label className="font-medium text-gray-300">Quantos times se classificam para o mata-mata?</label>
                            <select value={config.playoffTeamsPerGroup} onChange={(e) => handleChange('playoffTeamsPerGroup', parseInt(e.target.value))} className="mt-1 w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
                                <option value={2}>2 (Final)</option>
                                <option value={4}>4 (Semifinais)</option>
                                <option value={8} disabled={clubs.length < 8}>8 (Quartas de Final)</option>
                            </select>
                        </div>
                    )}
                </div>
            </div>
        );
     case 3: // Review
        return (
             <div>
                <h3 className="text-lg font-semibold text-white mb-2">3. Revisão</h3>
                <p className="text-sm text-gray-400 mb-4">Confirme a estrutura do seu campeonato. Esta ação gerará todos os jogos e não poderá ser desfeita facilmente.</p>
                <div className="bg-gray-900/50 p-4 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-400">Formato:</span><span className="font-bold text-white">{reviewText.formatText}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Turnos:</span><span className="font-bold text-white">{reviewText.turnsText}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Fase Final:</span><span className="font-bold text-white">{reviewText.playoffText}</span></div>
                </div>
            </div>
        );
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Assistente de Criação de Tabela</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>
        
        <div className="min-h-[200px]">
          {renderStep()}
        </div>

        <div className="flex justify-between items-center mt-8">
            <div>
                {step > 1 && (
                    <button onClick={handleBack} className="text-gray-300 hover:text-white font-bold py-2 px-4 rounded-lg">
                        Voltar
                    </button>
                )}
            </div>
            <div>
                {step < 3 && (
                     <button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                        Próximo
                    </button>
                )}
                {step === 3 && (
                    <button onClick={() => onGenerate(config)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">
                        Gerar Tabela
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default MatchGenerationModal;