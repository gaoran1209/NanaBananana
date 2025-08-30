import React, { useState, useRef } from 'react';
import { Spinner } from './Spinner';
import { MagicWandIcon } from './icons/MagicWandIcon';
import { XIcon } from './icons/XIcon';
import { AddPresetModal } from './AddPresetModal';
import { type PromptPreset } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { ImageIcon } from './icons/ImageIcon';

interface PromptFormProps {
  onSubmit: (data: { prompt: string; image?: string }) => void;
  isLoading: boolean;
  presets: PromptPreset[];
  onAddPreset: (preset: { name: string; prompt: string }) => void;
  onDeletePreset: (id: string) => void;
}

const BANDAI_PRESET_PROMPT = "create a 1/7 scale commercialized figure of the subject in the photo, in a realistic style and environment.Place the figure on a computer desk, using a circular transparent acrylic base without any text. On the computer screen, display the Z Brush modeling process of the figure.Next to the computer screen, place a BANDAI-style toy packaging box printed with the original artwork.The box has a transparent window through which you can see the objects inside. A hand enters the frame from the right side, about to pick up the figure.";


export const PromptForm: React.FC<PromptFormProps> = ({ onSubmit, isLoading, presets, onAddPreset, onDeletePreset }) => {
  const [prompt, setPrompt] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File | null | undefined) => {
    if (file) {
      const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setUploadError('Invalid file type. Please upload a PNG, JPG, or WEBP.');
        return;
      }
      if (file.size > 4 * 1024 * 1024) {
        setUploadError('Image is too large. Please select an image under 4MB.');
        return;
      }
      
      setIsUploading(true);
      setUploadError(null);
      setImageBase64(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
        setIsUploading(false);
      };
      reader.onerror = () => {
        setUploadError('Failed to read the image file.');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFile(e.target.files?.[0]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    processFile(e.dataTransfer.files?.[0]);
  };

  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, isEntering: boolean) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(isEntering);
  };
  
  const handleClearImage = () => {
    setImageBase64(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if ((prompt.trim() || imageBase64) && !isLoading && !isUploading) {
      onSubmit({ prompt: prompt.trim(), image: imageBase64 || undefined });
      setPrompt('');
      handleClearImage();
    }
  };
  
  const canSubmit = !isLoading && !isUploading && (!!prompt.trim() || !!imageBase64);

  return (
    <div className="relative z-10">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        
        {!imageBase64 && !isUploading && (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => handleDragEvents(e, true)}
            onDragEnter={(e) => handleDragEvents(e, true)}
            onDragLeave={(e) => handleDragEvents(e, false)}
            className={`group relative flex flex-col items-center justify-center w-full h-32 rounded-2xl border-2 border-dashed transition-colors duration-200 cursor-pointer
              ${isDragging ? 'border-blue-500 bg-blue-50/80' : 'border-gray-300/80 hover:border-blue-400/80 hover:bg-white/30'}`
            }
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/png, image/jpeg, image/webp"
            />
            <div className="flex flex-col items-center justify-center text-center pointer-events-none">
              <ImageIcon />
              <p className="mt-2 text-sm text-gray-600">
                <span className="font-semibold text-blue-500">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, WEBP. Max 4MB.</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 p-2 bg-white/30 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50">
          
          {isUploading && (
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 rounded-lg bg-gray-200/50 flex items-center justify-center">
                <Spinner isDark />
              </div>
            </div>
          )}
        
          {imageBase64 && !isUploading && (
              <div className="relative w-12 h-12">
                  <img src={imageBase64} alt="Upload preview" className="w-12 h-12 rounded-lg object-cover"/>
                  <button
                      type="button"
                      onClick={handleClearImage}
                      className="absolute -top-1.5 -right-1.5 bg-white/80 rounded-full p-0.5 text-gray-700 border border-gray-300 hover:bg-white transition-colors"
                      aria-label="Remove image"
                      disabled={isUploading}
                  >
                      <XIcon className="w-4 h-4" />
                  </button>
              </div>
          )}

          <label htmlFor="prompt-input" className="sr-only">Image Prompt</label>
          <input
            id="prompt-input"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={imageBase64 ? "Describe how to edit the image..." : "A futuristic cityscape..."}
            className="flex-grow bg-white/30 backdrop-blur-sm text-gray-800 placeholder-gray-600 focus:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-400 px-4 py-3 rounded-lg border border-white/40 h-12"
            disabled={isLoading || isUploading}
          />
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex items-center justify-center w-full sm:w-auto mt-2 sm:mt-0 h-12 px-6 bg-gradient-to-r from-blue-400 to-pink-400 text-white font-semibold rounded-lg hover:from-blue-500 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-pink-500 transition-all duration-300 transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
            aria-label="Generate image"
          >
            {isLoading ? (
              <>
                <Spinner />
                <span className="ml-2">Generating...</span>
              </>
            ) : (
              <>
                <MagicWandIcon />
                <span className="ml-2">Generate</span>
              </>
            )}
          </button>
        </div>
      </form>
      {uploadError && (
        <div className="mt-2 text-center text-red-700 text-sm bg-red-100/80 backdrop-blur-sm p-2 rounded-md" role="alert">
          <p>{uploadError}</p>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 mt-4">
        <button
          type="button"
          onClick={() => setPrompt(BANDAI_PRESET_PROMPT)}
          className="border border-pink-300/80 text-pink-600 bg-pink-50/80 hover:bg-pink-100/80 transition-colors px-4 py-2 rounded-full text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading || isUploading}
        >
          ✨ Try BanDai Preset
        </button>
        {presets.map(preset => (
            <div key={preset.id} className="relative group">
                <button
                    type="button"
                    onClick={() => setPrompt(preset.prompt)}
                    className="border border-pink-300/80 text-pink-600 bg-pink-50/80 hover:bg-pink-100/80 transition-colors pl-4 pr-3 py-2 rounded-full text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading || isUploading}
                >
                    {preset.name}
                </button>
                <button
                    onClick={() => onDeletePreset(preset.id)}
                    className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 text-gray-500 border border-gray-300 hover:bg-red-100 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0"
                    aria-label={`Delete ${preset.name} preset`}
                    disabled={isLoading || isUploading}
                >
                    <XIcon className="w-3 h-3" />
                </button>
            </div>
        ))}
        <button
            type="button"
            onClick={() => setIsPresetModalOpen(true)}
            className="flex items-center justify-center w-8 h-8 border-2 border-dashed border-gray-400/80 text-gray-500 bg-gray-50/50 hover:bg-gray-100/80 hover:border-gray-500 hover:text-gray-600 transition-colors rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || isUploading}
            aria-label="Add new prompt preset"
        >
            <PlusIcon />
        </button>
      </div>

      {isPresetModalOpen && (
        <AddPresetModal
            onClose={() => setIsPresetModalOpen(false)}
            onSave={onAddPreset}
        />
      )}
    </div>
  );
};