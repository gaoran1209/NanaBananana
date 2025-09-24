import React, { useState, useRef } from 'react';
import { Spinner } from './Spinner';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { XIcon } from './icons/XIcon';
import { MagicWandIcon } from './icons/MagicWandIcon';
import { FourOutSwitch } from './FourOutSwitch';

interface ModelPromptFormProps {
  onSubmit: (data: { prompt: string; images: string[]; isFourOut: boolean; }) => void;
  initialData?: { images: string[]; };
}

const DEFAULT_MODEL_PROMPT = "生成图中人物的单人棚拍定妆模特照。要求保持人物外貌、面部细节和特征、身材体型、肤色和妆容不变。去除帽子、眼镜等配饰。人物身穿基础款白色无肩带修身瑜伽上衣短裤，脚穿黑色运动鞋。人物使用自然的模特姿势。摄影棚打光效果，画面中间高亮，灰白色背景，高级质感";
const MAX_IMAGES = 4;

export const ModelPromptForm: React.FC<ModelPromptFormProps> = ({ onSubmit, initialData }) => {
  const [skinTone, setSkinTone] = useState('');
  const [bodyShape, setBodyShape] = useState('');
  const [otherDesc, setOtherDesc] = useState('');
  const [imageBases64, setImageBases64] = useState<string[]>(initialData?.images || []);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isFourOut, setIsFourOut] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (imageBases64.length === 0 || isUploading) {
      if(imageBases64.length === 0) setUploadError('Please upload at least one image.');
      return;
    }

    let finalPrompt = DEFAULT_MODEL_PROMPT;
    if (skinTone.trim()) finalPrompt = finalPrompt.replace('肤色', `肤色为${skinTone.trim()}`);
    if (bodyShape.trim()) finalPrompt = finalPrompt.replace('身材体型', `身材体型为${bodyShape.trim()}`);
    if (otherDesc.trim()) finalPrompt = finalPrompt.replace('妆容不变。',`妆容不变，并包含以下特征：${otherDesc.trim()}。`);
    
    onSubmit({ prompt: finalPrompt, images: imageBases64, isFourOut });
    
    setSkinTone('');
    setBodyShape('');
    setOtherDesc('');
    setImageBases64([]);
    setUploadError(null);
  };

    const processFiles = (files: FileList | null | undefined) => {
        if (!files || files.length === 0) return;
        if (imageBases64.length + files.length > MAX_IMAGES) {
            setUploadError(`You can upload a maximum of ${MAX_IMAGES} images.`);
            return;
        }
        setIsUploading(true); setUploadError(null);
        const filePromises = Array.from(files).map(file => new Promise<string>((resolve, reject) => {
            const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
            if (!allowedTypes.includes(file.type)) return reject(`Invalid file type: ${file.name}.`);
            if (file.size > 4 * 1024 * 1024) return reject(`Image too large: ${file.name}. Max size is 4MB.`);
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => reject('Failed to read an image file.');
            reader.readAsDataURL(file);
        }));
        Promise.all(filePromises).then(newImages => setImageBases64((prev: string[]) => [...prev, ...newImages]))
            .catch(errorMsg => setUploadError(errorMsg))
            .finally(() => {
                setIsUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            });
    };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => processFiles(e.target.files);
    const handleRemoveImage = (indexToRemove: number) => {
        setImageBases64((prev: string[]) => prev.filter((_, index) => index !== indexToRemove));
        setUploadError(null);
    };
    const canSubmit = !isUploading && imageBases64.length > 0;

  return (
    <div className="max-w-7xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
            <div>
                <h3 className="text-sm font-semibold text-zinc-600 mb-2">Reference Model</h3>
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading || imageBases64.length >= MAX_IMAGES} className="w-full border-2 border-dashed border-fuchsia-300 rounded-lg p-4 text-center text-zinc-500 hover:border-purple-400 hover:text-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors">
                    {isUploading ? <Spinner/> : <PaperclipIcon />}
                    <span>{isUploading ? 'Uploading...' : `Attach Images (${imageBases64.length}/${MAX_IMAGES})`}</span>
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg, image/webp" multiple disabled={isUploading || imageBases64.length >= MAX_IMAGES} />
                {imageBases64.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        {imageBases64.map((imgSrc: string, index: number) => (
                            <div key={index} className="relative w-16 h-16">
                                <img src={imgSrc} alt={`Upload preview ${index + 1}`} className="w-full h-full rounded-lg object-cover border border-fuchsia-200/50" />
                                <button type="button" onClick={() => handleRemoveImage(index)} className="absolute -top-1.5 -right-1.5 bg-white rounded-full p-0.5 text-zinc-600 border border-fuchsia-200/80 hover:bg-fuchsia-50 transition-colors" aria-label="Remove image" disabled={isUploading}><XIcon className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>
                )}
                {uploadError && <div className="mt-2 text-red-600 text-sm" role="alert"><p>{uploadError}</p></div>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="skin-tone" className="block text-sm font-medium text-zinc-600 mb-1">Skin Tone</label>
                    <input id="skin-tone" type="text" value={skinTone} onChange={e => setSkinTone(e.target.value)} placeholder="e.g., fair skin" className="w-full bg-white border border-fuchsia-200 text-zinc-800 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg text-sm px-3 py-2" disabled={isUploading} />
                </div>
                <div>
                    <label htmlFor="body-shape" className="block text-sm font-medium text-zinc-600 mb-1">Body Shape</label>
                    <input id="body-shape" type="text" value={bodyShape} onChange={e => setBodyShape(e.target.value)} placeholder="e.g., hourglass figure" className="w-full bg-white border border-fuchsia-200 text-zinc-800 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg text-sm px-3 py-2" disabled={isUploading} />
                </div>
                <div>
                    <label htmlFor="other-desc" className="block text-sm font-medium text-zinc-600 mb-1">Other</label>
                    <input id="other-desc" type="text" value={otherDesc} onChange={e => setOtherDesc(e.target.value)} placeholder="e.g., muscular lines" className="w-full bg-white border border-fuchsia-200 text-zinc-800 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg text-sm px-3 py-2" disabled={isUploading} />
                </div>
            </div>
            <div className="flex justify-end pt-2 items-center gap-2">
                <FourOutSwitch isFourOut={isFourOut} setIsFourOut={setIsFourOut} disabled={isUploading} />
                <button type="submit" disabled={!canSubmit} className="flex items-center justify-center h-10 px-6 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white font-semibold rounded-md hover:from-purple-600 hover:to-fuchsia-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-fuchsia-50 focus:ring-purple-500 transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed" aria-label="Generate model image">
                    <MagicWandIcon /><span className="ml-2">Generate</span>
                </button>
            </div>
        </div>
      </form>
    </div>
  );
};