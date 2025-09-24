import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PromptForm } from './components/PromptForm';
import { ImageFeed } from './components/ImageFeed';
import { generateImage as generateImageFromApi, generateFromImageAndText as generateFromImageAndTextFromApi } from './services/geminiService';
import { type Task, type PromptPreset, type View } from './types';
import { ImageModal } from './components/ImageModal';
import { ModelPromptForm } from './components/ModelPromptForm';
import { UserIcon } from './components/icons/UserIcon';
import { BackgroundPromptForm } from './components/BackgroundPromptForm';
import { LandscapeIcon } from './components/icons/LandscapeIcon';
import { PostureControlForm } from './components/PostureControlForm';
import { BodyIcon } from './components/icons/BodyIcon';
import { useMediaQuery } from './hooks/useMediaQuery';
import { BottomNavBar } from './components/BottomNavBar';
import { CreateIcon } from './components/icons/CreateIcon';
import { FusionIcon } from './components/icons/FusionIcon';
import { FusionPromptForm } from './components/FusionPromptForm';
import { AddPresetModal } from './components/AddPresetModal';
import { VirtualTryOnForm } from './components/VirtualTryOnForm';
import { TryOnIcon } from './components/icons/TryOnIcon';

interface EnlargedImageState {
  images: string[];
  currentIndex: number;
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [enlargedImageState, setEnlargedImageState] = useState<EnlargedImageState | null>(null);
  const [activeView, setActiveView] = useState<View>('create');
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const isResizing = useRef(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [initialFormData, setInitialFormData] = useState<{ view: View; data: { prompt?: string; images: string[] } } | null>(null);
  const [formKey, setFormKey] = useState(Date.now());
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      isResizing.current = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
  };

