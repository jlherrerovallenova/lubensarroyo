import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

export function fixMojibake(str) {
  if (typeof str !== 'string') return str;
  if (!/(?:Â[\u00A0-\u00BF]|Ã[\u0080-\u00BF])/.test(str)) return str;
  try {
    const fixed = Buffer.from(str, 'latin1').toString('utf8');
    if (!fixed.includes('\uFFFD')) {
      return fixed;
    }
  } catch (e) {}
  return str;
}

async function run() {
  const tables = ['inventory', 'leads', 'agenda', 'sales', 'profiles', 'newsletters', 'discovery_surveys', 'client_requests', 'client_documents'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      // Table might not exist or no permission
      continue;
    }
    
    let corruptedRows = 0;
    for (const row of data || []) {
      const updates = {};
      let hasUpdate = false;
      for (const [k, v] of Object.entries(row)) {
        if (typeof v === 'string' && /(?:Â[\u00A0-\u00BF]|Ã[\u0080-\u00BF])/.test(v)) {
          const fixed = fixMojibake(v);
          if (fixed !== v) {
            updates[k] = fixed;
            hasUpdate = true;
          }
        }
      }
      
      if (hasUpdate) {
        corruptedRows++;
        const idCol = row.id ? 'id' : (row.n_orden ? 'n_orden' : Object.keys(row)[0]);
        const idVal = row[idCol];
        const { error: updateError } = await supabase.from(table).update(updates).eq(idCol, idVal);
        if (updateError) {
          console.error(`Error updating ${table} (${idCol}=${idVal}):`, updateError.message);
        }
      }
    }
    console.log(`Table ${table}: scanned ${data.length} rows, fixed ${corruptedRows} rows.`);
  }
  
  console.log('Finished fixing mojibake in database!');
}

run().catch(console.error);
