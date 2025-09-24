import React, { useState, useRef, useEffect } from 'react';
import { type Task, type View, type TaskStatus } from '../types';
import { PencilIcon } from './icons/PencilIcon';
import { Spinner } from './Spinner';
import { DownloadIcon } from './icons/DownloadIcon';
import { XIcon } from './icons/XIcon';
import { MagicWandIcon } from './icons/MagicWandIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { ZoomInIcon } from './icons/ZoomInIcon';
import { InsertIcon } from './icons/InsertIcon';

interface ImageCardProps {
  tasks: Task[];
  onCreateTask: (prompt: string, images: string[] | undefined, view: View, isFourOut: boolean) => void;
  onEnlargeImage: (images: string[], index: number) => void;
  onInsert: (task: Task) => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({ tasks, onCreateTask, onEnlargeImage, onInsert }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  
  const promptRef = useRef<HTMLParagraphElement>(null);
  const promptContainerRef = useRef<HTMLDivElement>(null);

  const mainTask = tasks[0];
  const isBatch = tasks.length > 1;

  useEffect(() => {
    const checkOverflow = () => {
      setTimeout(() => {
        if (isExpanded) {
            setShowToggle(true);
            return;
        }
        const promptElement = promptRef.current;
        const containerElement = promptContainerRef.current;
        if (promptElement && containerElement) {
          const hasOverflow = promptElement.scrollHeight > containerElement.clientHeight;
          setShowToggle(hasOverflow);
        }
      }, 50);
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);

    return () => {
      window.removeEventListener('resize', checkOverflow);
    };
  }, [mainTask.prompt, isExpanded]);


  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const firstCompleted = tasks.find(t => t.outputImageUrl);
    if (!editPrompt.trim() || !firstCompleted?.outputImageUrl) return;
    
    onCreateTask(editPrompt, [firstCompleted.outputImageUrl], mainTask.view, false);
    setIsEditing(false);
    setEditPrompt('');
  };

  const handleDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;

    const sanitizedPrompt = mainTask.prompt
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .substring(0, 50);

    const filename = `imagegen-${sanitizedPrompt || 'creation'}.jpeg`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleRerun = () => {
    onCreateTask(mainTask.prompt, mainTask.inputImages || [], mainTask.view, tasks.length > 1);
  };

  const getGroupStatus = (tasks: Task[]): TaskStatus => {
    if (tasks.some(t => t.status === 'error')) return 'error';
    if (tasks.every(t => t.status === 'completed')) return 'completed';
    return 'pending';
  };

  const groupStatus = getGroupStatus(tasks);
  const groupError = tasks.find(t => t.status === 'error')?.error;
  const completedTasks = tasks.filter(t => t.status === 'completed' && t.outputImageUrl);
  const completedImageUrls = completedTasks.map(t => t.outputImageUrl!);

