import React, { useState, useRef } from 'react';
import { Spinner } from './Spinner';
import { XIcon } from './icons/XIcon';
import { MagicWandIcon } from './icons/MagicWandIcon';
import { ImageIcon } from './icons/ImageIcon';
import { FourOutSwitch } from './FourOutSwitch';
import { UserIcon } from './icons/UserIcon';
import { LandscapeIcon } from './icons/LandscapeIcon';


interface FusionPromptFormProps {
  onSubmit: (data: { prompt: string; images: string[]; isFourOut: boolean; }) => void;
  initialData?: { images: string[] };
}

const FUSION_PROMPT = `Leadership: Naturally and authentically integrate the model character into the specified scene. While maintaining the character's core identity, clothing, and facial features, allow for subtle adjustments to the model's posture to enhance realism and interaction with the environment.
Pose Adaptation: The character's pose may be slightly modified to better fit the scene. This could include minor shifts in weight, a slight turn of the head, or small adjustments in arm or leg positions to make the interaction with the environment (e.g., leaning against a wall, standing on uneven ground) appear more natural. The overall pose should remain similar to the original, avoiding drastic changes.
Scale and Position: Ensure that the character stands at a true scale in the scene, with a moderate size, as if naturally existing in the environment. The character should occupy a reasonable foreground or mid-ground position in the frame, avoiding being too small or too large, and forming a harmonious visual balance with the background.
Light and Shadow Integration: Based on the specified scene's light source direction, intensity, and color, reset the character's lighting and shadows to closely match the environmental lighting conditions. The transition between the character and the background should be seamless and natural, with smooth edge integration to avoid any cutting artifacts.
Details and Style: Create a photographic level of realism, with high resolution and sharp clarity. The overall image should present a natural, professional photographic effect.
Environment Integration: The scene should be rendered realistically according to the provided background. All lighting on the character—be it natural sunlight, outdoor ambient light, or indoor artificial light—must be determined by the scene's context. Maintain an eye-level shot for a natural perspective and create a fashionable atmosphere.`;

export const FusionPromptForm: React.FC<FusionPromptFormProps> = ({ onSubmit, initialData }) => {
  const [modelImage, setModelImage] = useState<string | null>(initialData?.images?.[0] || null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(initialData?.images?.[1] || null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const modelFileInputRef = useRef<HTMLInputElement>(null);
  const backgroundFileInputRef = useRef<HTMLInputElement>(null);
  
  const [isFourOut, setIsFourOut] = useState(false);

  const processFile = (file: File | null | undefined, setImage: (img: string | null) => void) => {
    if (!file) return;
    
    setIsUploading(true);
    setUploadError(null);

    const reader = new FileReader();

    reader.onloadend = () => {
        setImage(reader.result as string);
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

  const handleModelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFile(e.target.files?.[0], setModelImage);
  };

  const handleBackgroundFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFile(e.target.files?.[0], setBackgroundImage);
  };
  
  const handleRemoveImage = (imageType: 'model' | 'background') => {
    setUploadError(null);
    if (imageType === 'model') {
        setModelImage(null);
        if (modelFileInputRef.current) modelFileInputRef.current.value = '';
    } else {
        setBackgroundImage(null);
        if (backgroundFileInputRef.current) backgroundFileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!modelImage || !backgroundImage || isUploading) {
      if(!modelImage || !backgroundImage) setUploadError('Please upload both a model and a background image.');
      return;
    }
    
    onSubmit({ prompt: FUSION_PROMPT, images: [modelImage, backgroundImage], isFourOut });
    
    handleRemoveImage('model');
    handleRemoveImage('background');
  };
  
  const canSubmit = !isUploading && !!modelImage && !!backgroundImage;

  const ImageUploader = ({
    title,
    icon,
    imageBase64,
    onFileChange,
    onRemove,
    fileInputRef,
    disabled
  }: {
    title: string,
    icon: React.ReactNode,
    imageBase64: string | null,
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    onRemove: () => void,
    fileInputRef: React.RefObject<HTMLInputElement>,
    disabled: boolean
  }) => (
    <div>
        <h3 className="text-sm font-semibold text-zinc-600 mb-2 flex items-center gap-2">{icon} {title}</h3>
        {!imageBase64 ? (
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="w-full h-48 border-2 border-dashed border-fuchsia-300 rounded-lg flex flex-col items-center justify-center text-zinc-500 hover:border-purple-400 hover:text-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label={`Attach ${title}`}
            >
                {isUploading ? <Spinner/> : <>
                    <ImageIcon />
                    <span className="mt-2 text-sm">Click to upload</span>
                </>}
            </button>
        ) : (
            <div className="relative w-48 h-48">
                <img src={imageBase64} alt={`${title} preview`} className="w-full h-full rounded-lg object-cover border border-fuchsia-200/50"/>
                <button
                    type="button"
                    onClick={onRemove}
                    className="absolute -top-1.5 -right-1.5 bg-white rounded-full p-0.5 text-zinc-600 border border-fuchsia-200/80 hover:bg-fuchsia-50 transition-colors"
                    aria-label={`Remove ${title}`}
                    disabled={disabled}
                >
                    <XIcon className="w-4 h-4" />
                </button>
            </div>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileChange}
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
          disabled={disabled}
        />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ImageUploader 
            title="Model Image"
            icon={<UserIcon />}
            imageBase64={modelImage}
            onFileChange={handleModelFileChange}
            onRemove={() => handleRemoveImage('model')}
            fileInputRef={modelFileInputRef}
            disabled={isUploading}
          />
          <ImageUploader
            title="Background Image"
            icon={<LandscapeIcon />}
            imageBase64={backgroundImage}
            onFileChange={handleBackgroundFileChange}
            onRemove={() => handleRemoveImage('background')}
            fileInputRef={backgroundFileInputRef}
            disabled={isUploading}
          />
        </div>

        {uploadError && (
            <div className="text-red-600 text-sm" role="alert">
              <p>{uploadError}</p>
            </div>
        )}
        
        <div className="flex justify-end pt-2 items-center gap-2">
            <FourOutSwitch isFourOut={isFourOut} setIsFourOut={setIsFourOut} disabled={isUploading} />
            <button
                type="submit"
                disabled={!canSubmit}
                className="flex items-center justify-center h-10 px-6 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white font-semibold rounded-md hover:from-purple-600 hover:to-fuchsia-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-fuchsia-50 focus:ring-purple-500 transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                aria-label="Generate fusion image"
            >
                <MagicWandIcon />
                <span className="ml-2">Generate</span>
            </button>
        </div>
      </form>
    </div>
  );
};