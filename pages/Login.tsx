
import React, { useState } from 'react';
import { ArrowRightIcon, StorefrontIcon } from '../components/icons/Icons';
import * as apiService from '../services/apiService';
import type { Toast, User } from '../types';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
  onNavigateToRegister: () => void;
  showToast: (message: string, type: Toast['type']) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onNavigateToRegister, showToast }) => {
  const [email, setEmail] = useState('admin@admin.com');
  const [password, setPassword] = useState('123'); 
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Pass rememberMe state to the service
      const panelUser = await apiService.loginPanelUser(email, password, rememberMe);
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
    <div className="min-h-screen font-sans flex flex-col relative overflow-hidden items-center justify-center p-6">
      {/* Background Video (Consistent with Landing) */}
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

      <div className="relative z-10 w-full max-w-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
             <div className="bg-primary p-3 rounded-xl text-white shadow-lg">
                <StorefrontIcon className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bem-vindo de volta</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Acesse o painel administrativo da sua loja</p>
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
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
              placeholder="admin@admin.com"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
                <label htmlFor="password"className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Senha
                </label>
                <a href="#" className="text-sm font-medium text-primary hover:text-primary-dark transition-colors">Esqueceu a senha?</a>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300 cursor-pointer">
              Manter conectado
            </label>
          </div>

          {error && <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/30 text-sm text-red-500 dark:text-red-400 text-center border border-red-100 dark:border-red-800">{error}</div>}
          
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-lg shadow-lg text-sm font-bold text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:scale-[1.01]"
            >
              {isLoading ? 'Entrando...' : 'Entrar na Loja'}
              {!isLoading && <ArrowRightIcon className="w-5 h-5" />}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
                Ainda não tem uma conta?{' '}
                <button 
                    onClick={onNavigateToRegister}
                    className="font-bold text-primary hover:text-primary-dark transition-colors"
                >
                    Criar conta grátis
                </button>
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
