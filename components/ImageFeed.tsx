import React from 'react';
import { type Task, type View } from '../types';
import { ImageCard } from './ImageCard';

interface ImageFeedProps {
  tasks: Task[];
  onCreateTask: (prompt: string, images: string[] | undefined, view: View, isFourOut?: boolean) => void;
  onEnlargeImage: (images: string[], index: number) => void;
  onInsert: (task: Task) => void;
}

export const ImageFeed: React.FC<ImageFeedProps> = ({ tasks, onCreateTask, onEnlargeImage, onInsert }) => {
  if (tasks.length === 0) {
    return (
      <div className="mt-16 text-center text-zinc-500">
        <p className="text-base">Your creations will appear here.</p>
      </div>
    );
  }

  // FIX: Explicitly typed arguments for array methods (`sort`, `map`) to resolve "Property ... does not
  // exist on type 'unknown'" errors. This is necessary because type inference for `Object.values` was failing
  // in the component's environment, despite the type assertion on the initial value of `reduce`.
  type DateGroup = { displayDate: string; tasks: Task[] };

  const groupedTasksByDate = tasks.reduce((acc, task) => {
    const date = new Date(task.timestamp);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

    if (!acc[dateKey]) {
      acc[dateKey] = {
        displayDate: new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }).format(date),
        tasks: [],
      };
    }
    acc[dateKey].tasks.push(task);
    return acc;
  }, {} as Record<string, DateGroup>);

  const sortedGroups = Object.values(groupedTasksByDate).sort((a: DateGroup, b: DateGroup) => {
      return new Date(b.tasks[0].timestamp).getTime() - new Date(a.tasks[0].timestamp).getTime();
  });

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {sortedGroups.map((group: DateGroup) => {
        const taskGroups: Task[][] = [];
        const processedIds = new Set<string>();

        group.tasks.forEach(task => {
            if (processedIds.has(task.id)) return;

            if (task.batchId) {
                const batch = group.tasks.filter(t => t.batchId === task.batchId);
                taskGroups.push(batch);
                batch.forEach(t => processedIds.add(t.id));
            } else {
                taskGroups.push([task]);
                processedIds.add(task.id);
            }
        });

        return (
          <section key={group.displayDate} aria-labelledby={`header-${group.displayDate.replace(/\s/g, '-')}`}>
            <h2 id={`header-${group.displayDate.replace(/\s/g, '-')}`} className="text-sm font-semibold text-zinc-600 mb-4">
              {group.displayDate}
            </h2>
            <div className="space-y-6">
              {taskGroups.map((taskGroup) => (
                <ImageCard key={taskGroup[0].id} tasks={taskGroup} onCreateTask={onCreateTask} onEnlargeImage={onEnlargeImage} onInsert={onInsert} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};