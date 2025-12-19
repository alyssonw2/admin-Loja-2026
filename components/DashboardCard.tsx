
import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon: Icon, color }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 flex items-center space-x-4 transition-all hover:shadow-lg">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-8 h-8 text-indigo-50" />
      </div>
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-black text-gray-900 dark:text-indigo-50">{value}</p>
      </div>
    </div>
  );
};

export default DashboardCard;
