export interface PromotionConfig {
  id: 'arroyo' | 'farnesio';
  name: string;
  tagline: string;
  legalName: string;
  cif: string;
  taxAddress: string;
  siteAddress: string;
  logo: string;
  logoWhite: string;
  bankName: string;
  bankAccount: string;
  web: string;
  email: string;
  phone: string;
  reservationAmount: number;
  contractPercentage: number;
  installmentPercentage: number;
  installmentCount: number;
  deedPercentage: number;
  badgeColor: string;
}

export const PROMOTIONS: Record<'arroyo' | 'farnesio', PromotionConfig> = {
  arroyo: {
    id: 'arroyo',
    name: 'Lubens Arroyo',
    tagline: 'Residencial en Arroyo de la Encomienda',
    legalName: 'LUBENS PROYECTO S.L.',
    cif: 'B47622279',
    taxAddress: 'Paseo de Arco de Ladrillo 68, Valladolid',
    siteAddress: 'Calle Isaac Peral 20, Arroyo de la Encomienda (Valladolid)',
    logo: '/logo-lubens-arroyo.png',
    logoWhite: '/logo-lubens-arroyo-white.png',
    bankName: 'CAJA RURAL DE ZAMORA',
    bankAccount: 'ES02/3085/0102/0126/0444/9021',
    web: 'https://www.lubensresidencial.com',
    email: 'info@terravallpromociones.com',
    phone: '983 342 132',
    reservationAmount: 6000,
    contractPercentage: 10,
    installmentPercentage: 10,
    installmentCount: 18,
    deedPercentage: 80,
    badgeColor: 'bg-blue-600'
  },
  farnesio: {
    id: 'farnesio',
    name: 'Lubens Farnesio',
    tagline: 'Exclusiva promoción en Valladolid capital',
    legalName: 'LUBENS PROYECTO S.L.',
    cif: 'B47622279',
    taxAddress: 'Paseo de Arco de Ladrillo 68, Valladolid',
    siteAddress: 'Calle General Shelly 1, Valladolid',
    logo: '/logo-lubens-farnesio.png',
    logoWhite: '/logo-lubens-farnesio.png',
    bankName: 'CAJA RURAL DE ZAMORA',
    bankAccount: 'ES02/3085/0102/0126/0444/9021',
    web: 'https://www.lubensresidencial.com',
    email: 'info@terravallpromociones.com',
    phone: '983 342 132',
    reservationAmount: 6000,
    contractPercentage: 10,
    installmentPercentage: 10,
    installmentCount: 18,
    deedPercentage: 80,
    badgeColor: 'bg-emerald-600'
  }
};

export const PROMOTION_LIST = Object.values(PROMOTIONS);

/**
 * Determina si una vivienda pertenece a una promoción dada ('arroyo' o 'farnesio').
 * Soporta tanto el campo 'promocion' de base de datos como una detección heurística
 * basada en la nomenclatura de portales / códigos de vivienda:
 * - Lubens Farnesio: portales 1A, 1B o códigos que comienzan por 1A- / 1B-
 * - Lubens Arroyo: portales 9, 10, 11, 12 o códigos P09-, P10-, P11-, P12-
 */
export function isPropertyOfPromotion(
  property: { promocion?: string | null; portal?: string | null; n_orden?: string | null },
  promotionId?: string
): boolean {
  if (!promotionId || promotionId === 'all') return true;

  if (property.promocion) {
    return property.promocion === promotionId;
  }

  const pPortal = (property.portal || '').trim().toUpperCase();
  const pOrden = (property.n_orden || '').trim().toUpperCase();

  const isFarnesio =
    pPortal === '1A' ||
    pPortal === '1B' ||
    pOrden.startsWith('1A-') ||
    pOrden.startsWith('1B-');

  if (promotionId === 'farnesio') return isFarnesio;
  if (promotionId === 'arroyo') return !isFarnesio;
  return true;
}
