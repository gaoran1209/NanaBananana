import React, { useState } from 'react';
import { type GeneratedImage } from '../types';
import { PencilIcon } from './icons/PencilIcon';
import { Spinner } from './Spinner';
import { DownloadIcon } from './icons/DownloadIcon';

interface ImageCardProps {
  image: GeneratedImage;
  onEditImage: (imageId: string, prompt: string) => Promise<void>;
}

export const ImageCard: React.FC<ImageCardProps> = ({ image, onEditImage }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditingLoading, setIsEditingLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPrompt.trim() || isEditingLoading) return;

    setIsEditingLoading(true);
    setEditError(null);
    try {
      await onEditImage(image.id, editPrompt);
      setIsEditing(false);
      setEditPrompt('');
    } catch (err) {
      setEditError('Failed to edit image. Please try again.');
    } finally {
      setIsEditingLoading(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = image.imageUrl;

    // Create a sanitized filename from the prompt
    const sanitizedPrompt = image.prompt
      .toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^a-z0-9-]/g, '') // Remove non-alphanumeric characters
      .substring(0, 50); // Truncate to 50 chars

    const filename = `nanabanananana-${sanitizedPrompt || 'creation'}.jpeg`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const timeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) {
      return Math.floor(interval) + " years ago";
    }
    interval = seconds / 2592000;
    if (interval > 1) {
      return Math.floor(interval) + " months ago";
    }
    interval = seconds / 86400;
    if (interval > 1) {
      return Math.floor(interval) + " days ago";
    }
    interval = seconds / 3600;
    if (interval > 1) {
      return Math.floor(interval) + " hours ago";
    }
    interval = seconds / 60;
    if (interval > 1) {
      return Math.floor(interval) + " minutes ago";
    }
    return "just now";
  };

  return (
    <div className="bg-white/30 backdrop-blur-xl border border-white/50 rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 animate-fade-in relative">
      {isEditingLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
          <Spinner isDark />
          <span className="ml-3 text-gray-700">Applying edit...</span>
        </div>
      )}
      <img
        src={image.imageUrl}
        alt={image.prompt}
        className="w-full h-auto aspect-square object-cover bg-gray-200/50"
      />
      <div className="p-4 md:p-6">
        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{image.prompt}</p>
        <div className="flex justify-between items-center mt-4">
          <p className="text-xs text-gray-500">{timeAgo(image.timestamp)}</p>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleDownload}
              className="flex items-center text-xs text-gray-600 hover:text-blue-500 transition-colors duration-200"
              aria-label="Download image"
            >
              <DownloadIcon />
              <span className="ml-1">Download</span>
            </button>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center text-xs text-gray-600 hover:text-pink-500 transition-colors duration-200"
              aria-label="Edit image"
            >
              <PencilIcon />
              <span className="ml-1">Edit</span>
            </button>
          </div>
        </div>
        {isEditing && (
          <div className="mt-4 animate-fade-in">
            <form onSubmit={handleEditSubmit}>
              <label htmlFor={`edit-prompt-${image.id}`} className="sr-only">Edit Prompt</label>
              <input
                id={`edit-prompt-${image.id}`}
                type="text"
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="e.g., 'Make the sky purple'"
                className="w-full bg-white/30 backdrop-blur-sm border border-white/40 rounded-md text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-400 px-3 py-2 text-sm"
                disabled={isEditingLoading}
              />
              {editError && <p className="text-red-500 text-xs mt-2">{editError}</p>}
              <div className="flex items-center justify-end gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isEditingLoading}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-white/40 rounded-md transition-colors border border-white/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditingLoading || !editPrompt.trim()}
                  className="px-3 py-1.5 text-xs font-semibold bg-blue-500 text-white hover:bg-blue-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEditingLoading ? 'Applying...' : 'Apply Edit'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

// Add keyframes for fade-in animation in a style tag for simplicity without needing full CSS setup
const style = document.createElement('style');
style.innerHTML = `
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fade-in 0.5s ease-out forwards;
}
`;
document.head.appendChild(style);