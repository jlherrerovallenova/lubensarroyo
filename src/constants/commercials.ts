export const COMERCIALES = [
  'Juan Herrero',
  'Mar Rivas',
  'Yolanda Alba',
] as const;

export type ComercialName = typeof COMERCIALES[number];

export interface ComercialConfig {
  name: ComercialName;
  initials: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
}

export const COMERCIALES_CONFIG: Record<ComercialName, ComercialConfig> = {
  'Juan Herrero': {
    name: 'Juan Herrero',
    initials: 'JH',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    dotColor: '#15a870',
  },
  'Mar Rivas': {
    name: 'Mar Rivas',
    initials: 'MR',
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-700',
    badgeBorder: 'border-teal-200',
    dotColor: '#0d9488',
  },
  'Yolanda Alba': {
    name: 'Yolanda Alba',
    initials: 'YA',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-200',
    dotColor: '#64748b',
  },
};

export function getComercialConfig(name?: string | null): ComercialConfig | null {
  if (!name) return null;
  return (COMERCIALES_CONFIG as Record<string, ComercialConfig>)[name] || null;
}
