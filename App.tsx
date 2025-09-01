import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { PromptForm } from './components/PromptForm';
import { ImageFeed } from './components/ImageFeed';
import { generateImage as generateImageFromApi, generateFromImageAndText as generateFromImageAndTextFromApi } from './services/geminiService';
import { type GeneratedImage, type PromptPreset } from './types';
import { ApiKeyWindow } from './components/ApiKeyWindow';

function App() {
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(() => localStorage.getItem('gemini-api-key'));
  const [isApiWindowOpen, setIsApiWindowOpen] = useState<boolean>(() => !localStorage.getItem('gemini-api-key'));
  const apiKeyWindowRef = useRef<HTMLDivElement>(null);
  
  const [presets, setPresets] = useState<PromptPreset[]>(() => {
    try {
        const savedPresets = localStorage.getItem('prompt-presets');
        return savedPresets ? JSON.parse(savedPresets) : [];
    } catch (e) {
        console.error("Failed to parse presets from localStorage", e);
        return [];
    }
  });

  useEffect(() => {
    try {
        localStorage.setItem('prompt-presets', JSON.stringify(presets));
    } catch (e) {
        console.error("Failed to save presets to localStorage", e);
    }
  }, [presets]);

  const handleAddPreset = (newPreset: Omit<PromptPreset, 'id'>) => {
    const preset: PromptPreset = {
        ...newPreset,
        id: new Date().getTime().toString()
    };
    setPresets(prev => [...prev, preset]);
  };

  const handleDeletePreset = (id: string) => {
      setPresets(prev => prev.filter(p => p.id !== id));
  };


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (apiKeyWindowRef.current && !apiKeyWindowRef.current.contains(event.target as Node)) {
        if(apiKey) { // Only close if an API key is already set
          setIsApiWindowOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [apiKey]);


  const handleSaveApiKey = (key: string) => {
    localStorage.setItem('gemini-api-key', key);
    setApiKey(key);
    setIsApiWindowOpen(false);
    setError(null);
  };

  const handleGenerateImage = async (data: { prompt: string; images?: string[] }) => {
    const { prompt, images } = data;
    if (!apiKey) {
      setError('Please set your Gemini API key.');
      setIsApiWindowOpen(true);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      let imageUrl: string;
      let usedPrompt = prompt;
      let apiPrompt = prompt;

      if (images && images.length > 0) {
        if (!prompt) {
          apiPrompt = 'Describe what is in these images in detail.';
          usedPrompt = `[${images.length} image${images.length > 1 ? 's' : ''}] (describing images)`;
        } else {
            usedPrompt = `[${images.length} image${images.length > 1 ? 's' : ''}] ${prompt}`;
        }
        imageUrl = await generateFromImageAndTextFromApi(images, apiPrompt, apiKey);
      } else {
        imageUrl = await generateImageFromApi(prompt, apiKey);
      }
      
      const newImage: GeneratedImage = {
        id: new Date().getTime().toString(),
        prompt: usedPrompt,
        imageUrl,
        timestamp: new Date(),
      };
      setHistory((prevHistory) => [newImage, ...prevHistory]);
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        if (err.message.includes('API key is invalid')) {
           setError(err.message);
           setIsApiWindowOpen(true);
        } else {
          setError(`An error occurred: ${err.message}`);
        }
      } else {
        setError('An unknown error occurred while generating the image.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEditImage = async (imageId: string, prompt: string): Promise<void> => {
    if (!apiKey) {
      setError('Please set your Gemini API key.');
      setIsApiWindowOpen(true);
      throw new Error('API Key not set');
    }

    const imageToEdit = history.find(img => img.id === imageId);
    if (!imageToEdit) {
      throw new Error('Image not found');
    }

    try {
      setError(null);
      const newImageUrl = await generateFromImageAndTextFromApi([imageToEdit.imageUrl], prompt, apiKey);
      setHistory(prevHistory =>
        prevHistory.map(img =>
          img.id === imageId
            ? { ...img, imageUrl: newImageUrl, prompt: `${imageToEdit.prompt}\n\nEdit: ${prompt}`, timestamp: new Date() }
            : img
        )
      );
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        if (err.message.includes('API key is invalid')) {
           setError(err.message);
           setIsApiWindowOpen(true);
        } else {
          setError(`An error occurred while editing: ${err.message}`);
        }
      } else {
        setError('An unknown error occurred while editing the image.');
      }
      // Re-throw to let the component know the operation failed
      throw err;
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-pink-100 to-blue-100 text-gray-800 font-sans">
      <Header 
        onToggleSettings={() => setIsApiWindowOpen(prev => !prev)} 
        hasApiKey={!!apiKey} 
      />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-gray-600 mb-6 text-sm md:text-base">
            Describe an image, upload up to 4 images, or combine them. Your creations will appear below.
          </p>
          <PromptForm 
            onSubmit={handleGenerateImage} 
            isLoading={isLoading}
            presets={presets}
            onAddPreset={handleAddPreset}
            onDeletePreset={handleDeletePreset}
          />
          {error && (
            <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md" role="alert">
              <p>{error}</p>
            </div>
          )}
        </div>
        <ImageFeed images={history} onEditImage={handleEditImage} />
      </main>
      <footer className="text-center py-6 text-gray-500 text-xs">
        <p>Powered by Gemini</p>
      </footer>
      {isApiWindowOpen && (
        <div ref={apiKeyWindowRef}>
          <ApiKeyWindow
            onClose={() => setIsApiWindowOpen(false)}
            onSave={handleSaveApiKey}
            currentApiKey={apiKey}
          />
        </div>
      )}
    </div>
  );
}

export default App;
