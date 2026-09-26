import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://oenaworwtrblkmjvwjfs.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_sifp1t0oYmNIi6Vc5C8pPg_hEwcMJof';

const supabase = createClient(supabaseUrl, supabaseKey);

function cleanPhone(raw) {
  if (!raw) return null;
  let p = raw.replace(/[\s\-\(\)\.]/g, '');
  if (p.startsWith('+34')) p = p.slice(3);
  else if (p.startsWith('34') && p.length === 11) p = p.slice(2);
  return p || null;
}

function cleanEmail(raw) {
  if (!raw) return null;
  const e = raw.trim().toLowerCase();
  return e || null;
}

async function run() {
  const filePath = path.resolve(__dirname, '../gemini-code-1790279137474.txt');
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.trim().split(/\r?\n/);
  
  const rawList = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',');
    const name = parts[0]?.trim() || '';
    const email = cleanEmail(parts[1]);
    const phone = cleanPhone(parts.slice(2).join(','));
    rawList.push({ originalLine: i + 1, name, email, phone });
  }

  console.log(`Total filas leídas del listado: ${rawList.length}`);

  // 1. Identificar teléfonos y emails de contactos que sí tienen nombre
  const namedPhones = new Set();
  const namedEmails = new Set();

  rawList.forEach(item => {
    if (item.name && item.name.toLowerCase() !== 'desconocido') {
      if (item.phone) namedPhones.add(item.phone);
      if (item.email) namedEmails.add(item.email);
    }
  });

  const toImport = [];
  const skipped = [];
  const seenKey = new Set();

  for (const item of rawList) {
    let name = item.name;
    const email = item.email;
    const phone = item.phone;

    // Caso 1: Totalmente vacío o Desconocido sin email ni teléfono
    if ((!name || name.toLowerCase() === 'desconocido') && !email && !phone) {
      skipped.push({ reason: 'Fila sin nombre, email ni teléfono', item });
      continue;
    }

    // Caso 2: Desconocido cuyo teléfono ya pertenece a un contacto con nombre conocido
    if ((!name || name.toLowerCase() === 'desconocido') && phone && namedPhones.has(phone)) {
      skipped.push({ reason: 'Teléfono ya registrado en contacto con nombre', item });
      continue;
    }

    if (!name) name = 'Desconocido';

    // Caso 3: Duplicado exacto
    const dedupKey = `${name.toLowerCase()}||${email || ''}||${phone || ''}`;
    if (seenKey.has(dedupKey)) {
      skipped.push({ reason: 'Duplicado exacto de fila anterior', item });
      continue;
    }
    seenKey.add(dedupKey);

    toImport.push({ name, email, phone });
  }

  console.log(`\n📋 Resumen del análisis:`);
  console.log(`- Contactos a importar: ${toImport.length}`);
  console.log(`- Descartados (duplicados / vacíos): ${skipped.length}`);
  if (skipped.length > 0) {
    console.log(`\nDetalle de descartados:`);
    skipped.forEach(s => {
      console.log(`  • Línea ${s.item.originalLine}: "${s.item.name}" (${s.item.email || '-'}, ${s.item.phone || '-'}) -> ${s.reason}`);
    });
  }

  console.log(`\n🚀 Comenzando importación vía edge function import-lead...`);

  let successCount = 0;
  let errorCount = 0;

  // Procesamos en lotes pequeños concurrentes para no saturar y ser rápidos
  const BATCH_SIZE = 5;
  for (let i = 0; i < toImport.length; i += BATCH_SIZE) {
    const batch = toImport.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (client) => {
      try {
        const { data, error } = await supabase.functions.invoke('import-lead', {
          body: {
            name: client.name,
            email: client.email || null,
            phone: client.phone || null,
            source: 'Importado',
            notes: 'Importado desde listado CSV de clientes'
          }
        });

        if (error) {
          console.error(`❌ Error importando ${client.name}:`, error.message || error);
          errorCount++;
        } else if (data && !data.success) {
          console.error(`❌ Falló importando ${client.name}:`, data.error || data.message);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Excepción importando ${client.name}:`, err.message);
        errorCount++;
      }
    }));
    
    process.stdout.write(`Progreso: ${Math.min(i + BATCH_SIZE, toImport.length)} / ${toImport.length} procesados...\r`);
  }

  console.log(`\n\n✨ Importación finalizada:`);
  console.log(`  ✅ Insertados correctamente: ${successCount}`);
  console.log(`  ❌ Errores: ${errorCount}`);
}

run().catch(console.error);
