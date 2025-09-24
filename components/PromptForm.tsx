import React, { useState, useRef, useEffect } from 'react';
import { Spinner } from './Spinner';
import { MagicWandIcon } from './icons/MagicWandIcon';
import { XIcon } from './icons/XIcon';
import { type PromptPreset } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { FourOutSwitch } from './FourOutSwitch';

interface PromptFormProps {
  onSubmit: (data: { prompt: string; images: string[]; isFourOut: boolean; }) => void;
  presets: PromptPreset[];
  onAddPreset: (preset: { name: string; prompt: string }) => void;
  onDeletePreset: (id: string) => void;
  onTogglePresetModal: () => void;
  initialData?: { prompt: string; images: string[] };
}

const FIGURE_GENERATION_PROMPT = "create a 1/7 scale commercialized figure of the subject in the photo, in a realistic style and environment.Place the figure on a computer desk, using a circular transparent acrylic base without any text. On the computer screen, display the Z Brush modeling process of the figure.Next to the computer screen, place a BANDAI-style toy packaging box printed with the original artwork.The box has a transparent window through which you can see the objects inside. A hand enters the frame from the right side, about to pick up the figure.";
const HIGH_END_PORTRAIT_PROMPT = "将图片转换为摄影棚风格的顶级半身肖像照。人物穿着都市休闲服饰，动作自然放松，镜头特写聚焦面部。背景为柔和的渐变色，层次分明，突出主体与背景的分离。画面氛围静谧而温柔，细腻胶片颗粒质感，柔和定向光轻抚面庞，在眼神处留下光点，营造经典黑白摄影的高级氛围。整体保留大量负空间，简洁呼吸，非中心构图。";
const PATTERN_EXTRACTION_PROMPT = "Extract patterns from clothing. Requirements for extraction are as follows: 1) The original shape and color of the pattern must be restored as much as possible, making it suitable for printing; 2) The pattern must be seamless/tileable; 3) Deformation caused by stretching and wrinkling must be corrected; 4) The fabric texture on the clothing must be removed, leaving only the pattern itself; 5) The pattern must fill the entire image, without any borders.";
const COUPLE_PHOTOSHOOT_PROMPT = "Merge the two models in the image to create a couple fashion portrait. Preserve the print, the models' poses, facial details and the style of their clothing. Every detail is meticulously crafted.";
const TEXT_REPLACEMENT_PROMPT = "Change the text \"【待替换原始文字内容】\" in the image to \"【所需文字内容】\". Leave the rest of the image unchanged. The modified text will match the overall style of the image.";
const PATTERN_BLENDING_PROMPT = "Remove the black or white background from the printed pattern and naturally blend it into the chest area (the entire chest)/ the left chest area (heart position)/ the back area of the garment. At the same time, keep other parts of the clothing unchanged.";
const OOTD_PROMPT = "Generate a flat lay OOTD outfit image from a top-down perspective based on the uploaded reference photo, ensuring the clothing, accessories, and shoes are replicated 1:1 from the reference.";
const MAX_IMAGES = 4;

