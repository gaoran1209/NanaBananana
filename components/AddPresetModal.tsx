import React, { useState } from 'react';
import { XIcon } from './icons/XIcon';

interface AddPresetModalProps {
  onClose: () => void;
  onSave: (preset: { name: string; prompt: string }) => void;
}

export const AddPresetModal: React.FC<AddPresetModalProps> = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');

  const handleSave = () => {
    if (name.trim() && prompt.trim()) {
      onSave({ name: name.trim(), prompt: prompt.trim() });
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-fast" 
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white/80 backdrop-blur-lg border border-fuchsia-200/50 rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4 text-zinc-800" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-zinc-900">Add New Prompt Preset</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-800" aria-label="Close">
            <XIcon className="w-5 h-5"/>
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="preset-name" className="block text-sm font-medium text-zinc-600 mb-1">Preset Name</label>
            <input
              id="preset-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., 'Cyberpunk Art'"
              className="w-full bg-white/50 border border-fuchsia-200/50 rounded-md placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500 px-3 py-2 text-sm text-zinc-800"
            />
          </div>
          <div>
            <label htmlFor="preset-prompt" className="block text-sm font-medium text-zinc-600 mb-1">Prompt Text</label>
            <textarea
              id="preset-prompt"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A detailed prompt for generating a specific style..."
              className="w-full bg-white/50 border border-fuchsia-200/50 rounded-md placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500 px-3 py-2 text-sm resize-y text-zinc-800"
            />
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button
            onClick={handleSave}
            disabled={!name.trim() || !prompt.trim()}
            className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white font-bold py-2 px-4 rounded-md text-sm hover:from-purple-600 hover:to-fuchsia-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-purple-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Preset
          </button>
        </div>
      </div>
    </div>
  );
};

// Add keyframes for fade-in animation
const style = document.createElement('style');
style.innerHTML = `
@keyframes fade-in-fast {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-fade-in-fast {
  animation: fade-in-fast 0.2s ease-out forwards;
}
`;
document.head.appendChild(style);