  const handleMouseUp = useCallback(() => {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
      }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
      if (isResizing.current) {
          const newWidth = Math.max(200, Math.min(e.clientX, 500));
          setSidebarWidth(newWidth);
      }
  }, []);

  useEffect(() => {
    if (isMobile) {
      if (isResizing.current) {
        // Cleanup if we switch to mobile during a resize
        isResizing.current = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
      }
      return; // Don't attach listeners on mobile
    }
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
      
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isMobile, handleMouseMove, handleMouseUp]);
  
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


  const handleCreateTask = (prompt: string, images: string[] | undefined, view: View, isFourOut: boolean = false) => {
    
    const apiPrompt = (images && images.length > 0 && !prompt.trim())
      ? 'Describe what is in these images in detail.'
      : prompt;

    const runGeneration = async (taskId: string, currentAttempt: number) => {
      try {
        const imageUrl = images && images.length > 0
          ? await generateFromImageAndTextFromApi(images, apiPrompt)
          : await generateImageFromApi(apiPrompt);
        
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === taskId
              ? { ...task, status: 'completed', outputImageUrl: imageUrl, timestamp: new Date() }
              : task
          )
        );
      } catch (err) {
        console.error(`Attempt ${currentAttempt} failed for task ${taskId}:`, err);

        if (currentAttempt < 5) {
            setTasks(prevTasks => 
                prevTasks.map(task => 
                    task.id === taskId
                        ? {...task, status: 'pending', retryCount: currentAttempt }
                        : task
                )
            );
            const delay = Math.pow(2, currentAttempt) * 1000 + Math.random() * 1000;
            setTimeout(() => runGeneration(taskId, currentAttempt + 1), delay);
        } else {
            let errorMessage = 'An unknown error occurred while generating the image.';
            if (err instanceof Error) {
                errorMessage = err.message;
            }
            setTasks(prevTasks =>
              prevTasks.map(task =>
                task.id === taskId
                  ? { ...task, status: 'error', error: errorMessage }
                  : task
              )
            );
        }
      }
    };
    
    const taskCount = isFourOut ? 4 : 1;
    const batchId = isFourOut ? new Date().getTime().toString() : undefined;
    const newTasks: Task[] = [];

    for (let i = 0; i < taskCount; i++) {
        const taskId = `${new Date().getTime().toString()}-${i}`;
        newTasks.push({
            id: taskId,
            prompt: prompt,
            inputImages: images,
            status: 'pending',
            timestamp: new Date(),
            retryCount: 0,
            view: view,
            batchId: batchId,
        });
    }

    setTasks(prevTasks => [...newTasks, ...prevTasks]);

    newTasks.forEach(task => {
        runGeneration(task.id, 1);
    });
  };

  const handleInsert = (task: Task) => {
    setInitialFormData({
        view: task.view,
        data: {
            prompt: task.prompt,
            images: task.inputImages || [],
        }
    });
    setActiveView(task.view);
    setFormKey(Date.now());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleEnlargeImage = (images: string[], index: number) => {
    setEnlargedImageState({ images, currentIndex: index });
  };

  const handleCloseModal = () => {
    setEnlargedImageState(null);
  };
  
  const handleNextImage = () => {
    setEnlargedImageState(prevState => {
      if (!prevState) return null;
      const nextIndex = (prevState.currentIndex + 1) % prevState.images.length;
      return { ...prevState, currentIndex: nextIndex };
    });
  };

  const handlePreviousImage = () => {
    setEnlargedImageState(prevState => {
      if (!prevState) return null;
      const prevIndex = (prevState.currentIndex - 1 + prevState.images.length) % prevState.images.length;
      return { ...prevState, currentIndex: prevIndex };
    });
  };

  const visibleTasks = tasks.filter(task => task.view === activeView);

  return (
    <div className="flex h-screen bg-transparent font-sans text-zinc-800">
      {!isMobile && (
        <>
            <aside 
                style={{ width: `${sidebarWidth}px` }}
                className="flex-shrink-0 border-r border-fuchsia-200/50 flex flex-col p-4 bg-white"
            >
                <div className="px-2">
                <h1 className="text-xl font-bold text-zinc-900">MKCC</h1>
                <p className="text-xs text-zinc-500">MUSE KOL Customization Center</p>
                </div>
                <nav className="mt-8">
                    <ul className="space-y-1">
                        <li>
                            <button
                                onClick={() => setActiveView('create')}
                                className={`flex items-center gap-3 px-2 py-2 w-full text-left rounded-md transition-colors ${activeView === 'create' ? 'bg-fuchsia-100 text-purple-700 font-semibold' : 'text-zinc-600 hover:bg-fuchsia-100/50 hover:text-purple-700'}`}
                            >
                                <CreateIcon />
                                <span>Create</span>
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveView('model')}
                                className={`flex items-center gap-3 px-2 py-2 w-full text-left rounded-md transition-colors ${activeView === 'model' ? 'bg-fuchsia-100 text-purple-700 font-semibold' : 'text-zinc-600 hover:bg-fuchsia-100/50 hover:text-purple-700'}`}
                            >
                                <UserIcon />
                                <span>Model Generate</span>
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveView('try-on')}
                                className={`flex items-center gap-3 px-2 py-2 w-full text-left rounded-md transition-colors ${activeView === 'try-on' ? 'bg-fuchsia-100 text-purple-700 font-semibold' : 'text-zinc-600 hover:bg-fuchsia-100/50 hover:text-purple-700'}`}
                            >
                                <TryOnIcon />
                                <span>Virtual Try-on</span>
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveView('posture')}
                                className={`flex items-center gap-3 px-2 py-2 w-full text-left rounded-md transition-colors ${activeView === 'posture' ? 'bg-fuchsia-100 text-purple-700 font-semibold' : 'text-zinc-600 hover:bg-fuchsia-100/50 hover:text-purple-700'}`}
                            >
                                <BodyIcon />
                                <span>Posture Control</span>
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveView('background')}
                                className={`flex items-center gap-3 px-2 py-2 w-full text-left rounded-md transition-colors ${activeView === 'background' ? 'bg-fuchsia-100 text-purple-700 font-semibold' : 'text-zinc-600 hover:bg-fuchsia-100/50 hover:text-purple-700'}`}
                            >
                                <LandscapeIcon />
                                <span>Background Extraction</span>
                            </button>
                        </li>
                         <li>
                            <button
                                onClick={() => setActiveView('fusion')}
                                className={`flex items-center gap-3 px-2 py-2 w-full text-left rounded-md transition-colors ${activeView === 'fusion' ? 'bg-fuchsia-100 text-purple-700 font-semibold' : 'text-zinc-600 hover:bg-fuchsia-100/50 hover:text-purple-700'}`}
                            >
                                <FusionIcon />
                                <span>Fusion</span>
                            </button>
                        </li>
                    </ul>
                </nav>
                <div className="mt-auto pt-8">
                </div>
            </aside>
      
            <div
                onMouseDown={handleMouseDown}
                className="w-1.5 cursor-col-resize bg-fuchsia-100/50 hover:bg-fuchsia-200/50 transition-colors flex-shrink-0"
                aria-label="Resize sidebar"
                role="separator"
            />
        </>
      )}

      <main className={`flex-1 flex flex-col overflow-hidden ${isMobile ? 'pb-16' : ''}`}>
        <div className="p-4 sm:p-6 border-b border-fuchsia-200/50 bg-white" key={formKey}>
          {activeView === 'create' && (
            <PromptForm 
              onSubmit={({prompt, images, isFourOut}) => handleCreateTask(prompt, images, 'create', isFourOut)} 
              presets={presets}
              onAddPreset={handleAddPreset}
              onDeletePreset={handleDeletePreset}
              onTogglePresetModal={() => setIsPresetModalOpen(true)}
              initialData={initialFormData?.view === 'create' ? initialFormData.data : undefined}
            />
          )}
           {activeView === 'model' && (
             <ModelPromptForm 
               onSubmit={({prompt, images, isFourOut}) => handleCreateTask(prompt, images, 'model', isFourOut)} 
               initialData={initialFormData?.view === 'model' ? initialFormData.data : undefined}
            />
          )}
           {activeView === 'try-on' && (
             <VirtualTryOnForm 
               onSubmit={({prompt, images, isFourOut}) => handleCreateTask(prompt, images, 'try-on', isFourOut)} 
               initialData={initialFormData?.view === 'try-on' ? initialFormData.data : undefined}
            />
          )}
          {activeView === 'posture' && (
             <PostureControlForm 
               onSubmit={({prompt, images, isFourOut}) => handleCreateTask(prompt, images, 'posture', isFourOut)} 
               initialData={initialFormData?.view === 'posture' ? initialFormData.data : undefined}
            />
          )}
          {activeView === 'background' && (
             <BackgroundPromptForm 
               onSubmit={({prompt, images, isFourOut}) => handleCreateTask(prompt, images, 'background', isFourOut)} 
               initialData={initialFormData?.view === 'background' ? initialFormData.data : undefined}
            />
          )}
           {activeView === 'fusion' && (
             <FusionPromptForm 
               onSubmit={({prompt, images, isFourOut}) => handleCreateTask(prompt, images, 'fusion', isFourOut)} 
               initialData={initialFormData?.view === 'fusion' ? initialFormData.data : undefined}
            />
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <ImageFeed tasks={visibleTasks} onCreateTask={handleCreateTask} onEnlargeImage={handleEnlargeImage} onInsert={handleInsert}/>
        </div>

        <footer className="text-center p-4 border-t border-fuchsia-200/50 bg-fuchsia-50/80 backdrop-blur-sm">
          <p className="text-xs text-zinc-500">Model Powered by Google Gemini</p>
          <p className="text-xs text-zinc-500">Built with Google AI Studio</p>
          <p className="text-xs text-zinc-500">Created by Ryan G</p>
        </footer>
      </main>

      {isMobile && <BottomNavBar activeView={activeView} setActiveView={setActiveView} />}

      {enlargedImageState && (
        <ImageModal 
            images={enlargedImageState.images}
            currentIndex={enlargedImageState.currentIndex}
            onClose={handleCloseModal} 
            onNext={handleNextImage}
            onPrevious={handlePreviousImage}
        />
      )}

      {isPresetModalOpen && (
        <AddPresetModal
            onClose={() => setIsPresetModalOpen(false)}
            onSave={handleAddPreset}
        />
      )}
    </div>
  );
}

export default App;