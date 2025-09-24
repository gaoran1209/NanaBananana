import React, { useState, useRef } from 'react';
import { Spinner } from './Spinner';
import { XIcon } from './icons/XIcon';
import { MagicWandIcon } from './icons/MagicWandIcon';
import { FourOutSwitch } from './FourOutSwitch';
import { ImageIcon } from './icons/ImageIcon';
import { UserIcon } from './icons/UserIcon';
import { LandscapeIcon } from './icons/LandscapeIcon';


interface VirtualTryOnFormProps {
  onSubmit: (data: { prompt: string; images: string[]; isFourOut: boolean; }) => void;
  initialData?: { images: string[] };
}

const VIRTUAL_TRY_ON_PROMPT_TEMPLATE = "Let the girl in Figure 1 wear the clothes in Figure 2, and put on {{shoe_clause}}. Keep the body and head features of the character in Figure 1 unchanged. The clothes in Figure 2 should be customized according to the body shape of the girl in Figure 1. Take a full-body photo on a gray background.";

export const VirtualTryOnForm: React.FC<VirtualTryOnFormProps> = ({ onSubmit, initialData }) => {
  const [modelImage, setModelImage] = useState<string | null>(initialData?.images?.[0] || null);
  const [clothingImage, setClothingImage] = useState<string | null>(initialData?.images?.[1] || null);
  const [shoeDescription, setShoeDescription] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isFourOut, setIsFourOut] = useState(false);

  const modelFileInputRef = useRef<HTMLInputElement>(null);
  const clothingFileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!modelImage || !clothingImage || isUploading) {
        setUploadError('Please upload both a model and a clothing image.');
        return;
      }
      
      const shoeClause = shoeDescription.trim() ? `${shoeDescription.trim()}` : '';
      const finalPrompt = VIRTUAL_TRY_ON_PROMPT_TEMPLATE.replace('{{shoe_clause}}', shoeClause);

      onSubmit({ prompt: finalPrompt, images: [modelImage, clothingImage], isFourOut });
      
      setModelImage(null);
      setClothingImage(null);
      setShoeDescription('');
      setUploadError(null);
  };

  const processFile = (file: File | null | undefined, setImage: (img: string | null) => void) => {
      if (!file) return;
      setIsUploading(true); setUploadError(null);
      const reader = new FileReader();
      reader.onloadend = () => { setImage(reader.result as string); setIsUploading(false); };
      reader.onerror = () => { setUploadError('Failed to read the image file.'); setIsUploading(false); };
      const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
      if (!allowedTypes.includes(file.type)) { setUploadError(`Invalid file type: ${file.name}.`); setIsUploading(false); return; }
      if (file.size > 4 * 1024 * 1024) { setUploadError(`Image too large: ${file.name}. Max size is 4MB.`); setIsUploading(false); return; }
      reader.readAsDataURL(file);
  };

  const handleModelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => processFile(e.target.files?.[0], setModelImage);
  const handleClothingFileChange = (e: React.ChangeEvent<HTMLInputElement>) => processFile(e.target.files?.[0], setClothingImage);
  const handleRemoveImage = (type: 'model' | 'clothing') => {
      setUploadError(null);
      if (type === 'model') { setModelImage(null); if (modelFileInputRef.current) modelFileInputRef.current.value = ''; } 
      else { setClothingImage(null); if (clothingFileInputRef.current) clothingFileInputRef.current.value = ''; }
  };

  const ImageUploader = ({ title, icon, imageBase64, onFileChange, onRemove, fileInputRef, disabled }: any) => (
      <div>
          <h3 className="text-sm font-semibold text-zinc-600 mb-2 flex items-center gap-2">{icon} {title}</h3>
          {!imageBase64 ? (
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={disabled} className="w-full h-48 border-2 border-dashed border-fuchsia-300 rounded-lg flex flex-col items-center justify-center text-zinc-500 hover:border-purple-400 hover:text-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" aria-label={`Attach ${title}`}>
                  {isUploading ? <Spinner /> : <><ImageIcon /><span className="mt-2 text-sm">Click to upload</span></>}
              </button>
          ) : (
              <div className="relative w-48 h-48">
                  <img src={imageBase64} alt={`${title} preview`} className="w-full h-full rounded-lg object-cover border border-fuchsia-200/50" />
                  <button type="button" onClick={onRemove} className="absolute -top-1.5 -right-1.5 bg-white rounded-full p-0.5 text-zinc-600 border border-fuchsia-200/80 hover:bg-fuchsia-50 transition-colors" aria-label={`Remove ${title}`} disabled={disabled}><XIcon className="w-4 h-4" /></button>
              </div>
          )}
          <input type="file" ref={fileInputRef} onChange={onFileChange} className="hidden" accept="image/png, image/jpeg, image/webp" disabled={disabled} />
      </div>
  );
  
  const canSubmit = !isUploading && !!modelImage && !!clothingImage;

  return (
    <div className="max-w-7xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ImageUploader title="Model Image" icon={<UserIcon />} imageBase64={modelImage} onFileChange={handleModelFileChange} onRemove={() => handleRemoveImage('model')} fileInputRef={modelFileInputRef} disabled={isUploading} />
              <ImageUploader title="Clothing Image" icon={<LandscapeIcon />} imageBase64={clothingImage} onFileChange={handleClothingFileChange} onRemove={() => handleRemoveImage('clothing')} fileInputRef={clothingFileInputRef} disabled={isUploading} />
          </div>
            <div>
              <label htmlFor="shoe-desc" className="block text-sm font-medium text-zinc-600 mb-1">Shoes (Optional)</label>
              <input id="shoe-desc" type="text" value={shoeDescription} onChange={e => setShoeDescription(e.target.value)} placeholder="e.g., white sneakers" className="w-full bg-white border border-fuchsia-200 text-zinc-800 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg text-sm px-3 py-2" disabled={isUploading} />
          </div>
          {uploadError && <div className="text-red-600 text-sm" role="alert"><p>{uploadError}</p></div>}
          <div className="flex justify-end pt-2 items-center gap-2">
              <FourOutSwitch isFourOut={isFourOut} setIsFourOut={setIsFourOut} disabled={isUploading} />
              <button type="submit" disabled={!canSubmit} className="flex items-center justify-center h-10 px-6 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white font-semibold rounded-md hover:from-purple-600 hover:to-fuchsia-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-fuchsia-50 focus:ring-purple-500 transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed" aria-label="Generate try-on image">
                  <MagicWandIcon /><span className="ml-2">Generate</span>
              </button>
          </div>
      </form>
    </div>
  );
};