  const timeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 5) return "just now";
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };
  
  const inputsSection = mainTask.inputImages && mainTask.inputImages.length > 0 && (
    <div className="p-4 border-t border-fuchsia-200/50">
      <h4 className="text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wider">Inputs</h4>
      <div className="flex flex-wrap gap-2">
        {mainTask.inputImages.map((src, index) => (
          <button
            key={index}
            onClick={() => onEnlargeImage(mainTask.inputImages!, index)}
            className="w-10 h-10 rounded-md overflow-hidden border-2 border-transparent shadow-sm transition-transform hover:scale-105 hover:border-purple-500"
            aria-label={`Enlarge input image ${index + 1}`}
          >
            <img 
              src={src} 
              alt={`Input ${index + 1}`} 
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white/60 border border-fuchsia-200/50 rounded-2xl shadow-lg backdrop-blur-sm overflow-hidden flex flex-col lg:flex-row animate-fade-in">
      <div className={`flex flex-col bg-zinc-100/50 ${isBatch ? 'lg:flex-[3]' : 'lg:w-96 lg:flex-shrink-0'}`}>
        {isBatch ? (
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => {
              const task = tasks[index];
              const currentImageIndex = task?.outputImageUrl ? completedImageUrls.indexOf(task.outputImageUrl) : -1;
              return (
                <div key={task?.id || index} className="relative bg-zinc-100 group aspect-square">
                  {task?.status === 'completed' && task.outputImageUrl ? (
                    <>
                      <img src={task.outputImageUrl} alt={task.prompt} className="w-full h-full object-cover"/>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button onClick={() => onEnlargeImage(completedImageUrls, currentImageIndex)} className="text-white hover:scale-110 transition-transform" aria-label="Enlarge image"><ZoomInIcon /></button>
                        <button onClick={() => handleDownload(task.outputImageUrl!)} className="text-white hover:scale-110 transition-transform" aria-label="Download image"><DownloadIcon/></button>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {task?.status === 'error' ? <XIcon className="w-6 h-6 text-red-500"/> : <Spinner/>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="relative w-full aspect-square">
            {groupStatus === 'pending' && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10 text-center p-4">
                <Spinner />
                <span className="mt-3 text-white font-medium">Generating...</span>
                {mainTask.retryCount && mainTask.retryCount > 0 && (
                    <p className="text-xs text-zinc-100 mt-2 animate-pulse">
                        任务第{mainTask.retryCount}次执行失败，重跑中……
                    </p>
                )}
              </div>
            )}
            {groupStatus === 'error' && (
               <div className="absolute inset-0 bg-red-100/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 text-center p-4">
                <div className="w-10 h-10 bg-red-500/20 text-red-500 flex items-center justify-center rounded-full mb-3">
                   <XIcon className="w-6 h-6" />
                </div>
                <p className="text-red-700 font-semibold">Generation Failed</p>
                <p className="text-red-600 text-xs mt-1 max-w-xs">{groupError}</p>
              </div>
            )}
            <div className="w-full h-full">
              {completedTasks.length > 0 ? (
                  <button
                    className="w-full h-full cursor-zoom-in group"
                    onClick={() => onEnlargeImage([completedTasks[0].outputImageUrl!], 0)}
                    aria-label="Enlarge image"
                  >
                    <img
                      src={completedTasks[0].outputImageUrl!}
                      alt={mainTask.prompt}
                      className="w-full h-full object-cover transition-opacity group-hover:opacity-90"
                    />
                  </button>
              ) : (
                <div className="w-full h-full flex items-center justify-center overflow-hidden">
                     {mainTask.inputImages && mainTask.inputImages.length > 0 ? (
                         <img src={mainTask.inputImages[0]} alt="Input preview" className="w-full h-full object-contain opacity-10 scale-105" />
                     ) : (
                        <div className="text-zinc-300">
                            <MagicWandIcon />
                        </div>
                     )}
                </div>
              )}
            </div>
          </div>
        )}
        {inputsSection}
      </div>

      <div className={`p-4 flex flex-col min-w-0 ${isBatch ? 'lg:flex-[1.5]' : 'lg:flex-1'}`}>
        <div 
          ref={promptContainerRef} 
          className={`flex-grow min-h-0 relative ${isExpanded ? 'overflow-y-auto' : 'overflow-hidden'}`}
        >
          <p ref={promptRef} className="text-zinc-800 text-sm leading-relaxed whitespace-pre-wrap pr-2">
            {mainTask.prompt ? mainTask.prompt : (mainTask.inputImages && mainTask.inputImages.length > 0 ? <span className="text-zinc-400 italic">Image analysis...</span> : '')}
          </p>
          {!isExpanded && showToggle && (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white/60 to-transparent pointer-events-none" />
          )}
        </div>
        {showToggle && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-semibold text-zinc-500 hover:text-purple-600 mt-2 self-start"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
        
        {isEditing && groupStatus === 'completed' && !isBatch && (
          <div className="mt-4 animate-fade-in pt-4 border-t border-fuchsia-200/50">
            <form onSubmit={handleEditSubmit}>
              <label htmlFor={`edit-prompt-${mainTask.id}`} className="sr-only">Edit Prompt</label>
              <input
                id={`edit-prompt-${mainTask.id}`}
                type="text"
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="e.g., 'Make the sky purple'"
                className="w-full bg-fuchsia-50 border border-fuchsia-200 rounded-md text-zinc-800 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 px-3 py-2 text-sm"
              />
              <div className="flex items-center justify-end gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors border border-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editPrompt.trim()}
                  className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white hover:from-purple-600 hover:to-fuchsia-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply Edit
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="flex justify-between items-center mt-auto pt-4 border-t border-fuchsia-200/50">
          <p className="text-xs text-zinc-500">{timeAgo(mainTask.timestamp)}</p>
          <div className="flex items-center gap-3">
            {groupStatus === 'completed' && !isBatch && (
              <>
                <button 
                  onClick={() => handleDownload(completedTasks[0].outputImageUrl!)}
                  className="text-zinc-500 hover:text-purple-600 transition-colors duration-200"
                  aria-label="Download image"
                >
                  <DownloadIcon />
                </button>
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-zinc-500 hover:text-purple-600 transition-colors duration-200"
                  aria-label="Edit image"
                >
                  <PencilIcon />
                </button>
              </>
            )}
            <button
                onClick={() => onInsert(mainTask)}
                className="text-zinc-500 hover:text-purple-600 transition-colors duration-200"
                aria-label="Insert data into prompt form"
                title="置入"
            >
                <InsertIcon />
            </button>
             <button 
              onClick={handleRerun}
              className="text-zinc-500 hover:text-purple-600 transition-colors duration-200"
              aria-label="Rerun generation"
            >
              <RefreshIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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