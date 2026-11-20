
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading,
  className = '',
  ...props 
}) => {
  const baseStyles = 'btn-premium font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-[#15a870] text-white shadow-xs hover:bg-[#128f5f] active:bg-[#0d6b47]',
    secondary: 'bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 shadow-xs',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100/80',
    danger: 'bg-rose-600 text-white shadow-xs hover:bg-rose-700',
    glass: 'bg-white text-slate-800 border border-slate-200/80 hover:bg-slate-50 shadow-xs'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2 text-sm',
    lg: 'px-7 py-3 text-base'
  };

  return (
    <button type="button" 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : children}
    </button>
  );
};
