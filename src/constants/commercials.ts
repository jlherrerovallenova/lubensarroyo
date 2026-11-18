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
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    dotColor: '#3b82f6',
  },
  'Mar Rivas': {
    name: 'Mar Rivas',
    initials: 'MR',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    dotColor: '#10b981',
  },
  'Yolanda Alba': {
    name: 'Yolanda Alba',
    initials: 'YA',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
    dotColor: '#a855f7',
  },
};

export function getComercialConfig(name?: string | null): ComercialConfig | null {
  if (!name) return null;
  return (COMERCIALES_CONFIG as Record<string, ComercialConfig>)[name] || null;
}
