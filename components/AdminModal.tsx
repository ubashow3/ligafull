import React, { useState } from 'react';
import { UserProfile } from '../types';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToCreateLeague: () => void;
  user: UserProfile | null;
}

const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, onNavigateToCreateLeague, user }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" 
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-md mx-4" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-white">Criar Nova Liga</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>
        <div className="space-y-4 text-gray-300">
            <p>Você está prestes a iniciar o processo de criação de uma nova liga no <strong>LigaFull</strong>.</p>
            <div className="bg-yellow-900/30 border-l-4 border-yellow-500 p-4 text-sm">
                <p className="font-bold text-yellow-500 mb-1">Aviso Importante:</p>
                <p>A criação e manutenção de uma liga profissional pode envolver custos de hospedagem, processamento de dados e suporte técnico especializado.</p>
            </div>
            <p>Deseja prosseguir para a configuração da sua liga?</p>
            <div className="flex gap-3 pt-2">
                <button 
                  onClick={onClose} 
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Voltar
                </button>
                <button 
                  onClick={onNavigateToCreateLeague} 
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-lg shadow-green-900/20"
                >
                  Sim, Prosseguir
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminModal;