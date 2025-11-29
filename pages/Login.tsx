
import React, { useState } from 'react';
import { ArrowRightIcon } from '../components/icons/Icons';
import * as apiService from '../services/apiService';
import type { Toast, User } from '../types';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
  showToast: (message: string, type: Toast['type']) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, showToast }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); 
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const panelUser = await apiService.loginPanelUser(email, password);
      showToast(`Bem-vindo, ${panelUser.name}!`, 'success');
      onLoginSuccess(panelUser);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
        setError(errorMessage);
        showToast(errorMessage, 'error');
        console.error("Login process failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 font-sans">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">E-connect</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Acesse o painel administrativo</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="admin@exemplo.com"
            />
          </div>
          <div>
            <label htmlFor="password"className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-red-500 dark:text-red-400 text-center">{error}</p>}
          
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
              {!isLoading && <ArrowRightIcon className="w-5 h-5" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
