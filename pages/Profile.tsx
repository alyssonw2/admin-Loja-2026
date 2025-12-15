
import React, { useState } from 'react';
import type { User, Toast } from '../types';
import { db } from '../services/apiService';
import { CheckCircleIcon } from '../components/icons/Icons';

interface ProfileProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  showToast: (message: string, type: Toast['type']) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser, showToast }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    password: '',
    newPassword: '',
    confirmPassword: '',
    avatarUrl: user.avatarUrl || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
        showToast('A nova senha e a confirmação não conferem.', 'error');
        setIsLoading(false);
        return;
    }

    try {
        const payload: any = {
            name: formData.name,
            // Only send password if it's being changed
            ...(formData.newPassword ? { password: formData.newPassword } : {})
        };

        // In this system, user data is stored in the 'stores' table
        await db.update('stores', user.id, payload);

        // Update local state
        const updatedUser: User = {
            ...user,
            name: formData.name,
            username: formData.name, // Keeping username in sync with store name for this architecture
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random` // Auto-generate avatar based on new name
        };

        onUpdateUser(updatedUser);
        
        // Reset password fields
        setFormData(prev => ({ ...prev, password: '', newPassword: '', confirmPassword: '' }));
        
        showToast('Perfil atualizado com sucesso!', 'success');

    } catch (error) {
        console.error("Failed to update profile:", error);
        showToast('Erro ao atualizar perfil.', 'error');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="bg-primary p-6 text-center">
            <div className="relative inline-block">
                <img 
                    src={formData.avatarUrl || user.avatarUrl} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-700 object-cover bg-gray-200"
                />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-white">{user.name}</h2>
            <p className="text-primary-light text-sm">{user.email}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Personal Information */}
            <section>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                    Informações Pessoais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome da Loja / Usuário</label>
                        <input 
                            type="text" 
                            name="name" 
                            value={formData.name} 
                            onChange={handleChange} 
                            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">E-mail</label>
                        <input 
                            type="email" 
                            name="email" 
                            value={formData.email} 
                            disabled
                            className="w-full bg-gray-200 dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500 mt-1">O e-mail não pode ser alterado.</p>
                    </div>
                </div>
            </section>

            {/* Security */}
            <section>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                    Segurança
                </h3>
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nova Senha</label>
                        <input 
                            type="password" 
                            name="newPassword" 
                            value={formData.newPassword} 
                            onChange={handleChange} 
                            placeholder="Deixe em branco para manter a atual"
                            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    {formData.newPassword && (
                        <div className="animate-fade-in">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirmar Nova Senha</label>
                            <input 
                                type="password" 
                                name="confirmPassword" 
                                value={formData.confirmPassword} 
                                onChange={handleChange} 
                                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                required
                            />
                        </div>
                    )}
                </div>
            </section>

            <div className="flex justify-end pt-4">
                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="flex items-center bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                    {!isLoading && <CheckCircleIcon className="ml-2 w-5 h-5"/>}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
