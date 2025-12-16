
import React, { useState } from 'react';
// FIX: Changed import to not be a type-only import, as the Page enum is used as a value.
import { Page } from '../types';
import { DashboardIcon, ChatIcon, ProductIcon, OrderIcon, CustomerIcon, AnalyticsIcon, SettingsIcon, LogoutIcon, TicketIcon, StarIcon, CpuChipIcon, ChevronDownIcon, ShoppingCartIcon } from './icons/Icons';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  onLogout: () => void;
}

const navItems = [
  { page: Page.Dashboard, icon: DashboardIcon, title: 'Dashboard' },
  { page: Page.Chat, icon: ChatIcon, title: 'Chat' },
  { page: Page.Products, icon: ProductIcon, title: 'Produtos' },
  { page: Page.Orders, icon: OrderIcon, title: 'Pedidos' },
  { page: Page.AbandonedCarts, icon: ShoppingCartIcon, title: 'Carrinhos' },
  { page: Page.Coupons, icon: TicketIcon, title: 'Cupons' },
  { page: Page.Customers, icon: CustomerIcon, title: 'Clientes' },
  { page: Page.Reviews, icon: StarIcon, title: 'Avaliações' },
  {
    title: 'Marketplace',
    icon: CpuChipIcon,
    subItems: [
      { page: Page.MarketplaceMercadoLivre, title: 'Mercado Livre' },
    ]
  },
  { page: Page.Analytics, icon: AnalyticsIcon, title: 'Análises' },
  { page: Page.Settings, icon: SettingsIcon, title: 'Configurações' },
];


const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, onLogout }) => {
  const getParentMenu = (page: Page) => {
    return navItems.find(item => item.subItems?.some(sub => sub.page === page))?.title;
  };
  const [openMenus, setOpenMenus] = useState<string[]>([getParentMenu(currentPage)].filter(Boolean) as string[]);

  const toggleMenu = (title: string) => {
    setOpenMenus(prev => prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]);
  };
  
  return (
    <aside className="w-64 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 flex flex-col h-screen border-r border-gray-200 dark:border-gray-700">
      <div className="p-6 text-center border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">E-connect</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Admin Panel</p>
      </div>
      <nav className="flex-1 p-4">
        <ul>
          {navItems.map((item) => {
            const isSubmenuOpen = item.title && openMenus.includes(item.title);
            const isCurrent = item.page === currentPage;
            const isSubmenuActive = item.subItems?.some(sub => sub.page === currentPage);

            if (item.subItems) {
              return (
                 <li key={item.title}>
                  <button
                    onClick={() => toggleMenu(item.title!)}
                    className={`flex items-center justify-between w-full px-4 py-3 my-1 rounded-lg transition-colors duration-200 ${
                      isSubmenuActive ? 'text-gray-900 dark:text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center">
                      <item.icon className="w-5 h-5 mr-3" />
                      <span className="font-medium">{item.title}</span>
                    </div>
                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${isSubmenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isSubmenuOpen && (
                    <ul className="pl-8 py-1">
                      {item.subItems.map(subItem => (
                        <li key={subItem.page}>
                          <button
                            onClick={() => setCurrentPage(subItem.page)}
                            className={`flex items-center w-full px-4 py-2 my-1 rounded-lg text-sm transition-colors duration-200 ${
                              currentPage === subItem.page
                                ? 'bg-primary text-white'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                            }`}
                          >
                            <span>{subItem.title}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            }

            return (
              <li key={item.page}>
                <button
                  onClick={() => setCurrentPage(item.page!)}
                  className={`flex items-center w-full px-4 py-3 my-1 rounded-lg transition-colors duration-200 ${
                    isCurrent ? 'bg-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <span className="font-medium">{item.title}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onLogout}
          className="flex items-center w-full px-4 py-3 my-1 rounded-lg transition-colors duration-200 text-red-600 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20 hover:text-red-700 dark:hover:text-red-300"
        >
          <LogoutIcon className="w-5 h-5 mr-3" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
