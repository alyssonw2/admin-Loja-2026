
import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRightIcon, PaletteIcon, LinkIcon, TruckIcon } from '../components/icons/Icons';
import { db } from '../services/apiService';
import type { Toast } from '../types';

interface CompleteSetupProps {
    storeId: number | string;
    initialZipCode?: string;
    onComplete: () => void;
    showToast: (message: string, type: Toast['type']) => void;
}

const CompleteSetup: React.FC<CompleteSetupProps> = ({ storeId, initialZipCode = '', onComplete, showToast }) => {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearchingCep, setIsSearchingCep] = useState(false);
    const [formData, setFormData] = useState({
        domain: '',
        whatsapp: '',
        primaryColor: '#6366f1',
        secondaryColor: '#ec4899',
        addressZipCode: initialZipCode,
        addressStreet: '',
        addressNumber: '',
        addressCity: '',
        addressState: ''
    });

    const fetchAddressByCep = useCallback(async (cepValue: string) => {
        const cep = cepValue.replace(/\D/g, '');
        if (cep.length === 8) {
            setIsSearchingCep(true);
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await response.json();

                if (!data.erro) {
                    setFormData(prev => ({
                        ...prev,
                        addressStreet: data.logradouro,
                        addressCity: data.localidade,
                        addressState: data.uf,
                        addressZipCode: cepValue
                    }));
                    showToast('Endereço encontrado!', 'success');
                } else {
                    showToast('CEP não encontrado.', 'error');
                }
            } catch (error) {
                console.error('Erro ao buscar CEP:', error);
                showToast('Erro ao buscar o CEP. Tente manualmente.', 'error');
            } finally {
                setIsSearchingCep(false);
            }
        }
    }, [showToast]);

    // Dispara a busca automaticamente se houver um CEP inicial válido
    useEffect(() => {
        if (initialZipCode && initialZipCode.replace(/\D/g, '').length === 8) {
            fetchAddressByCep(initialZipCode);
        }
    }, [initialZipCode, fetchAddressByCep]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCepBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        fetchAddressByCep(e.target.value);
    };

    const handleNextStep = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(step + 1);
    };

    const handleFinish = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        // Mapeamento corrigido para zipCode (conforme schema da API)
        const payload = {
            domain: formData.domain,
            whatsapp: formData.whatsapp,
            primary_color: formData.primaryColor,
            secondary_color: formData.secondaryColor,
            zipCode: formData.addressZipCode, // zipCode
            address_street: formData.addressStreet,
            address_number: formData.addressNumber,
            address_city: formData.addressCity,
            address_state: formData.addressState,
            status: 'active'
        };
      console.log(payload)
        try {

            await db.update('stores', storeId, payload);
            showToast('Configuração concluída! Bem-vindo ao seu painel.', 'success');
            onComplete();
        } catch (error) {
            console.error(error);
            showToast('Erro ao salvar configurações. Tente novamente.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-primary p-8 text-center">
                    <h1 className="text-2xl font-bold text-white">Configuração da Loja</h1>
                    <p className="text-primary-light mt-2">Passo {step} de 2</p>
                    <div className="mt-4 flex justify-center gap-2">
                        <div className={`h-2 w-16 rounded-full ${step >= 1 ? 'bg-white' : 'bg-primary-dark'}`}></div>
                        <div className={`h-2 w-16 rounded-full ${step >= 2 ? 'bg-white' : 'bg-primary-dark'}`}></div>
                    </div>
                </div>

                <div className="p-8">
                    {step === 1 && (
                        <form onSubmit={handleNextStep} className="space-y-6 animate-fade-in">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <LinkIcon className="text-primary"/> Identidade e Contato
                            </h2>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Domínio Pretendido</label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 text-sm">
                                        https://
                                    </span>
                                    <input 
                                        type="text" 
                                        name="domain" 
                                        value={formData.domain} 
                                        onChange={handleChange} 
                                        className="flex-1 p-3 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:outline-none"
                                        placeholder="sualoja.com.br" 
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WhatsApp de Atendimento</label>
                                <input 
                                    type="text" 
                                    name="whatsapp" 
                                    value={formData.whatsapp} 
                                    onChange={handleChange} 
                                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:outline-none"
                                    placeholder="(00) 00000-0000" 
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cor Primária</label>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="color" 
                                            name="primaryColor" 
                                            value={formData.primaryColor} 
                                            onChange={handleChange} 
                                            className="h-10 w-10 rounded border border-gray-300 cursor-pointer"
                                        />
                                        <span className="text-sm text-gray-500">{formData.primaryColor}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cor Secundária</label>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="color" 
                                            name="secondaryColor" 
                                            value={formData.secondaryColor} 
                                            onChange={handleChange} 
                                            className="h-10 w-10 rounded border border-gray-300 cursor-pointer"
                                        />
                                        <span className="text-sm text-gray-500">{formData.secondaryColor}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button type="submit" className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-lg flex items-center gap-2">
                                    Próximo <ArrowRightIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 2 && (
                         <form onSubmit={handleFinish} className="space-y-6 animate-fade-in">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <TruckIcon className="text-primary"/> Endereço da Loja
                            </h2>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CEP</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        name="addressZipCode" 
                                        value={formData.addressZipCode} 
                                        onChange={handleChange}
                                        onBlur={handleCepBlur}
                                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:outline-none"
                                        placeholder="00000-000"
                                        maxLength={9}
                                        required
                                    />
                                    {isSearchingCep && (
                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Digite o CEP para preencher o endereço automaticamente.</p>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rua</label>
                                    <input 
                                        type="text" 
                                        name="addressStreet" 
                                        value={formData.addressStreet} 
                                        onChange={handleChange} 
                                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número</label>
                                    <input 
                                        type="text" 
                                        name="addressNumber" 
                                        value={formData.addressNumber} 
                                        onChange={handleChange} 
                                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cidade</label>
                                    <input 
                                        type="text" 
                                        name="addressCity" 
                                        value={formData.addressCity} 
                                        onChange={handleChange} 
                                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
                                    <input 
                                        type="text" 
                                        name="addressState" 
                                        value={formData.addressState} 
                                        onChange={handleChange} 
                                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:outline-none"
                                        required
                                        maxLength={2}
                                        placeholder="UF"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between pt-6">
                                <button type="button" onClick={() => setStep(1)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium">
                                    Voltar
                                </button>
                                <button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg flex items-center gap-2 disabled:opacity-70">
                                    {isLoading ? 'Finalizando...' : 'Concluir Cadastro'}
                                    {!isLoading && <ArrowRightIcon className="w-5 h-5"/>}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CompleteSetup;
