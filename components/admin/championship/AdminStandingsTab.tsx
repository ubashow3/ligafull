import React from 'react';
import { Standing } from '../../../types';

interface AdminStandingsTabProps {
  standings: Standing[];
}

const AdminStandingsTab: React.FC<AdminStandingsTabProps> = ({ standings }) => {
  if (standings.length === 0) {
    return <div className="text-center py-10 text-gray-400">A tabela de classificação ainda não está disponível.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-gray-700 rounded-lg">
        <thead className="bg-gray-600">
          <tr>
            <th className="px-2 py-3 sm:p-3 text-left text-xs sm:text-sm font-semibold text-gray-300 tracking-wider">Pos</th>
            <th className="px-2 py-3 sm:p-3 text-left text-xs sm:text-sm font-semibold text-gray-300 tracking-wider">Clube</th>
            <th className="px-2 py-3 sm:p-3 text-center text-xs sm:text-sm font-semibold text-gray-300 tracking-wider" title="Pontos">P</th>
            <th className="px-2 py-3 sm:p-3 text-center text-xs sm:text-sm font-semibold text-gray-300 tracking-wider" title="Jogos">J</th>
            <th className="px-2 py-3 sm:p-3 text-center text-xs sm:text-sm font-semibold text-gray-300 tracking-wider" title="Vitórias">V</th>
            <th className="px-2 py-3 sm:p-3 text-center text-xs sm:text-sm font-semibold text-gray-300 tracking-wider" title="Empates">E</th>
            <th className="px-2 py-3 sm:p-3 text-center text-xs sm:text-sm font-semibold text-gray-300 tracking-wider" title="Derrotas">D</th>
            <th className="px-2 py-3 sm:p-3 text-center text-xs sm:text-sm font-semibold text-gray-300 tracking-wider" title="Gols Pró">GP</th>
            <th className="px-2 py-3 sm:p-3 text-center text-xs sm:text-sm font-semibold text-gray-300 tracking-wider" title="Gols Contra">GC</th>
            <th className="px-2 py-3 sm:p-3 text-center text-xs sm:text-sm font-semibold text-gray-300 tracking-wider" title="Saldo de Gols">SG</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-600">
          {standings.map((team, index) => (
            <tr key={team.clubId} className="hover:bg-gray-600/50 text-sm">
              <td className="px-2 py-3 sm:p-3 text-center font-medium">{index + 1}</td>
              <td className="px-2 py-3 sm:p-3 text-left font-medium text-white">
                <div className="flex items-center">
                  <img src={team.clubLogoUrl} alt={team.clubName} className="w-6 h-6 rounded-full mr-2 object-cover" />
                  <span>{team.clubAbbreviation}</span>
                </div>
              </td>
              <td className="px-2 py-3 sm:p-3 text-center font-bold text-white">{team.points}</td>
              <td className="px-2 py-3 sm:p-3 text-center text-gray-300">{team.played}</td>
              <td className="px-2 py-3 sm:p-3 text-center text-gray-300">{team.wins}</td>
              <td className="px-2 py-3 sm:p-3 text-center text-gray-300">{team.draws}</td>
              <td className="px-2 py-3 sm:p-3 text-center text-gray-300">{team.losses}</td>
              <td className="px-2 py-3 sm:p-3 text-center text-gray-300">{team.goalsFor}</td>
              <td className="px-2 py-3 sm:p-3 text-center text-gray-300">{team.goalsAgainst}</td>
              <td className="px-2 py-3 sm:p-3 text-center text-gray-300">{team.goalDifference}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminStandingsTab;