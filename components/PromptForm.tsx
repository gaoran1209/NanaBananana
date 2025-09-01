import React, { useState, useRef } from 'react';
import { Spinner } from './Spinner';
import { MagicWandIcon } from './icons/MagicWandIcon';
import { XIcon } from './icons/XIcon';
import { AddPresetModal } from './AddPresetModal';
import { type PromptPreset } from '../types';
import { PlusIcon } from './icons/PlusIcon';

interface PromptFormProps {
  onSubmit: (data: { prompt: string; images?: string[] }) => void;
  isLoading: boolean;
  presets: PromptPreset[];
  onAddPreset: (preset: { name: string; prompt: string }) => void;
  onDeletePreset: (id: string) => void;
}

const BANDAI_PRESET_PROMPT = "create a 1/7 scale commercialized figure of the subject in the photo, in a realistic style and environment.Place the figure on a computer desk, using a circular transparent acrylic base without any text. On the computer screen, display the Z Brush modeling process of the figure.Next to the computer screen, place a BANDAI-style toy packaging box printed with the original artwork.The box has a transparent window through which you can see the objects inside. A hand enters the frame from the right side, about to pick up the figure.";

const SWEATER_TRYON_PROMPT = `First, mentally conceptualize a material: Imagine a large, seamless, continuous piece of jacquard knit fabric. This fabric is already woven with the all-over Christmas pattern seen in the second image.

**Now, using that virtual material, generate a professional 3D product shot**:
1.  **Cutting and Sewing**: **Separate pieces** - a front panel and two sleeves - are cut from the single large piece of patterned fabric described above. These three separate pieces are then sewn together to construct the sweater. The overall silhouette and texture should reference the first image.
2.  **Pattern at Seams**: Because the front panel and sleeves are cut and sewn as separate pieces, **the pattern must naturally break at the seams** where they are joined.
3.  **Pattern and Texture at Edges**: At the neck opening, cuffs, and hem, **the fabric's knit structure simply tightens into a fine, vertical ribbed texture**. However, as these areas are extensions of the same fabric, **the pattern itself must be continuous** into these ribbed sections.
4.  **Final Result Check**: The final image **must not contain any solid-color trims or bands**.
5.  **Inner Collar Color**: The inner-facing side of the neck opening needs to be a clean, **solid off-white color**, with absolutely no pattern.
6.  Solid white background.`;

const MAX_IMAGES = 4;

export const PromptForm: React.FC<PromptFormProps> = ({ onSubmit, isLoading, presets, onAddPreset, onDeletePreset }) => {
  const [prompt, setPrompt] = useState('');
  const [imageBases64, setImageBases64] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = (files: FileList | null | undefined) => {
    if (!files || files.length === 0) return;

    if (imageBases64.length + files.length > MAX_IMAGES) {
      setUploadError(`You can upload a maximum of ${MAX_IMAGES} images.`);
      return;
    }
    
    setIsUploading(true);
    setUploadError(null);

    const filePromises = Array.from(files).map(file => {
      return new Promise<string>((resolve, reject) => {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          return reject(`Invalid file type: ${file.name}. Please upload PNG, JPG, or WEBP.`);
        }
        if (file.size > 4 * 1024 * 1024) {
          return reject(`Image too large: ${file.name}. Max size is 4MB.`);
        }

        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject('Failed to read an image file.');
        reader.readAsDataURL(file);
      });
    });

    Promise.all(filePromises)
      .then(newImages => {
        setImageBases64(prev => [...prev, ...newImages]);
      })
      .catch(errorMsg => {
        setUploadError(errorMsg);
      })
      .finally(() => {
        setIsUploading(false);
        if(fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, isEntering: boolean) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(isEntering);
  };
  
  const handleRemoveImage = (indexToRemove: number) => {
    setImageBases64(prev => prev.filter((_, index) => index !== indexToRemove));
    setUploadError(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if ((prompt.trim() || imageBases64.length > 0) && !isLoading && !isUploading) {
      onSubmit({ prompt: prompt.trim(), images: imageBases64 });
      setPrompt('');
      setImageBases64([]);
    }
  };
  
  const canSubmit = !isLoading && !isUploading && (!!prompt.trim() || imageBases64.length > 0);
  const showUploader = imageBases64.length < MAX_IMAGES;

  return (
    <div className="relative z-10">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row flex-wrap items-start gap-3 p-3 bg-white/30 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50">
          
          <div className="flex-shrink-0 flex flex-wrap items-center gap-2">
            {imageBases64.map((imgSrc, index) => (
               <div key={index} className="relative w-16 h-16">
                  <img src={imgSrc} alt={`Upload preview ${index + 1}`} className="w-full h-full rounded-lg object-cover"/>
                  <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute -top-1.5 -right-1.5 bg-white/80 rounded-full p-0.5 text-gray-700 border border-gray-300 hover:bg-white transition-colors"
                      aria-label="Remove image"
                      disabled={isLoading}
                  >
                      <XIcon className="w-4 h-4" />
                  </button>
              </div>
            ))}
            
            {isUploading && (
              <div className="w-16 h-16 flex items-center justify-center bg-gray-200/50 rounded-lg">
                <Spinner isDark />
              </div>
            )}

            {showUploader && (
              <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => handleDragEvents(e, true)}
                onDragEnter={(e) => handleDragEvents(e, true)}
                onDragLeave={(e) => handleDragEvents(e, false)}
                className={`group relative flex flex-col items-center justify-center w-16 h-16 rounded-lg border-2 border-dashed transition-colors duration-200 
                  ${isUploading ? 'cursor-not-allowed bg-gray-100/50' : 'cursor-pointer'}
                  ${isDragging ? 'border-blue-500 bg-blue-50/80' : 'border-gray-400/80 hover:border-blue-400/80 hover:bg-white/30'}`
                }
                aria-label={`Add up to ${MAX_IMAGES - imageBases64.length} more images`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/png, image/jpeg, image/webp"
                  multiple
                  disabled={isUploading}
                />
                <div className="flex flex-col items-center justify-center text-center pointer-events-none text-gray-500 group-hover:text-blue-500 transition-colors">
                  <PlusIcon />
                </div>
              </div>
            )}
          </div>
          
          <div className="flex-grow w-full sm:w-auto flex flex-col sm:flex-row gap-3">
              <label htmlFor="prompt-input" className="sr-only">Image Prompt</label>
              <input
                id="prompt-input"
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={imageBases64.length > 0 ? "Describe how to edit or combine images..." : "A futuristic cityscape..."}
                className="flex-grow bg-white/30 backdrop-blur-sm text-gray-800 placeholder-gray-600 focus:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-400 px-4 py-3 rounded-lg border border-white/40 h-16 sm:h-auto"
                disabled={isLoading || isUploading}
              />
              <button
                type="submit"
                disabled={!canSubmit}
                className="flex-shrink-0 flex items-center justify-center w-full sm:w-auto h-16 sm:h-auto px-6 bg-gradient-to-r from-blue-400 to-pink-400 text-white font-semibold rounded-lg hover:from-blue-500 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-pink-500 transition-all duration-300 transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
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
        <button
          type="button"
          onClick={() => setPrompt(SWEATER_TRYON_PROMPT)}
          className="border border-pink-300/80 text-pink-600 bg-pink-50/80 hover:bg-pink-100/80 transition-colors px-4 py-2 rounded-full text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading || isUploading}
        >
          👕 Sweater Tryon
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