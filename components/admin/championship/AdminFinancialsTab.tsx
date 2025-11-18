import React, { useState, useEffect, useMemo } from 'react';
import { Championship, ChampionshipFinancials } from '../../../types';

interface AdminFinancialsTabProps {
  championship: Championship;
  onSave: (financials: ChampionshipFinancials) => void;
}

const AdminFinancialsTab: React.FC<AdminFinancialsTabProps> = ({ championship, onSave }) => {
  const emptyForm: Omit<ChampionshipFinancials, 'totalCost' | 'registrationFeePerClub'> = {
    refereeFee: 0,
    assistantFee: 0,
    tableOfficialFee: 0,
    fieldFee: 0,
    yellowCardFine: 0,
    redCardFine: 0,
    playerRegistrationDeadline: undefined,
  };

  const [formState, setFormState] = useState(championship.financials || emptyForm);

  useEffect(() => {
    setFormState(championship.financials || emptyForm);
  }, [championship]);

  const isReadyForFinancials = championship && championship.clubs.length > 0 && championship.matches.length > 0;

  const calculatedValues = useMemo(() => {
    if (!isReadyForFinancials) {
      return { totalCost: 0, registrationFeePerClub: 0 };
    }
    const costPerGame = formState.refereeFee + (formState.assistantFee * 2) + formState.tableOfficialFee + formState.fieldFee;
    const totalCost = costPerGame * championship.matches.length;
    const registrationFeePerClub = championship.clubs.length > 0 ? totalCost / championship.clubs.length : 0;
    
    return { totalCost, registrationFeePerClub };
  }, [isReadyForFinancials, formState, championship]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: e.target.type === 'date' ? value : parseFloat(value) || 0 }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalFinancials: ChampionshipFinancials = {
        ...championship.financials, // Preserve existing optional fields like tokens
        ...formState,
        totalCost: calculatedValues.totalCost,
        registrationFeePerClub: calculatedValues.registrationFeePerClub
    };
    onSave(finalFinancials);
    alert('Informações financeiras salvas com sucesso!');
  };

  return (
    <div className="animate-fade-in">
        <h2 className="text-xl sm:text-2xl font-bold text-green-400 mb-4">Financeiro e Configurações</h2>
        <div className="bg-gray-800 p-4 sm:p-6 rounded-lg">
             {!isReadyForFinancials && (
                <div className="text-center p-4 border-2 border-dashed border-yellow-500/50 bg-yellow-500/10 text-yellow-300 rounded-lg">
                    <p className="font-semibold">Aguardando Configuração</p>
                    <p className="text-sm">Para definir os custos, primeiro cadastre os clubes e gere a tabela de jogos do campeonato.</p>
                </div>
             )}

             {isReadyForFinancials && (
                <form onSubmit={handleSave} className="space-y-6 animate-fade-in">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Custos Fixos por Jogo</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                               <label className="block text-sm font-medium text-gray-300 mb-1">Árbitro Principal</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">R$</span>
                                    <input type="number" name="refereeFee" value={formState.refereeFee} onChange={handleChange} className="w-full bg-gray-700 border-gray-600 rounded p-2 pl-10 text-white"/>
                                </div>
                            </div>
                           <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Auxiliar (Bandeira)</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">R$</span>
                                    <input type="number" name="assistantFee" value={formState.assistantFee} onChange={handleChange} className="w-full bg-gray-700 border-gray-600 rounded p-2 pl-10 text-white"/>
                                </div>
                           </div>
                           <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Mesário</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">R$</span>
                                    <input type="number" name="tableOfficialFee" value={formState.tableOfficialFee} onChange={handleChange} className="w-full bg-gray-700 border-gray-600 rounded p-2 pl-10 text-white"/>
                                </div>
                           </div>
                           <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Taxa do Campo</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">R$</span>
                                    <input type="number" name="fieldFee" value={formState.fieldFee} onChange={handleChange} className="w-full bg-gray-700 border-gray-600 rounded p-2 pl-10 text-white"/>
                                </div>
                           </div>
                        </div>
                    </div>

                     <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Multas (por cartão)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                               <label className="block text-sm font-medium text-gray-300 mb-1">Cartão Amarelo</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">R$</span>
                                    <input type="number" name="yellowCardFine" value={formState.yellowCardFine} onChange={handleChange} className="w-full bg-gray-700 border-gray-600 rounded p-2 pl-10 text-white"/>
                                </div>
                            </div>
                           <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Cartão Vermelho</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">R$</span>
                                    <input type="number" name="redCardFine" value={formState.redCardFine} onChange={handleChange} className="w-full bg-gray-700 border-gray-600 rounded p-2 pl-10 text-white"/>
                                </div>
                           </div>
                        </div>
                    </div>

                     <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Prazos e Regras</h3>
                         <div>
                           <label className="block text-sm font-medium text-gray-300 mb-1">Data Limite para Inscrição de Jogadores</label>
                           <input type="date" name="playerRegistrationDeadline" value={formState.playerRegistrationDeadline || ''} onChange={handleChange} className="w-full bg-gray-700 border-gray-600 rounded p-2 text-white"/>
                        </div>
                    </div>

                    <div className="border-t border-gray-700 pt-4">
                        <h3 className="text-lg font-semibold text-white mb-2">Resumo do Campeonato</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between p-2 bg-gray-900/50 rounded">
                                <span className="text-gray-400">Número de Jogos (inclui mata-mata):</span>
                                <span className="font-bold text-white">{championship.matches.length}</span>
                            </div>
                             <div className="flex justify-between p-2 bg-gray-900/50 rounded">
                                <span className="text-gray-400">Número de Clubes:</span>
                                <span className="font-bold text-white">{championship.clubs.length}</span>
                            </div>
                            <div className="flex justify-between p-2 bg-gray-900/50 rounded">
                                <span className="text-gray-400">Custo Total Estimado:</span>
                                <span className="font-bold text-green-400">{calculatedValues.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                             <div className="flex justify-between p-3 bg-green-500/10 rounded mt-4">
                                <span className="font-bold text-green-300">Taxa de Inscrição por Clube:</span>
                                <span className="font-bold text-xl text-green-300">{calculatedValues.registrationFeePerClub.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                        </div>
                    </div>
                     <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Salvar Configurações</button>
                    </div>
                </form>
             )}
        </div>
    </div>
  );
};

export default AdminFinancialsTab;
