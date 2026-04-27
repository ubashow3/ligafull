import React from 'react';
import { League, Championship } from '../../../types';

interface LeagueFinancialsTabProps {
  league: League;
}

const LeagueFinancialsTab: React.FC<LeagueFinancialsTabProps> = ({ league }) => {
  const championships = league.championships;

  const summary = championships.reduce((acc, champ) => {
    const financials = champ.financials;
    if (!financials) return acc;

    const numMatches = champ.matches.length;
    const numClubs = champ.clubs.length;

    const costPerGame = (financials.refereeFee || 0) + ((financials.assistantFee || 0) * 2) + (financials.tableOfficialFee || 0) + (financials.fieldFee || 0);
    const totalCost = costPerGame * numMatches;
    
    // Revenue from registration fees
    const registrationRevenue = (financials.registrationFeePerClub || 0) * numClubs;
    
    // Revenue from fines (simplified: assuming all fines are paid for this summary)
    // In a real app, we would check the finePayments status
    const fineRevenue = champ.matches.reduce((fineAcc, match) => {
        const matchFines = match.events.reduce((eventAcc, event) => {
            if (event.type === 'yellow_card') return eventAcc + (financials.yellowCardFine || 0);
            if (event.type === 'red_card') return eventAcc + (financials.redCardFine || 0);
            return eventAcc;
        }, 0);
        return fineAcc + matchFines;
    }, 0);

    return {
      totalCost: acc.totalCost + totalCost,
      totalRevenue: acc.totalRevenue + registrationRevenue + fineRevenue,
      registrationRevenue: acc.registrationRevenue + registrationRevenue,
      fineRevenue: acc.fineRevenue + fineRevenue,
    };
  }, { totalCost: 0, totalRevenue: 0, registrationRevenue: 0, fineRevenue: 0 });

  const netBalance = summary.totalRevenue - summary.totalCost;

  return (
    <div className="animate-fade-in space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold text-green-400">Resumo Financeiro da Liga</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-blue-500">
          <p className="text-gray-400 text-sm">Receita Total</p>
          <p className="text-2xl font-bold text-white">{summary.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          <div className="mt-2 text-xs text-gray-500 space-y-1">
            <p>Inscrições: {summary.registrationRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            <p>Multas: {summary.fineRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-red-500">
          <p className="text-gray-400 text-sm">Despesa Total (Arbitragem/Campos)</p>
          <p className="text-2xl font-bold text-white">{summary.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-green-500">
          <p className="text-gray-400 text-sm">Saldo Líquido</p>
          <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {netBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h3 className="font-bold text-white">Detalhamento por Campeonato</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-900 text-gray-400 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Campeonato</th>
                <th className="px-4 py-3 text-right">Inscrições</th>
                <th className="px-4 py-3 text-right">Multas</th>
                <th className="px-4 py-3 text-right">Custos</th>
                <th className="px-4 py-3 text-right">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {championships.map(champ => {
                const financials = champ.financials;
                if (!financials) return null;

                const numMatches = champ.matches.length;
                const numClubs = champ.clubs.length;
                const costPerGame = (financials.refereeFee || 0) + ((financials.assistantFee || 0) * 2) + (financials.tableOfficialFee || 0) + (financials.fieldFee || 0);
                const totalCost = costPerGame * numMatches;
                const registrationRevenue = (financials.registrationFeePerClub || 0) * numClubs;
                const fineRevenue = champ.matches.reduce((fineAcc, match) => {
                    return fineAcc + match.events.reduce((eventAcc, event) => {
                        if (event.type === 'yellow_card') return eventAcc + (financials.yellowCardFine || 0);
                        if (event.type === 'red_card') return eventAcc + (financials.redCardFine || 0);
                        return eventAcc;
                    }, 0);
                }, 0);
                const balance = registrationRevenue + fineRevenue - totalCost;

                return (
                  <tr key={champ.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{champ.name}</td>
                    <td className="px-4 py-3 text-right text-gray-300">{registrationRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="px-4 py-3 text-right text-gray-300">{fineRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="px-4 py-3 text-right text-red-400">{totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className={`px-4 py-3 text-right font-bold ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                  </tr>
                );
              })}
              {championships.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-500 italic">
                    Nenhum campeonato com dados financeiros disponíveis.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeagueFinancialsTab;
