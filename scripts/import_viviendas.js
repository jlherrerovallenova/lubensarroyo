import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 14 tipologías estándar de la tabla (excluyendo variantes opcionales)
const TIPOLOGIAS = [
  // PORTAL 9
  { portal: '9', letra: 'A', dorm: 3, util: 84.18, terraza: 10.70, orientacion: 'NORESTE', precios: [255000, 260000, 265000, 270000, 275000] },
  { portal: '9', letra: 'B', dorm: 3, util: 79.01, terraza: 2.59,  orientacion: 'NORESTE', precios: [230000, 235000, 240000, 245000, 250000] },
  { portal: '9', letra: 'C', dorm: 3, util: 79.09, terraza: 2.59,  orientacion: 'SUROESTE', precios: [225000, 230000, 235000, 240000, 245000] },
  { portal: '9', letra: 'D', dorm: 2, util: 74.05, terraza: 8.07,  orientacion: 'SUROESTE', precios: [210000, 215000, 220000, 225000, 230000] },

  // PORTAL 10
  { portal: '10', letra: 'A', dorm: 3, util: 83.75, terraza: 10.70, orientacion: 'NORESTE', precios: [255000, 260000, 265000, 270000, 275000] },
  { portal: '10', letra: 'B', dorm: 2, util: 71.28, terraza: 6.15,  orientacion: 'NORESTE', precios: [205000, 210000, 215000, 220000, 225000] },
  { portal: '10', letra: 'C', dorm: 2, util: 70.83, terraza: 8.07,  orientacion: 'SUROESTE', precios: [200000, 205000, 210000, 215000, 220000] },
  { portal: '10', letra: 'D', dorm: 2, util: 69.07, terraza: 4.70,  orientacion: 'SUROESTE', precios: [190000, 195000, 200000, 205000, 210000] },

  // PORTAL 11
  { portal: '11', letra: 'A', dorm: 3, util: 77.96, terraza: 9.46,  orientacion: 'SURESTE', precios: [240000, 245000, 250000, 255000, 260000] },
  { portal: '11', letra: 'B', dorm: 3, util: 90.89, terraza: 17.71, orientacion: 'NORESTE', precios: [285000, 290000, 295000, 300000, 305000] },

  // PORTAL 12
  { portal: '12', letra: 'A', dorm: 3, util: 86.72, terraza: 7.79,  orientacion: 'NOROESTE', precios: [250000, 255000, 260000, 265000, 270000] },
  { portal: '12', letra: 'B', dorm: 2, util: 68.46, terraza: 2.05,  orientacion: 'NOROESTE', precios: [190000, 195000, 200000, 205000, 210000] },
  { portal: '12', letra: 'C', dorm: 2, util: 71.87, terraza: 6.06,  orientacion: 'SURESTE', precios: [215000, 220000, 225000, 230000, 235000] },
  { portal: '12', letra: 'D', dorm: 3, util: 84.14, terraza: 9.51,  orientacion: 'SURESTE', precios: [255000, 260000, 265000, 270000, 275000] },
];

const PLANTAS = ['1ª', '2ª', '3ª', '4ª', '5ª'];

export function generateViviendas() {
  const records = [];

  for (const t of TIPOLOGIAS) {
    const portalNum = t.portal.padStart(2, '0');
    for (let i = 0; i < PLANTAS.length; i++) {
      const planta = PLANTAS[i];
      const floorNum = i + 1;
      const n_orden = `P${portalNum}-${floorNum}${t.letra}`;
      const precio = t.precios[i];

      records.push({
        n_orden,
        portal: t.portal,
        planta,
        letra: t.letra,
        dormitorios: t.dorm,
        banos: 2,
        sup_util: t.util,
        sup_terrazas: t.terraza,
        sup_construida: 0,
        sup_porche: 0,
        orientacion: t.orientacion,
        precio,
        garaje: 'SÍ',
        trastero: 'SÍ',
        estado_vivienda: 'DISPONIBLE'
      });
    }
  }

  return records;
}

async function run() {
  const isDryRun = process.argv.includes('--dry-run');
  const viviendas = generateViviendas();

  console.log(`📋 Total viviendas generadas: ${viviendas.length}`);
  console.log(`🔍 Muestra de las 3 primeras:`);
  console.log(JSON.stringify(viviendas.slice(0, 3), null, 2));
  console.log(`🔍 Muestra de las 3 últimas:`);
  console.log(JSON.stringify(viviendas.slice(-3), null, 2));

  if (isDryRun) {
    console.log('🧪 Modo Dry Run activado: no se escribieron datos en Supabase.');
    return;
  }

  console.log('🔐 Autenticando en Supabase para cumplir políticas RLS...');
  const adminEmail = process.env.ADMIN_EMAIL || 'admin_seed@lubensarroyo.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'SeedPassword123!';
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });

  if (authError) {
    console.error('❌ Error de autenticación:', authError.message);
    return;
  }
  console.log('✅ Sesión autenticada.');

  console.log('🚀 Insertando registros en Supabase (tabla inventory)...');
  const { data, error } = await supabase.from('inventory').insert(viviendas).select();

  if (error) {
    console.error('❌ Error al insertar en inventory:', error);
  } else {
    console.log(`✅ ¡Éxito! Se han importado correctamente ${data.length} viviendas.`);
  }
}

if (process.argv[1] && process.argv[1].endsWith('import_viviendas.js')) {
  run();
}
