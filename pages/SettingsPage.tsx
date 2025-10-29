// src/pages/SettingsPage.tsx

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

type SidebarMode = 'hover' | 'expanded' | 'collapsed';

const SETTINGS_KEY = 'litelelo.sidebarMode';

const SettingsPage: React.FC = () => {
  const [sidebarMode, setSidebarMode] = React.useState<SidebarMode>(() => {
    const stored = (localStorage.getItem(SETTINGS_KEY) as SidebarMode | null) || 'hover';
    return stored;
  });
  const { theme, toggleTheme } = useTheme();

  const updateMode = (mode: SidebarMode) => {
    setSidebarMode(mode);
    localStorage.setItem(SETTINGS_KEY, mode);
    window.dispatchEvent(new CustomEvent('litelelo:sidebar-mode-changed', { detail: mode }));
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-6">
      <div className="bg-secondary-light dark:bg-secondary rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-tertiary-light dark:border-tertiary">
          <h1 className="text-2xl font-bold text-text-main-light dark:text-text-main">Settings</h1>
        </div>
        <div className="p-6 space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-text-main-light dark:text-text-main mb-3">Appearance</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { if (theme !== 'light') toggleTheme(); }}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${theme==='light' ? 'bg-brand-green text-black border-brand-green' : 'border-tertiary-light dark:border-tertiary text-text-secondary-light dark:text-text-secondary hover:border-brand-green/50'}`}
              >
                Lite Mode
              </button>
              <button
                onClick={() => { if (theme !== 'dark') toggleTheme(); }}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${theme==='dark' ? 'bg-brand-green text-black border-brand-green' : 'border-tertiary-light dark:border-tertiary text-text-secondary-light dark:text-text-secondary hover:border-brand-green/50'}`}
              >
                Dark Mode
              </button>
            </div>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-text-main-light dark:text-text-main mb-3">Sidebar</h2>
            <p className="text-sm text-text-tertiary-light dark:text-text-tertiary mb-4">Choose how the left sidebar behaves.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => updateMode('expanded')}
                className={`p-4 rounded-xl border transition-colors text-left ${sidebarMode === 'expanded' ? 'border-brand-green bg-brand-green/10' : 'border-tertiary-light dark:border-tertiary hover:border-brand-green/50'}`}
              >
                <div className="font-semibold text-text-main-light dark:text-text-main">Expanded</div>
                <div className="text-xs text-text-tertiary-light dark:text-text-tertiary mt-1">Always open</div>
              </button>
              <button
                onClick={() => updateMode('collapsed')}
                className={`p-4 rounded-xl border transition-colors text-left ${sidebarMode === 'collapsed' ? 'border-brand-green bg-brand-green/10' : 'border-tertiary-light dark:border-tertiary hover:border-brand-green/50'}`}
              >
                <div className="font-semibold text-text-main-light dark:text-text-main">Collapsed</div>
                <div className="text-xs text-text-tertiary-light dark:text-text-tertiary mt-1">Always closed</div>
              </button>
              <button
                onClick={() => updateMode('hover')}
                className={`p-4 rounded-xl border transition-colors text-left ${sidebarMode === 'hover' ? 'border-brand-green bg-brand-green/10' : 'border-tertiary-light dark:border-tertiary hover:border-brand-green/50'}`}
              >
                <div className="font-semibold text-text-main-light dark:text-text-main">Expand on hover</div>
                <div className="text-xs text-text-tertiary-light dark:text-text-tertiary mt-1">Open when hovered</div>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;


