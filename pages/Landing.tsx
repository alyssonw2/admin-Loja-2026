
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
                            Crie um <span className="text-primary">e-commerce</span> completo de moda em poucos minutos.
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

                {/* Funcionalidades Section */}
                <section className="py-16 px-6 lg:px-12 bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-3xl lg:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
                            Tudo que você precisa em uma plataforma
                        </h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Gestão de Produtos</h3>
                                <p className="text-gray-600 dark:text-gray-300">Organize seu catálogo com categorias, cores, tamanhos e variações ilimitadas.</p>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Controle de Pedidos</h3>
                                <p className="text-gray-600 dark:text-gray-300">Acompanhe vendas, estoques e entregas em tempo real.</p>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">CRM de Clientes</h3>
                                <p className="text-gray-600 dark:text-gray-300">Gerencie relacionamentos e histórico completo de cada cliente.</p>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Analytics Avançado</h3>
                                <p className="text-gray-600 dark:text-gray-300">Dashboards completos com métricas e insights de vendas.</p>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Cupons e Promoções</h3>
                                <p className="text-gray-600 dark:text-gray-300">Crie campanhas promocionais e cupons de desconto personalizados.</p>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Marketing Digital</h3>
                                <p className="text-gray-600 dark:text-gray-300">Ferramentas para impulsionar suas vendas e atrair mais clientes.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Diferenciais Section */}
                <section className="py-16 px-6 lg:px-12">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-3xl lg:text-4xl font-bold text-center text-gray-900 dark:text-white mb-4">
                            Por que escolher a E-connect?
                        </h2>
                        <p className="text-center text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
                            Desenvolvida especialmente para lojas de moda, com recursos exclusivos para o seu negócio crescer.
                        </p>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="flex gap-4">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Integração com Marketplaces</h3>
                                    <p className="text-gray-600 dark:text-gray-300">Conecte-se automaticamente com Mercado Livre, Shopee e outros marketplaces. Sincronize produtos e pedidos em tempo real.</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">IA para Descrições</h3>
                                    <p className="text-gray-600 dark:text-gray-300">Inteligência artificial cria descrições atrativas e otimizadas para seus produtos automaticamente.</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Gestão de Cores e Tamanhos</h3>
                                    <p className="text-gray-600 dark:text-gray-300">Sistema especializado para moda com controle completo de variações, cores e tamanhos de cada produto.</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sem Taxas por Venda</h3>
                                    <p className="text-gray-600 dark:text-gray-300">Plano fixo mensal sem cobranças por transação. Todo o lucro é seu!</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Conectividade com Clientes Section */}
                <section className="py-16 px-6 lg:px-12 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                                Conectividade total com seus clientes
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                                Venda onde seus clientes estão. Integração nativa com os principais canais de comunicação e vendas.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 mb-12">
                            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg text-center">
                                <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">WhatsApp Business</h3>
                                <p className="text-gray-600 dark:text-gray-300">Atenda clientes, envie catálogos e finalize vendas diretamente pelo WhatsApp.</p>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg text-center">
                                <div className="w-16 h-16 bg-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M11.5 0C5.149 0 0 4.364 0 9.749c0 3.045 1.644 5.752 4.214 7.568.267 4.935-2.647 5.431-2.784 5.457-.205.038-.315.226-.262.431.053.206.232.333.446.333.009 0 5.176-.004 7.925-2.889.551.078 1.115.118 1.684.118 6.351 0 11.5-4.364 11.5-9.749S17.851 0 11.5 0zm.5 13.5a1 1 0 110-2 1 1 0 010 2zm1.276-3.653c-.455.333-.776.599-.776 1.403 0 .276-.224.5-.5.5s-.5-.224-.5-.5c0-1.207.534-1.793 1.126-2.238.385-.289.739-.556.739-1.062 0-.656-.597-1.2-1.333-1.2-.735 0-1.332.544-1.332 1.2 0 .276-.224.5-.5.5s-.5-.224-.5-.5c0-1.209.869-2.2 2.332-2.2 1.464 0 2.333.991 2.333 2.2 0 .97-.71 1.563-1.089 1.897z"/>
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Chat Integrado</h3>
                                <p className="text-gray-600 dark:text-gray-300">Sistema de mensagens em tempo real para suporte instantâneo aos clientes.</p>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg text-center">
                                <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M23.5 9.5h-.09c-.26-1.73-1.23-3.24-2.63-4.18-.04-1.51-.58-2.92-1.52-3.98C18.1.09 16.12-.35 14.27.2c-1.34.4-2.43 1.32-3.04 2.52-.61-1.2-1.7-2.12-3.04-2.52C6.34-.35 4.36.09 3.2 1.34c-.94 1.06-1.48 2.47-1.52 3.98C.28 6.26-.69 7.77-.95 9.5H.5c0 .28.22.5.5.5h1.59c.17 2.34 1.27 4.46 3.02 5.88-.07.37-.11.75-.11 1.12 0 2.76 2.24 5 5 5s5-2.24 5-5c0-.37-.04-.75-.11-1.12 1.75-1.42 2.85-3.54 3.02-5.88H23c.28 0 .5-.22.5-.5zM10.5 20c-1.93 0-3.5-1.57-3.5-3.5S8.57 13 10.5 13s3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Avaliações & Reviews</h3>
                                <p className="text-gray-600 dark:text-gray-300">Colete e gerencie avaliações de produtos para aumentar a confiança.</p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
                            <div className="flex flex-col md:flex-row items-center gap-8">
                                <div className="md:w-1/3">
                                    <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                                        <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="md:w-2/3 text-center md:text-left">
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Loja Online Completa</h3>
                                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                                        Sua própria loja virtual com domínio personalizado, otimizada para conversão e 100% responsiva. 
                                        Integre com Instagram, Facebook e Google Shopping para vender em todos os canais.
                                    </p>
                                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">SEO Otimizado</span>
                                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">Checkout Rápido</span>
                                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">Multi-pagamento</span>
                                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">Certificado SSL</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Landing;
