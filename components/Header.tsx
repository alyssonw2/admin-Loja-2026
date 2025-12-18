
import React, { useState } from 'react';
import { Page, User, StoreSettings } from '../types';
import { ChevronDownIcon, LogoutIcon, SunIcon, MoonIcon, RepeatUserIcon, ChatIcon } from './icons/Icons';

interface HeaderProps {
  currentPage: Page;
  user: User;
  onLogout: () => void;
  onNavigate: (page: Page) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  whatsappStatus: StoreSettings['connectivity']['whatsappStatus'];
}

const Header: React.FC<HeaderProps> = ({ currentPage, user, onLogout, onNavigate, theme, toggleTheme, whatsappStatus }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getStatusColor = () => {
    switch (whatsappStatus) {
      case 'Conectado': return 'text-green-500';
      case 'Conectando': return 'text-yellow-500 animate-pulse';
      case 'Desconectado': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-md p-6 flex justify-between items-center relative z-20 border-b border-gray-200 dark:border-gray-700">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{currentPage}</h2>
      <div className="flex items-center space-x-4">
        {/* WhatsApp Status Icon */}
        <div 
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 cursor-help group relative transition-all`}
          title={`WhatsApp: ${whatsappStatus}`}
        >
          <ChatIcon className={`w-5 h-5 ${getStatusColor()}`} />
          <span className="text-[10px] font-bold uppercase hidden md:inline-block dark:text-gray-300">WA {whatsappStatus}</span>
          
          {/* Tooltip detail */}
          <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900 text-white text-[10px] p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-30">
            {whatsappStatus === 'Conectado' ? 'Instância ativa e pronta para uso.' : 
             whatsappStatus === 'Conectando' ? 'Aguardando pareamento ou conexão...' : 
             'Instância desconectada ou inexistente.'}
          </div>
        </div>

         <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
            {theme === 'dark' ? <SunIcon className="w-6 h-6 text-yellow-400" /> : <MoonIcon className="w-6 h-6 text-gray-700" />}
         </button>
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover bg-gray-200 dark:bg-gray-600" />
            <div className="hidden md:block">
              <p className="text-gray-900 dark:text-white font-semibold text-left">{user.name}</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm text-left truncate max-w-[150px]">{user.email}</p>
            </div>
            <ChevronDownIcon className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {isDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-700 rounded-lg shadow-xl py-2 ring-1 ring-black ring-opacity-5"
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-600 md:hidden">
                <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
              </div>
              <button
                onClick={() => {
                    onNavigate(Page.Profile);
                    setIsDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center"
              >
                <RepeatUserIcon className="w-4 h-4 mr-2" />
                Meu Perfil
              </button>
              <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
              <button
                onClick={onLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20 hover:text-red-700 dark:hover:text-red-300 flex items-center"
              >
                <LogoutIcon className="w-4 h-4 mr-2" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
