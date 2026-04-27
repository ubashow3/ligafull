
import React, { useState } from 'react';
import { Trophy, Users, Shield, ArrowRight, Mail, Lock, User, LogIn } from 'lucide-react';
import * as leagueService from '../../services/leagueService';
import { UserProfile } from '../../types';

interface AuthWallProps {
    onLoginSuccess: (user: UserProfile) => void;
}

const AuthWall: React.FC<AuthWallProps> = ({ onLoginSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            if (mode === 'signup') {
                if (!formData.full_name || !formData.email || !formData.password) {
                    throw new Error('Preencha todos os campos');
                }
                const user = await leagueService.userRegister(formData);
                onLoginSuccess(user);
            } else {
                const user = await leagueService.userLogin(formData.email, formData.password);
                if (user) {
                    onLoginSuccess(user);
                } else {
                    throw new Error('Email ou senha incorretos');
                }
            }
        } catch (err: any) {
            console.error('Registration/Login Error:', err);
            const msg = err.message || (typeof err === 'string' ? err : 'Ocorreu um erro inesperado');
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center p-4 overflow-hidden z-[9999] pointer-events-auto">
            {/* Background Decorativo */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20 z-0">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-green-500 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-600 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-3xl p-8 shadow-2xl relative z-[10000] animate-fade-in pointer-events-auto">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 rounded-2xl mb-4 border border-green-500/20">
                        <Trophy className="w-10 h-10 text-green-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">LigaFull</h1>
                    <p className="text-gray-400">A rede social do futebol digital</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl text-center max-h-32 overflow-y-auto no-scrollbar">
                            {error}
                        </div>
                    )}

                    {mode === 'signup' && (
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Nome Completo"
                                value={formData.full_name}
                                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-green-500 transition-colors"
                                required
                            />
                        </div>
                    )}

                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            type="email"
                            placeholder="Seu melhor e-mail"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-green-500 transition-colors"
                            required
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            type="password"
                            placeholder="Sua senha"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-green-500 transition-colors"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-green-500/20 disabled:opacity-50"
                    >
                        {isLoading ? 'Aguarde...' : (mode === 'login' ? 'Entrar' : 'Criar Conta')}
                        {!isLoading && <LogIn className="w-5 h-5" />}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        {mode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}
                    </button>
                </div>

                <div className="relative py-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-gray-800 px-2 text-gray-500">LigaFull Social</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-center gap-1 text-xs text-gray-500">
                        <Shield className="w-4 h-4 text-green-500/50" />
                        <span>100% Seguro</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 text-xs text-gray-500">
                        <Users className="w-4 h-4 text-blue-500/50" />
                        <span>Comunidade</span>
                    </div>
                </div>
            </div>

            <p className="mt-8 text-gray-500 text-sm">
                &copy; 2024 LigaFull Futebol Digital. Todos os direitos reservados.
            </p>
        </div>
    );
};

export default AuthWall;
