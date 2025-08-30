import React from 'react';

interface HeaderProps {
  onToggleSettings: () => void;
  hasApiKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSettings, hasApiKey }) => {
  return (
    <header className="py-4 bg-white/40 border-b border-white/50 sticky top-0 z-10 backdrop-blur-lg shadow-sm">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="w-10"></div> {/* Spacer */}
        <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-widest">
              🍌 NanaBanananana
            </h1>
            <p className="text-xs text-pink-500 font-semibold tracking-wide mt-1">by RyanG</p>
        </div>
        <button
          onClick={onToggleSettings}
          className="text-xl px-2 py-1 border border-transparent hover:border-gray-400/50 rounded-md transition-colors duration-200"
          aria-label="Open API key settings"
        >
          {hasApiKey ? '✅' : '⚠️'}
        </button>
      </div>
    </header>
  );
};