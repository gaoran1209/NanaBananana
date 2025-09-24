import React, { useState } from 'react';
import { XIcon } from './icons/XIcon';
import { Spinner } from './Spinner';

interface ApiKeyWindowProps {
  onClose: () => void;
  onSave: (apiKey: string) => void;
  currentApiKey: string | null;
}

export const ApiKeyWindow: React.FC<ApiKeyWindowProps> = ({ onClose, onSave, currentApiKey }) => {
  const [key, setKey] = useState(currentApiKey || '');
  const [isSaving, setIsSaving] = useState(false);
  const hasExistingKey = !!currentApiKey;

  const handleSave = () => {
    if (!key.trim() || isSaving) return;
    
    setIsSaving(true);
    // Removed validation logic, just save the key.
    onSave(key.trim());
    setIsSaving(false);
  };

  return (
    <div 
      className="fixed bottom-16 left-4 bg-white border border-zinc-200 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 z-50 animate-fade-in-fast"
      aria-modal="true"
      role="dialog"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-zinc-800">API Key Settings</h2>
        {hasExistingKey && (
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-800" aria-label="Close settings">
            <XIcon className="w-5 h-5"/>
          </button>
        )}
      </div>
      <p className="text-zinc-600 mb-4 text-sm">
        Enter your Gemini API key. It's stored only in your browser.
      </p>
      <div className="mb-2">
        <label htmlFor="api-key-input" className="sr-only">API Key</label>
        <input
          id="api-key-input"
          type="password"
          value={key}
          onChange={(e) => {
            setKey(e.target.value);
          }}
          placeholder="Enter your API key..."
          className="w-full bg-zinc-100 border border-zinc-200 rounded-md text-zinc-800 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-800 px-3 py-2 text-sm"
          disabled={isSaving}
        />
      </div>
      <a 
        href="https://aistudio.google.com/app/apikey" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-xs text-zinc-500 hover:underline"
      >
        Get an API key from Google AI Studio
      </a>

      <button
        onClick={handleSave}
        disabled={!key.trim() || isSaving}
        className="w-full mt-4 bg-zinc-800 text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isSaving ? <Spinner /> : 'Save'}
      </button>
    </div>
  );
};

// Add keyframes for fade-in animation
const style = document.createElement('style');
style.innerHTML = `
@keyframes fade-in-fast {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-fast {
  animation: fade-in-fast 0.2s ease-out forwards;
}
`;
document.head.appendChild(style);