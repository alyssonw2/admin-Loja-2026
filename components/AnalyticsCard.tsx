
import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from './icons/Icons';

interface AnalyticsCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ElementType;
}

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({ title, value, change, icon: Icon }) => {
  const isPositive = change >= 0;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-indigo-50 mt-1">{value}</p>
        </div>
        <div className="p-3 rounded-full bg-primary/10 dark:bg-gray-700">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
      <div className={`mt-4 flex items-center text-sm ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
        {isPositive ? <ArrowUpIcon className="w-4 h-4 mr-1" /> : <ArrowDownIcon className="w-4 h-4 mr-1" />}
        <span>{Math.abs(change)}%</span>
        <span className="text-gray-600 dark:text-gray-500 ml-1">vs período anterior</span>
      </div>
    </div>
  );
};

export default AnalyticsCard;
