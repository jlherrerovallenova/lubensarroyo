import React from 'react';

interface TabButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
  variant?: 'primary' | 'overdue' | 'warning';
}

export function TabButton({ label, active, onClick, count, variant }: TabButtonProps) {
  const countColor = variant === 'overdue' ? 'bg-red-500' : variant === 'warning' ? 'bg-amber-500' : 'bg-[#15a870]';
  const textColor = active 
    ? (variant === 'overdue' ? 'text-red-700' : variant === 'warning' ? 'text-amber-700' : 'text-slate-900')
    : 'text-slate-500 hover:text-slate-700';

  return (
    <button type="button"
      onClick={onClick}
      className={`relative px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap active:scale-95 ${
        active 
          ? 'bg-white shadow-xs text-slate-900 border border-slate-200/70 font-bold ' + textColor
          : 'text-slate-500 hover:text-slate-800'
      }`}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className={`${countColor} text-white text-[9px] min-w-[17px] h-[17px] flex items-center justify-center rounded-full font-bold animate-in zoom-in px-1`}>
          {count}
        </span>
      )}
    </button>
  );
}
