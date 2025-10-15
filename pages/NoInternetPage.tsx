// src/pages/NoInternetPage.tsx

import React from 'react';
import { WifiOffIcon } from '../components/icons';

const NoInternetPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-primary-light dark:bg-primary text-center p-4">
      <div className="relative mb-6">
        <div className="w-32 h-32 rounded-3xl bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center">
          <WifiOffIcon className="w-16 h-16 text-red-500" />
        </div>
      </div>
      
      <h1 className="text-3xl md:text-4xl font-bold text-text-main-light dark:text-text-main mb-3">
        Connection Lost
      </h1>
      <p className="text-lg text-text-secondary-light dark:text-text-secondary max-w-md mx-auto mb-8">
        It seems you're offline. Please check your internet connection and try again.
      </p>

      <button
        onClick={() => window.location.reload()}
        className="px-8 py-3 bg-brand-green text-black font-bold rounded-xl hover:bg-brand-green-darker transition-all duration-300 transform hover:scale-105"
      >
        Retry Connection
      </button>
    </div>
  );
};

export default NoInternetPage;