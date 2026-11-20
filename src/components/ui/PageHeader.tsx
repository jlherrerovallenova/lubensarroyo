
import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions, icon }) => {
  return (
    <div className="mb-6 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {icon && (
            <div className="w-12 h-12 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
              {title}
            </h1>
            {subtitle && (
              <div className="text-slate-500 text-xs sm:text-sm font-medium mt-1 flex items-center gap-2">
                {subtitle}
              </div>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
