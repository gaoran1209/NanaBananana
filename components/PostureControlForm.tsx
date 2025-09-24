import React, { useState, useRef } from 'react';
import { Spinner } from './Spinner';
import { XIcon } from './icons/XIcon';
import { MagicWandIcon } from './icons/MagicWandIcon';
import { ImageIcon } from './icons/ImageIcon';
import { FourOutSwitch } from './FourOutSwitch';

interface PostureControlFormProps {
  onSubmit: (data: { prompt: string; images: string[]; isFourOut: boolean; }) => void;
  initialData?: { images: string[] };
}

const POSTURE_CONTROL_PROMPT = "Change the standing posture of the character in the picture.";

const BG_DERIVATION_PROMPT = `Change the standing posture of the character in the picture. 
Slightly change the background image, keep its tone and style, and adjust the perspective, content elements, details, etc.`;

export const PostureControlForm: React.FC<PostureControlFormProps> = ({ onSubmit, initialData }) => {
  const [imageBase64, setImageBase64] = useState<string | null>(initialData?.images?.[0] || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFourOut, setIsFourOut] = useState(false);
  const [bgDerivation, setBgDerivation] = useState(false);

  const processFile = (file: File | null | undefined) => {
    if (!file) return;
    
    setIsUploading(true);
    setUploadError(null);

    const reader = new FileReader();

    reader.onloadend = () => {
        setImageBase64(reader.result as string);
        setIsUploading(false);
    };

    reader.onerror = () => {
        setUploadError('Failed to read the image file.');
        setIsUploading(false);
    };
    
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        setUploadError(`Invalid file type: ${file.name}. Please upload PNG, JPG, or WEBP.`);
        setIsUploading(false);
        return;
    }
    if (file.size > 4 * 1024 * 1024) {
        setUploadError(`Image too large: ${file.name}. Max size is 4MB.`);
        setIsUploading(false);
        return;
    }

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFile(e.target.files?.[0]);
  };
  
  const handleRemoveImage = () => {
    setImageBase64(null);
    setUploadError(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!imageBase64 || isUploading) {
      if(!imageBase64) setUploadError('Please upload an image.');
      return;
    }
    
    const prompt = bgDerivation ? BG_DERIVATION_PROMPT : POSTURE_CONTROL_PROMPT;

    onSubmit({ prompt: prompt, images: [imageBase64], isFourOut });
    
    handleRemoveImage();
  };
  
  const canSubmit = !isUploading && !!imageBase64;

  return (
    <div className="max-w-7xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-600 mb-2">Image</h3>
            {!imageBase64 ? (
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full h-48 border-2 border-dashed border-fuchsia-300 rounded-lg flex flex-col items-center justify-center text-zinc-500 hover:border-purple-400 hover:text-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Attach image"
                >
                    {isUploading ? <Spinner/> : <>
                        <ImageIcon />
                        <span className="mt-2 text-sm">Click to upload an image</span>
                    </>}
                </button>
            ) : (
                <div className="relative w-48 h-48">
                    <img src={imageBase64} alt="Upload preview" className="w-full h-full rounded-lg object-cover border border-fuchsia-200/50"/>
                    <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-1.5 -right-1.5 bg-white rounded-full p-0.5 text-zinc-600 border border-fuchsia-200/80 hover:bg-fuchsia-50 transition-colors"
                        aria-label="Remove image"
                        disabled={isUploading}
                    >
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>
            )}
           <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/png, image/jpeg, image/webp"
            disabled={isUploading}
          />
          {uploadError && (
              <div className="mt-2 text-red-600 text-sm" role="alert">
                <p>{uploadError}</p>
              </div>
          )}
        </div>
        
        <div className="flex justify-between items-center pt-2">
            <div className="flex items-center gap-2">
                <span id="bg-derivation-label" className={`text-sm font-semibold transition-colors ${isUploading ? 'text-zinc-400' : bgDerivation ? 'text-zinc-700' : 'text-zinc-500'}`}>
                    BG Derivation
                </span>
                <button
                    type="button"
                    role="switch"
                    aria-checked={bgDerivation}
                    aria-labelledby="bg-derivation-label"
                    onClick={() => setBgDerivation(!bgDerivation)}
                    disabled={isUploading}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-fuchsia-50 disabled:opacity-50 disabled:cursor-not-allowed ${bgDerivation ? 'bg-purple-600' : 'bg-zinc-200'}`}
                >
                    <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${bgDerivation ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
            </div>
            <div className="flex items-center gap-2">
                <FourOutSwitch isFourOut={isFourOut} setIsFourOut={setIsFourOut} disabled={isUploading} />
                <button
                    type="submit"
                    disabled={!canSubmit}
                    className="flex items-center justify-center h-10 px-6 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white font-semibold rounded-md hover:from-purple-600 hover:to-fuchsia-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-fuchsia-50 focus:ring-purple-500 transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    aria-label="Generate posture change"
                >
                    <MagicWandIcon />
                    <span className="ml-2">Generate</span>
                </button>
            </div>
        </div>
      </form>
    </div>
  );
};
