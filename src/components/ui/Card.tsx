import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'white' | 'glass' | 'dark';
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  variant = 'white',
  noPadding = false
}) => {
  const baseStyles = 'rounded-2xl transition-all duration-300 overflow-hidden';
  
  const variants = {
    white: 'bg-white border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]',
    glass: 'bg-white border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]',
    dark: 'bg-[#0e131b] text-white border border-slate-800 shadow-xl'
  };

  return (
    <div 
      className={`${baseStyles} ${variants[variant]} ${noPadding ? '' : 'p-6'} animate-in fade-in slide-in-from-bottom-5 duration-500 ${className}`}
    >
      {children}
    </div>
  );
};
