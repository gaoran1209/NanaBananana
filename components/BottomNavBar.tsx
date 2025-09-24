import React from 'react';
import { type View } from '../types';
import { CreateIcon } from './icons/CreateIcon';
import { UserIcon } from './icons/UserIcon';
import { BodyIcon } from './icons/BodyIcon';
import { LandscapeIcon } from './icons/LandscapeIcon';
import { FusionIcon } from './icons/FusionIcon';
import { TryOnIcon } from './icons/TryOnIcon';

interface BottomNavBarProps {
  activeView: View;
  setActiveView: (view: View) => void;
}

const navItems = [
    { view: 'create', label: 'Create', icon: <CreateIcon /> },
    { view: 'model', label: 'Model', icon: <UserIcon /> },
    { view: 'try-on', label: 'Try-on', icon: <TryOnIcon /> },
    { view: 'posture', label: 'Posture', icon: <BodyIcon /> },
    { view: 'background', label: 'Background', icon: <LandscapeIcon /> },
    { view: 'fusion', label: 'Fusion', icon: <FusionIcon /> },
] as const;

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeView, setActiveView }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/70 backdrop-blur-lg border-t border-fuchsia-200/50 z-50">
      <ul className="flex justify-around items-stretch h-16">
        {navItems.map(item => (
          <li key={item.view} className="flex-1">
            <button
              onClick={() => setActiveView(item.view)}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
                activeView === item.view ? 'text-purple-600' : 'text-zinc-500 hover:text-purple-600'
              }`}
            >
              {item.icon}
              <span className={`text-xs transition-all ${activeView === item.view ? 'font-semibold' : 'font-normal'}`}>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};