export const PromptForm: React.FC<PromptFormProps> = ({ onSubmit, presets, onAddPreset, onDeletePreset, onTogglePresetModal, initialData }) => {
  const [prompt, setPrompt] = useState(initialData?.prompt || '');
  const [imageBases64, setImageBases64] = useState<string[]>(initialData?.images || []);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFourOut, setIsFourOut] = useState(false);

  const adjustTextareaHeight = (element: HTMLTextAreaElement | null) => {
    if (element) {
      element.style.height = 'auto';
      element.style.height = `${element.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight(textareaRef.current);
  }, [prompt]);

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
  
  const handleRemoveImage = (indexToRemove: number) => {
    setImageBases64(prev => prev.filter((_, index) => index !== indexToRemove));
    setUploadError(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if ((prompt.trim() || imageBases64.length > 0) && !isUploading) {
      onSubmit({ prompt: prompt.trim(), images: imageBases64, isFourOut });
      setPrompt('');
      setImageBases64([]);
    }
  };
  
  const canSubmit = !isUploading && (!!prompt.trim() || imageBases64.length > 0);

  return (
    <div className="max-w-7xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-600 mb-2">Reference</h3>
          <div className="flex flex-wrap items-center gap-2">
              {imageBases64.map((imgSrc, index) => (
                 <div key={index} className="relative w-16 h-16">
                    <img src={imgSrc} alt={`Upload preview ${index + 1}`} className="w-full h-full rounded-lg object-cover border border-fuchsia-200/50"/>
                    <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute -top-1.5 -right-1.5 bg-white rounded-full p-0.5 text-zinc-600 border border-fuchsia-200/80 hover:bg-fuchsia-50 transition-colors"
                        aria-label="Remove image"
                        disabled={isUploading}
                    >
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>
              ))}
              {imageBases64.length < MAX_IMAGES && (
                   <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading || imageBases64.length >= MAX_IMAGES}
                      className="w-16 h-16 border-2 border-dashed border-fuchsia-300 rounded-lg flex items-center justify-center text-zinc-500 hover:border-purple-400 hover:text-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Attach images"
                  >
                      {isUploading ? <Spinner/> : <PlusIcon />}
                  </button>
              )}
          </div>
           <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/png, image/jpeg, image/webp"
            multiple
            disabled={isUploading || imageBases64.length >= MAX_IMAGES}
          />
          {uploadError && (
              <div className="mt-2 text-red-600 text-sm" role="alert">
                <p>{uploadError}</p>
              </div>
          )}
        </div>

        <div>
            <label htmlFor="prompt-input" className="sr-only">Image Prompt</label>
            <textarea
                id="prompt-input"
                ref={textareaRef}
                rows={6}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onInput={(e) => adjustTextareaHeight(e.currentTarget)}
                placeholder="Please enter a command"
                className="w-full bg-white border border-fuchsia-200 text-zinc-800 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 p-3 rounded-lg text-sm resize-none overflow-y-auto max-h-96"
                disabled={isUploading}
            />
        </div>
            
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
            <div className="flex flex-wrap items-center gap-2 self-start">
                <button
                    type="button"
                    onClick={() => setPrompt(FIGURE_GENERATION_PROMPT)}
                    className="border border-fuchsia-300 text-purple-700 bg-white hover:bg-fuchsia-50 transition-colors px-3 py-1.5 rounded-md text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isUploading}
                >
                    手办生成
                </button>
                <button
                    type="button"
                    onClick={() => setPrompt(HIGH_END_PORTRAIT_PROMPT)}
                    className="border border-fuchsia-300 text-purple-700 bg-white hover:bg-fuchsia-50 transition-colors px-3 py-1.5 rounded-md text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isUploading}
                >
                    高级肖像图
                </button>
                <button
                    type="button"
                    onClick={() => setPrompt(PATTERN_EXTRACTION_PROMPT)}
                    className="border border-fuchsia-300 text-purple-700 bg-white hover:bg-fuchsia-50 transition-colors px-3 py-1.5 rounded-md text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isUploading}
                >
                    花型&图案提取
                </button>
                <button
                    type="button"
                    onClick={() => setPrompt(COUPLE_PHOTOSHOOT_PROMPT)}
                    className="border border-fuchsia-300 text-purple-700 bg-white hover:bg-fuchsia-50 transition-colors px-3 py-1.5 rounded-md text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isUploading}
                >
                    双人合拍
                </button>
                <button
                    type="button"
                    onClick={() => setPrompt(TEXT_REPLACEMENT_PROMPT)}
                    className="border border-fuchsia-300 text-purple-700 bg-white hover:bg-fuchsia-50 transition-colors px-3 py-1.5 rounded-md text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isUploading}
                >
                    印花换字
                </button>
                <button
                    type="button"
                    onClick={() => setPrompt(PATTERN_BLENDING_PROMPT)}
                    className="border border-fuchsia-300 text-purple-700 bg-white hover:bg-fuchsia-50 transition-colors px-3 py-1.5 rounded-md text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isUploading}
                >
                    印花融合
                </button>
                <button
                    type="button"
                    onClick={() => setPrompt(OOTD_PROMPT)}
                    className="border border-fuchsia-300 text-purple-700 bg-white hover:bg-fuchsia-50 transition-colors px-3 py-1.5 rounded-md text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isUploading}
                >
                    OOTD
                </button>
                 {presets.map(p => (
                    <div key={p.id} className="relative group">
                        <button
                            type="button"
                            onClick={() => setPrompt(p.prompt)}
                            className="border border-fuchsia-300 text-purple-700 bg-white hover:bg-fuchsia-50 transition-colors pl-3 pr-6 py-1.5 rounded-md text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isUploading}
                        >
                            {p.name}
                        </button>
                        <button 
                            type="button"
                            onClick={() => onDeletePreset(p.id)}
                            className="absolute top-1/2 -translate-y-1/2 right-1 text-zinc-400 hover:text-red-500 transition-opacity p-0.5 rounded-full opacity-0 group-hover:opacity-100"
                            aria-label={`Delete preset ${p.name}`}
                        >
                            <XIcon className="w-3 h-3"/>
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={onTogglePresetModal}
                    className="flex items-center gap-1 border border-dashed border-fuchsia-400/80 text-purple-700 bg-transparent hover:bg-fuchsia-50 transition-colors px-3 py-1.5 rounded-md text-xs font-medium"
                    aria-label="Add new prompt preset"
                >
                    <PlusIcon /> Add
                </button>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center w-full sm:w-auto justify-end">
                <FourOutSwitch isFourOut={isFourOut} setIsFourOut={setIsFourOut} disabled={isUploading} />
                <button
                    type="submit"
                    disabled={!canSubmit}
                    className="flex items-center justify-center h-10 px-6 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white font-semibold rounded-md hover:from-purple-600 hover:to-fuchsia-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-fuchsia-50 focus:ring-purple-500 transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    aria-label="Generate image"
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