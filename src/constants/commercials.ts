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

/**
 * Normaliza el nombre o email de un usuario/perfil al nombre oficial del comercial.
 * Por ejemplo: "juan" o "juan@terravall.com" -> "Juan Herrero"
 */
export function resolveCommercialName(rawNameOrEmail?: string | null): ComercialName | null {
  if (!rawNameOrEmail) return null;
  const lower = rawNameOrEmail.toLowerCase().trim();

  if (lower.includes('juan') || lower.includes('jherrero') || lower.includes('jh')) {
    return 'Juan Herrero';
  }
  if (lower.includes('mar') || lower.includes('rivas') || lower.includes('mr')) {
    return 'Mar Rivas';
  }
  if (lower.includes('yolanda') || lower.includes('alba') || lower.includes('ya')) {
    return 'Yolanda Alba';
  }

  const match = COMERCIALES.find(c => c.toLowerCase() === lower);
  return match || null;
}
