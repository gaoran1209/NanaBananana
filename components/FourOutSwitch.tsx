import React from 'react';

interface FourOutSwitchProps {
  isFourOut: boolean;
  setIsFourOut: (value: boolean) => void;
  disabled?: boolean;
}

export const FourOutSwitch: React.FC<FourOutSwitchProps> = ({ isFourOut, setIsFourOut, disabled }) => {
  return (
    <div className="flex items-center gap-2">
      <span
        id="4-outputs-label"
        className={`text-sm font-semibold transition-colors ${
          disabled ? 'text-zinc-400' : isFourOut ? 'text-zinc-700' : 'text-zinc-500'
        }`}
      >
        4 Outputs
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={isFourOut}
        aria-labelledby="4-outputs-label"
        onClick={() => setIsFourOut(!isFourOut)}
        disabled={disabled}
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full 
          border-2 border-transparent transition-colors duration-200 ease-in-out 
          focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-fuchsia-50
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isFourOut ? 'bg-purple-600' : 'bg-zinc-200'}
        `}
      >
        <span
          aria-hidden="true"
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full 
            bg-white shadow ring-0 transition duration-200 ease-in-out
            ${isFourOut ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
};
