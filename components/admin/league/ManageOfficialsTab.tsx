import React, { useState, useEffect } from 'react';
import { Official } from '../../../types';

const maskCPF = (value: string) => {
  if (!value) return "";
  value = value.replace(/\D/g, '');
  value = value.replace(/(\d{3})(\d)/, '$1.$2');
  value = value.replace(/(\d{3})(\d)/, '$1.$2');
  value = value.replace(/(\d{3})(\d{2})$/, '$1-$2');
  return value.slice(0, 14);
};

interface ManageOfficialsTabProps {
  title: string;
  officials: Official[];
  onCreate: (data: Omit<Official, 'id'>) => void;
  onUpdate: (data: Official) => void;
  onDelete: (id: string) => void;
}

const ManageOfficialsTab: React.FC<ManageOfficialsTabProps> = ({ title, officials, onCreate, onUpdate, onDelete }) => {
    const emptyForm = { id: '', name: '', nickname: '', cpf: '', bankAccount: '' };
    const [formData, setFormData] = useState<Omit<Official, 'id'> & { id?: string }>(emptyForm);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
  
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'cpf' ? maskCPF(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return;
        if (isEditing && formData.id) {
            onUpdate(formData as Official);
        } else {
            const { id, ...creationData } = formData;
            onCreate(creationData);
        }
        setFormData(emptyForm);
        setIsEditing(false);
        setIsFormVisible(false);
    };

    const handleEdit = (official: Official) => {
        setFormData(official);
        setIsEditing(true);
        setIsFormVisible(true);
    };

    const handleCancel = () => {
        setFormData(emptyForm);
        setIsEditing(false);
        setIsFormVisible(false);
    };
    
    const handleAddNew = () => {
        setFormData(emptyForm);
        setIsEditing(false);
        setIsFormVisible(true);
    };

    return (
        <div className="animate-fade-in">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-green-400">{title}</h2>
                {!isFormVisible && (
                     <button
                        onClick={handleAddNew}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center transition-colors text-sm sm:text-base"
                        >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        <span>Adicionar</span>
                    </button>
                )}
            </div>
            
            {isFormVisible && (
                <form onSubmit={handleSubmit} className="bg-gray-700/50 p-4 rounded-lg space-y-3 mb-6 animate-fade-in-down">
                    <h3 className="text-lg font-semibold text-white">{isEditing ? `Editar ${title}` : `Adicionar Novo(a) ${title}`}</h3>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Nome Completo" required className="w-full bg-gray-800 border-gray-600 rounded p-2 text-white" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input type="text" name="nickname" value={formData.nickname || ''} onChange={handleChange} placeholder="Apelido (Opcional)" className="w-full bg-gray-800 border-gray-600 rounded p-2 text-white" />
                        <input type="text" name="cpf" value={formData.cpf || ''} onChange={handleChange} placeholder="CPF (Opcional)" className="w-full bg-gray-800 border-gray-600 rounded p-2 text-white" />
                    </div>
                    <input type="text" name="bankAccount" value={formData.bankAccount || ''} onChange={handleChange} placeholder="Conta Bancária (Opcional)" className="w-full bg-gray-800 border-gray-600 rounded p-2 text-white" />
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={handleCancel} className="py-1 px-3 rounded text-gray-300 hover:text-white">Cancelar</button>
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded">{isEditing ? 'Salvar Alterações' : 'Adicionar'}</button>
                    </div>
                </form>
            )}

            <div className="space-y-2">
                {officials.map(official => (
                    <div key={official.id} className="bg-gray-800 p-3 rounded-md flex justify-between items-center text-sm">
                        <div>
                            <p className="font-bold text-white">{official.name} {official.nickname && `(${official.nickname})`}</p>
                            <p className="text-gray-400 text-xs">{official.cpf}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleEdit(official)} className="text-blue-400 hover:text-blue-300">Editar</button>
                            <button onClick={() => window.confirm('Tem certeza?') && onDelete(official.id)} className="text-red-500 hover:text-red-400">Excluir</button>
                        </div>
                    </div>
                ))}
                {officials.length === 0 && <div className="text-center text-gray-500 py-4">Nenhum(a) {title} cadastrado(a).</div>}
            </div>
        </div>
    );
};

export default ManageOfficialsTab;