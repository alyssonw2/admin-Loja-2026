
import React, { useState } from 'react';
import { ArrowRightIcon, StorefrontIcon } from '../components/icons/Icons';
import * as apiService from '../services/apiService';
import type { Toast } from '../types';

interface LandingProps {
    onNavigateToLogin: () => void;
    onRegisterSuccess: (storeId: number | string, zipCode: string) => void;
    showToast: (message: string, type: Toast['type']) => void;
}

const Landing: React.FC<LandingProps> = ({ onNavigateToLogin, onRegisterSuccess, showToast }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        cnpj: '',
        zipCode: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        console.log("--- DEBUG FORMULÁRIO ---");
        console.log("Dados capturados:", formData);

        try {
            // Utiliza o serviço de registro dedicado que trata a autenticação e mapeamento de campos
            const newStore = await apiService.registerStore({
                ...formData,
                status: 'pending'
            });

            if (newStore && newStore.id) {
                console.log("Sucesso! ID da loja:", newStore.id);
                showToast('Loja cadastrada com sucesso! Vamos configurar os detalhes.', 'success');
                // Passa o ID e o CEP para a próxima etapa
                onRegisterSuccess(newStore.id, formData.zipCode);
            } else {
                throw new Error("Falha ao criar loja. Resposta inesperada.");
            }

        } catch (error) {
            console.error("Erro no processo de registro:", error);
            showToast('Erro ao cadastrar loja. Verifique o console para mais detalhes.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen font-sans flex flex-col relative overflow-hidden">
             {/* Background Video */}
            <div className="absolute inset-0 z-0">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                >
                    <source src="/assets/background.mp4" type="video/mp4" />
                </video>
                {/* Overlay to ensure readability */}
                <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90"></div>
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <header className="p-6 flex justify-between items-center border-b border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary p-2 rounded-lg text-white">
                            <StorefrontIcon className="w-6 h-6" />
                        </div>
                        <span className="text-xl font-bold text-gray-900 dark:text-white">E-connect</span>
                    </div>
                    <button 
                        onClick={onNavigateToLogin}
                        className="text-gray-600 dark:text-gray-300 hover:text-primary font-medium"
                    >
                        Já tenho uma conta
                    </button>
                </header>

                <main className="flex-1 flex flex-col lg:flex-row items-center justify-center p-6 lg:p-12 gap-12">
                    <div className="lg:w-1/2 space-y-6 text-center lg:text-left">
                        <h1 className="text-4xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight">
                            Crie sua loja de <span className="text-primary">roupas</span> em minutos.
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-lg mx-auto lg:mx-0">
                            A plataforma completa para gerenciar produtos, pedidos e clientes. Integração com WhatsApp, Mercado Livre e muito mais.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Teste grátis de 14 dias
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Sem cartão de crédito
                            </div>
                        </div>
                    </div>

                    <div className="w-full max-w-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Comece agora</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da Loja</label>
                                <input 
                                    type="text" 
                                    name="name" 
                                    value={formData.name} 
                                    onChange={handleChange} 
                                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:outline-none" 
                                    placeholder="Minha Marca Incrível" 
                                    required 
                                />
                            </div>
                            <div>
                                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CNPJ</label>
                                <input 
                                    type="text" 
                                    name="cnpj" 
                                    value={formData.cnpj} 
                                    onChange={handleChange} 
                                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:outline-none" 
                                    placeholder="00.000.000/0000-00" 
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CEP</label>
                                <input 
                                    type="text" 
                                    name="zipCode" 
                                    value={formData.zipCode} 
                                    onChange={handleChange} 
                                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:outline-none" 
                                    placeholder="00000-000" 
                                    required 
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
                                    <input 
                                        type="email" 
                                        name="email" 
                                        value={formData.email} 
                                        onChange={handleChange} 
                                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:outline-none" 
                                        placeholder="admin@loja.com" 
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha</label>
                                    <input 
                                        type="password" 
                                        name="password" 
                                        value={formData.password} 
                                        onChange={handleChange} 
                                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:outline-none" 
                                        placeholder="******" 
                                        required 
                                    />
                                </div>
                            </div>
                            
                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-lg shadow-lg transform transition hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Criando Loja...' : 'Criar minha Loja Grátis'}
                                {!isLoading && <ArrowRightIcon className="w-5 h-5"/>}
                            </button>
                            <p className="text-xs text-center text-gray-500 mt-4">
                                Ao se cadastrar, você concorda com nossos Termos de Uso e Política de Privacidade.
                            </p>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Landing;
