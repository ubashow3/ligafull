

import React from 'react';

interface TopScorer {
    id: string;
    name: string;
    goals: number;
    clubName: string;
    clubLogoUrl: string;
    photoUrl?: string;
}

interface TopScorersTabProps {
  topScorers: TopScorer[];
}

const TopScorersTab: React.FC<TopScorersTabProps> = ({ topScorers }) => {
  if (topScorers.length === 0) {
    return <div className="text-center py-10 text-gray-400">Nenhum artilheiro para exibir ainda.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-gray-700 rounded-lg">
        <thead className="bg-gray-600">
          <tr>
            <th className="px-2 py-3 sm:p-3 text-left text-xs sm:text-sm font-semibold text-gray-300 tracking-wider">Pos</th>
            <th className="px-1 py-3 sm:p-3 text-left text-xs sm:text-sm font-semibold text-gray-300 tracking-wider">Foto</th>
            <th className="px-2 py-3 sm:p-3 text-left text-xs sm:text-sm font-semibold text-gray-300 tracking-wider">Jogador</th>
            <th className="px-2 py-3 sm:p-3 text-center text-xs sm:text-sm font-semibold text-gray-300 tracking-wider">Clube</th>
            <th className="px-2 py-3 sm:p-3 text-center text-xs sm:text-sm font-semibold text-gray-300 tracking-wider">Gols</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-600">
          {topScorers.map((scorer, index) => (
            <tr key={scorer.id} className="hover:bg-gray-600/50">
              <td className="px-2 py-3 sm:p-3 text-center font-medium">{index + 1}</td>
              <td className="px-1 py-3 sm:p-3">
                 <img src={scorer.photoUrl || `https://i.pravatar.cc/150?u=${scorer.id}`} alt={scorer.name} className="w-8 h-8 rounded-full object-cover" />
              </td>
              <td className="px-2 py-3 sm:p-3 font-medium text-white text-sm sm:text-base">{scorer.name}</td>
              <td className="px-2 py-3 sm:p-3">
                <div className="flex items-center justify-center">
                  <img src={scorer.clubLogoUrl} alt={scorer.clubName} className="w-6 h-6 rounded-full object-cover" />
                </div>
              </td>
              <td className="px-2 py-3 sm:p-3 text-center font-bold text-white text-base sm:text-lg">{scorer.goals}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TopScorersTab;