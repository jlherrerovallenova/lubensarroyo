import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { FARNESIO_VIVIENDAS_19 } from '../src/data/farnesioViviendas.ts';

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

async function run() {
  console.log(`📋 Total viviendas Lubens Farnesio a importar: ${FARNESIO_VIVIENDAS_19.length}`);

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

  // Comprobar si ya existen
  const nOrdens = FARNESIO_VIVIENDAS_19.map(v => v.n_orden);
  const { data: existing } = await supabase.from('inventory').select('n_orden').in('n_orden', nOrdens);
  const existingSet = new Set((existing || []).map(e => e.n_orden));

  const toInsert = FARNESIO_VIVIENDAS_19.filter(v => !existingSet.has(v.n_orden));
  console.log(`ℹ️ Existentes: ${existingSet.size}, Nuevas a insertar: ${toInsert.length}`);

  if (toInsert.length === 0) {
    console.log('✅ Todas las viviendas de Lubens Farnesio ya están en la base de datos.');
    return;
  }

  // Intentar insertar con campo promocion, con fallback si la columna aún no existe
  let { data, error } = await supabase.from('inventory').insert(toInsert).select();
  if (error && error.message?.includes('promocion')) {
    const rawWithoutPromo = toInsert.map(({ promocion, ...rest }) => rest);
    const res = await supabase.from('inventory').insert(rawWithoutPromo).select();
    data = res.data;
    error = res.error;
  }

  if (error) {
    console.error('❌ Error al insertar en inventory:', error);
  } else {
    console.log(`✅ ¡Éxito! Se han importado correctamente ${data?.length} viviendas de Lubens Farnesio.`);
  }
}

run();
