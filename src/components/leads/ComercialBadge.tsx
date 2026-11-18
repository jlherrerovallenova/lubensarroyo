import React from 'react';
import { User } from 'lucide-react';
import { getComercialConfig } from '../../constants/commercials';

interface ComercialBadgeProps {
  name?: string | null;
  compact?: boolean;
  className?: string;
}

export function ComercialBadge({ name, compact = false, className = '' }: ComercialBadgeProps) {
  const config = getComercialConfig(name);

  if (!config) {
    if (compact) {
      return (
        <span
          title="Sin comercial asignado"
          className={`inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-400 border border-dashed border-slate-300 text-[9px] font-bold ${className}`}
        >
          <User size={10} />
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-50 text-slate-400 border border-dashed border-slate-200 text-[10px] font-medium ${className}`}
      >
        <User size={11} className="text-slate-300" />
        <span>Sin asignar</span>
      </span>
    );
  }

  if (compact) {
    return (
      <span
        title={`Comercial: ${config.name}`}
        className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${config.badgeBg} ${config.badgeText} border ${config.badgeBorder} text-[9px] font-black tracking-tight shadow-2xs ${className}`}
      >
        {config.initials}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${config.badgeBg} ${config.badgeText} border ${config.badgeBorder} text-[11px] font-bold shadow-2xs whitespace-nowrap ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.dotColor }} />
      <span>{config.name}</span>
    </span>
  );
}
