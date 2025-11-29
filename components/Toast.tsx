

import React, { useEffect } from 'react';
import type { Toast } from '../types';
import { CheckCircleIcon, InformationCircleIcon, ChatIcon } from './icons/Icons';

interface ToastProps {
  toast: Toast;
  removeToast: (id: number) => void;
}

const ToastComponent: React.FC<ToastProps> = ({ toast, removeToast }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, 5000); // Auto-dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, [toast, removeToast]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircleIcon className="w-6 h-6 text-green-400" />;
      case 'info':
        return <InformationCircleIcon className="w-6 h-6 text-blue-400" />;
      case 'chat':
        return <ChatIcon className="w-6 h-6 text-indigo-400" />;
      case 'error':
        return <InformationCircleIcon className="w-6 h-6 text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <div
      className="w-80 max-w-full bg-gray-700 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden animate-fade-in-right"
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">{getIcon()}</div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-white">{toast.message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => removeToast(toast.id)}
              className="bg-gray-700 rounded-md inline-flex text-gray-400 hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


interface ToastContainerProps {
    toasts: Toast[];
    removeToast: (id: number) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
    return (
        <div aria-live="assertive" className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50">
            <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
                {toasts.map(toast => (
                    <ToastComponent key={toast.id} toast={toast} removeToast={removeToast} />
                ))}
            </div>
        </div>
    );
};

export default ToastContainer;