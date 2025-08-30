import React, { useState } from 'react';

interface ApiKeyWindowProps {
  onClose: () => void;
  onSave: (apiKey: string) => void;
  currentApiKey: string | null;
}

export const ApiKeyWindow: React.FC<ApiKeyWindowProps> = ({ onClose, onSave, currentApiKey }) => {
  const [key, setKey] = useState(currentApiKey || '');
  const hasExistingKey = !!currentApiKey;

  const handleSave = () => {
    if (key.trim()) {
      onSave(key.trim());
    }
  };

  return (
    <div 
      className="absolute top-20 right-4 bg-white/20 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 z-50 animate-fade-in-fast"
      aria-modal="true"
      role="dialog"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">API Key</h2>
        {hasExistingKey && (
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800" aria-label="Close settings">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        )}
      </div>
      <p className="text-gray-600 mb-4 text-sm">
        Enter your Gemini API key. It's stored only in your browser.
      </p>
      <div className="mb-2">
        <label htmlFor="api-key-input" className="sr-only">API Key</label>
        <input
          id="api-key-input"
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Enter your API key..."
          className="w-full bg-white/30 backdrop-blur-sm border border-white/40 rounded-md text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 px-3 py-2 text-sm"
        />
      </div>
      <a 
        href="https://aistudio.google.com/app/apikey" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-xs text-blue-500 hover:underline"
      >
        Get an API key from Google AI Studio
      </a>
      <button
        onClick={handleSave}
        disabled={!key.trim()}
        className="w-full mt-4 bg-pink-500 text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-pink-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Save
      </button>
    </div>
  );
};

// Add keyframes for fade-in animation
const style = document.createElement('style');
style.innerHTML = `
@keyframes fade-in-fast {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-fast {
  animation: fade-in-fast 0.2s ease-out forwards;
}
`;
document.head.appendChild(style);