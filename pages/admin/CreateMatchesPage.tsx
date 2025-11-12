import React, { useState, useMemo, useEffect } from 'react';
import { Championship, ChampionshipWizardConfig } from '../../types';

interface CreateMatchesPageProps {
  championship: Championship;
  onBack: () => void;
  onGenerateMatches: (config: ChampionshipWizardConfig) => void;
}

const CreateMatchesPage: React.FC<CreateMatchesPageProps> = ({ championship, onBack, onGenerateMatches }) => {
  const { clubs } = championship;
  const [config, setConfig] = useState<ChampionshipWizardConfig>({
    format: 'ROUND_ROBIN',
    turns: 1,
    playoffs: false,
    numGroups: 1,
    playoffTeamsPerGroup: 0,
    groupPlayType: 'WITHIN_GROUP',
  });

  useEffect(() => {
    const numClubs = clubs.length;
    const defaultPlayoffTeams = numClubs >= 6 ? 4 : (numClubs >= 4 ? 2 : 0);
    const isGroupStage = numClubs >= 4; 
    
    setConfig({
        format: isGroupStage ? 'GROUP_STAGE' : 'ROUND_ROBIN',
        turns: 1,
        playoffs: defaultPlayoffTeams > 0,
        numGroups: isGroupStage ? 2 : 1,
        playoffTeamsPerGroup: isGroupStage ? (defaultPlayoffTeams/2) : defaultPlayoffTeams,
        groupPlayType: 'WITHIN_GROUP',
    });
  }, [clubs]);

  const handleChange = (field: keyof ChampionshipWizardConfig, value: any) => {
    setConfig(prev => {
        const newConfig = { ...prev, [field]: value };
        
        if (field === 'format') {
            if (value === 'ROUND_ROBIN') {
                newConfig.numGroups = 1;
                newConfig.groupPlayType = 'WITHIN_GROUP';
                newConfig.playoffTeamsPerGroup = newConfig.playoffs ? (clubs.length >= 6 ? 4 : 2) : 0;
            } else { // GROUP_STAGE
                newConfig.numGroups = 2;
                newConfig.playoffTeamsPerGroup = newConfig.playoffs ? 2 : 0;
            }
        }
        
        if (field === 'numGroups' && newConfig.format === 'GROUP_STAGE') {
             if (value < 2) newConfig.groupPlayType = 'WITHIN_GROUP';
        }

        if (field === 'playoffs' && value) {
            if (newConfig.format === 'ROUND_ROBIN') {
                newConfig.playoffTeamsPerGroup = clubs.length >= 6 ? 4 : 2;
            } else {
                newConfig.playoffTeamsPerGroup = 2;
            }
        } else if (field === 'playoffs' && !value) {
            newConfig.playoffTeamsPerGroup = 0;
        }
        
        const teamsPerGroup = Math.ceil(clubs.length / newConfig.numGroups);
        if (newConfig.playoffTeamsPerGroup > teamsPerGroup) {
            newConfig.playoffTeamsPerGroup = teamsPerGroup;
        }

        return newConfig;
    });
  };

  const previewData = useMemo(() => {
    const numClubs = clubs.length;
    let initialPhaseGames = 0;
    let formatText = 'Pontos Corridos';
    
    if (config.format === 'ROUND_ROBIN') {
        const teams = numClubs % 2 === 0 ? numClubs : numClubs + 1;
        const numRounds = teams - 1;
        initialPhaseGames = (numRounds * (teams / 2)) * config.turns;
    } else { // GROUP_STAGE
        formatText = `${config.numGroups} Grupos`;
        const groups: number[] = Array.from({ length: config.numGroups }, () => 0);
        for (let i = 0; i < numClubs; i++) {
            groups[i % config.numGroups]++;
        }

        if (config.groupPlayType === 'WITHIN_GROUP') {
            groups.forEach(teamsInGroup => {
                if (teamsInGroup > 1) {
                    const teams = teamsInGroup % 2 === 0 ? teamsInGroup : teamsInGroup + 1;
                    const numRounds = teams - 1;
                    initialPhaseGames += (numRounds * (teams / 2)) * config.turns;
                }
            });
        } else { // CROSS_GROUP
             for(let i = 0; i < groups.length; i+=2) {
                if(groups[i+1]) {
                    initialPhaseGames += (groups[i] * groups[i+1]) * config.turns;
                }
             }
        }
    }

    let playoffPhaseGames = 0;
    let playoffDescription = 'Sem mata-mata';
    const totalQualifiers = config.format === 'ROUND_ROBIN' ? config.playoffTeamsPerGroup : config.numGroups * config.playoffTeamsPerGroup;

    if (config.playoffs && totalQualifiers > 1) {
        let stage = '';
        if (totalQualifiers <= 2) {
            playoffPhaseGames = 1; stage = 'Final';
        } else if (totalQualifiers <= 4) {
            playoffPhaseGames = 3; stage = 'Semifinais';
        } else if (totalQualifiers <= 8) {
            playoffPhaseGames = 7; stage = 'Quartas de Final';
        }
        playoffDescription = `${totalQualifiers} classificados para ${stage}`;
    }
    
    const totalGames = initialPhaseGames + playoffPhaseGames;

    return { formatText, turnsText: config.turns === 1 ? '1 Turno (Ida)' : '2 Turnos (Ida e Volta)', initialPhaseGames, playoffDescription, playoffPhaseGames, totalGames };
  }, [config, clubs]);
  
  const getValidGroupNumbers = () => {
      const numClubs = clubs.length;
      if (numClubs < 4) return [1];
      const validOptions = [];
      for (let i = 2; i <= Math.floor(numClubs / 2); i++) {
          if (numClubs / i >= 2 && i % 2 === 0) { // Only even number of groups for now for simpler pairing
            validOptions.push(i);
          }
      }
      return validOptions;
  }

  return (
    <div className="animate-fade-in">
      <button onClick={onBack} className="mb-6 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
        Voltar
      </button>

      <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">Construtor de Tabela</h1>
      <p className="text-gray-400 mb-8">Crie a estrutura do seu campeonato passo a passo e veja uma prévia em tempo real.</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-800 p-6 rounded-lg space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-white mb-2">1. Formato da Fase Inicial</h3>
                <select value={config.format} onChange={(e) => handleChange('format', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
                    <option value="ROUND_ROBIN">Pontos Corridos (Grupo Único)</option>
                    <option value="GROUP_STAGE" disabled={clubs.length < 4}>Fase de Grupos</option>
                </select>
                {config.format === 'GROUP_STAGE' && (
                    <div className="mt-4 space-y-4 animate-fade-in-down">
                        <div>
                            <label className="font-medium text-gray-300">Número de Grupos:</label>
                            <select value={config.numGroups} onChange={(e) => handleChange('numGroups', parseInt(e.target.value))} className="mt-1 w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
                               {getValidGroupNumbers().map(n => <option key={n} value={n}>{n} Grupos</option>)}
                            </select>
                        </div>
                        {config.numGroups >= 4 && (
                             <div>
                                <label className="font-medium text-gray-300">Confrontos entre Grupos:</label>
                                <select value={config.groupPlayType} onChange={(e) => handleChange('groupPlayType', e.target.value)} className="mt-1 w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
                                   <option value="WITHIN_GROUP">Jogos dentro do próprio grupo</option>
                                   <option value="CROSS_GROUP_SEQUENTIAL">Chave A x B, Chave C x D</option>
                                   <option value="CROSS_GROUP_REVERSE">Chave A x D, Chave B x C</option>
                                </select>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div>
                 <h3 className="text-lg font-semibold text-white mb-2">2. Turnos</h3>
                 <select value={config.turns} onChange={(e) => handleChange('turns', parseInt(e.target.value))} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
                    <option value={1}>1 Turno (Apenas Ida)</option>
                    <option value={2}>2 Turnos (Ida e Volta)</option>
                </select>
            </div>

            <div>
                 <h3 className="text-lg font-semibold text-white mb-2">3. Fase Final (Mata-Mata)</h3>
                 <div className="space-y-4">
                     <div>
                        <div className="flex items-center">
                           <input type="checkbox" id="playoffs" checked={config.playoffs} onChange={(e) => handleChange('playoffs', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"/>
                           <label htmlFor="playoffs" className="ml-2 block text-sm font-medium text-gray-300">Haverá fase de mata-mata?</label>
                        </div>
                    </div>
                    {config.playoffs && (
                        <div className="animate-fade-in-down">
                            <label className="font-medium text-gray-300">
                                {config.format === 'ROUND_ROBIN' ? 'Total de classificados:' : 'Classificados por grupo:'}
                            </label>
                            <input type="number" min="0" value={config.playoffTeamsPerGroup} onChange={e => handleChange('playoffTeamsPerGroup', parseInt(e.target.value) || 0)} className="mt-1 w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" />
                        </div>
                    )}
                 </div>
            </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg sticky top-24">
            <h3 className="text-lg font-semibold text-white mb-4">Pré-visualização da Estrutura</h3>
            <div className="bg-gray-900/50 p-4 rounded-lg space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">Clubes Inscritos:</span><span className="font-bold text-white">{clubs.length}</span></div>
                <hr className="border-gray-700"/>
                <div className="flex justify-between"><span className="text-gray-400">Formato Inicial:</span><span className="font-bold text-white">{previewData.formatText}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Turnos:</span><span className="font-bold text-white">{previewData.turnsText}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Jogos da 1ª Fase:</span><span className="font-bold text-white">{previewData.initialPhaseGames}</span></div>
                 <hr className="border-gray-700"/>
                 <div className="flex justify-between"><span className="text-gray-400">Fase Final:</span><span className="font-bold text-white text-right">{previewData.playoffDescription}</span></div>
                 <div className="flex justify-between"><span className="text-gray-400">Jogos da Fase Final:</span><span className="font-bold text-white">{previewData.playoffPhaseGames}</span></div>
                 <hr className="border-gray-700"/>
                 <div className="flex justify-between text-base mt-2">
                    <span className="font-bold text-green-300">Total de Jogos:</span>
                    <span className="font-extrabold text-xl text-green-300">{previewData.totalGames}</span>
                </div>
            </div>

            <div className="mt-8 flex justify-end gap-4">
              <button onClick={onBack} className="py-2 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600">Cancelar</button>
              <button onClick={() => { if(window.confirm("Tem certeza? Esta ação não pode ser desfeita facilmente.")) { onGenerateMatches(config); }}}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                Gerar Tabela e Salvar
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CreateMatchesPage;