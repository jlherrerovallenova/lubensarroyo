import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

function formatTitleCase(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim();
}

function cleanPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d+]/g, '');
  return digits.length >= 9 ? digits : null;
}

function extractFromRawText(text: string) {
  if (!text) return { name: '', email: '', phone: '', notes: '', source: '', promotion: '' };

  // 1. Email
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  const email = emailMatch ? emailMatch[1].trim() : '';

  // 2. Teléfono
  const phoneMatch = text.match(/(?:\+?34\s?)?[6789][0-9\s-]{8,13}/);
  const phone = phoneMatch ? cleanPhone(phoneMatch[0]) || '' : '';

  // 3. Nombre
  let name = '';
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const isPhoneLine = (line: string) => /(?:\+?34\s?)?[6789][0-9\s-]{8,13}/.test(line);

  for (const line of lines) {
    const lineMatch = line.match(/^(?:Nombre(?:\s+completo|\s+y\s+apellidos)?|Cliente|Solicitante|Persona\s+de\s+contacto|Te\s+ha\s+contactado(?:\s+por)?|Contactado\s+por|De)\s*[:\s-]\s*([^\r\n]+)/i);
    if (lineMatch && lineMatch[1]) {
      const candidate = lineMatch[1].trim();
      if (!candidate.includes('@') && !isPhoneLine(candidate) && candidate.length >= 2) {
        name = candidate;
        break;
      }
    }
  }

  if (!name) {
    const emailLineIndex = lines.findIndex(l => email && l.includes(email));
    const phoneLineIndex = lines.findIndex(l => phone && l.replace(/\s/g, '').includes(phone));
    const dataIndices = [emailLineIndex, phoneLineIndex].filter(idx => idx !== -1);
    const minDataIndex = dataIndices.length > 0 ? Math.min(...dataIndices) : -1;

    if (minDataIndex > 0) {
      const candidate = lines[minDataIndex - 1];
      const lower = candidate.toLowerCase();
      if (
        candidate.length >= 2 && candidate.length < 50 &&
        !candidate.includes('@') && !isPhoneLine(candidate) &&
        !lower.includes('idealista') && !lower.includes('fotocasa') && !lower.includes('habitaclia')
      ) {
        name = candidate;
      }
    }
  }

  // 4. Mensaje / Notas
  let notes = '';
  const msgMatch = text.match(/(?:Mensaje|Comentario|Consulta|Texto)\s*[:\s-]\s*([\s\S]+?)(?:---|Date:|Time:|Page URL:|$)/i);
  if (msgMatch && msgMatch[1]) {
    notes = msgMatch[1].trim();
  }

  // 5. Origen y Promoción detectados en el texto
  const lowerText = text.toLowerCase();
  let source = 'Web Form';
  if (lowerText.includes('idealista')) source = 'Idealista';
  else if (lowerText.includes('fotocasa')) source = 'Fotocasa';
  else if (lowerText.includes('habitaclia')) source = 'Habitaclia';

  let promotion = 'arroyo';
  if (lowerText.includes('farnesio')) promotion = 'farnesio';
  else if (lowerText.includes('arroyo') && lowerText.includes('farnesio')) promotion = 'ambas';

  return { name, email, phone, notes, source, promotion };
}

serve(async (req) => {
  // Manejo de CORS (Preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método no permitido. Usa POST.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Configuración del servidor incompleta (SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configuradas)");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Lectura del cuerpo según Content-Type
    const contentType = req.headers.get('content-type') || '';
    let rawBody: any = {};
    let rawText = '';

    if (contentType.includes('application/json')) {
      rawBody = await req.json().catch(() => ({}));
      rawText = JSON.stringify(rawBody);
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await req.formData().catch(() => new FormData());
      const formObj: Record<string, any> = {};
      for (const [key, val] of formData.entries()) {
        formObj[key] = val;
      }
      rawBody = formObj;
      rawText = JSON.stringify(formObj);
    } else {
      rawText = await req.text().catch(() => '');
      try {
        rawBody = JSON.parse(rawText);
      } catch {
        rawBody = { text: rawText };
      }
    }

    // Normalización de campos: admite Elementor Form, JSON estándar, o texto plano/email
    let name = rawBody.name || rawBody.nombre || rawBody['full-name'] || rawBody.full_name || '';
    let email = rawBody.email || rawBody.correo || rawBody['email-address'] || '';
    let phone = rawBody.phone || rawBody.telefono || rawBody.telephone || rawBody.movil || '';
    let notes = rawBody.notes || rawBody.message || rawBody.mensaje || rawBody.comentario || '';
    let source = rawBody.source || rawBody.origen || '';
    let promocion_interes = rawBody.promocion || rawBody.promocion_interes || rawBody.promotion || '';
    let assigned_to = rawBody.assigned_to || rawBody.comercial || null;

    // Si viene de Elementor Form estándar (estructura `fields: { field_name: { value: '...' } }`)
    if (rawBody.fields && typeof rawBody.fields === 'object') {
      const f = rawBody.fields;
      for (const key of Object.keys(f)) {
        const item = f[key];
        const val = typeof item === 'object' && item?.value !== undefined ? item.value : item;
        const title = (item?.title || key).toLowerCase();

        if (title.includes('nombre') || title.includes('name') || key === 'name' || key === 'nombre') {
          name = name || val;
        } else if (title.includes('email') || title.includes('correo') || key === 'email') {
          email = email || val;
        } else if (title.includes('tel') || title.includes('phone') || title.includes('movil') || key === 'phone' || key === 'telephone') {
          phone = phone || val;
        } else if (title.includes('mensaje') || title.includes('message') || title.includes('comentario') || key === 'message') {
          notes = notes || val;
        } else if (title.includes('promoci') || key === 'promocion') {
          promocion_interes = promocion_interes || val;
        }
      }
      if (!source) source = 'Web Form';
    }

    // Si algún dato clave falta, aplicar el extractor inteligente sobre el texto completo o notas
    if (!name || !email || !phone) {
      const textToScan = rawBody.text || rawBody.body || rawBody.content || rawText;
      const extracted = extractFromRawText(textToScan);
      if (!name && extracted.name) name = extracted.name;
      if (!email && extracted.email) email = extracted.email;
      if (!phone && extracted.phone) phone = extracted.phone;
      if (!notes && extracted.notes) notes = extracted.notes;
      if (!source && extracted.source) source = extracted.source;
      if (!promocion_interes && extracted.promotion) promocion_interes = extracted.promotion;
    }

    // Limpiezas y validaciones
    name = formatTitleCase(String(name).trim());
    email = String(email).trim().toLowerCase();
    phone = cleanPhone(String(phone)) || null;
    notes = String(notes).trim() || null;
    source = source ? String(source).trim() : 'Web Form';

    // Normalizar promoción de interés
    const promoLower = String(promocion_interes).toLowerCase();
    let normalizedPromo: 'arroyo' | 'farnesio' | 'ambas' = 'arroyo';
    if (promoLower.includes('farnesio') && promoLower.includes('arroyo')) {
      normalizedPromo = 'ambas';
    } else if (promoLower.includes('farnesio')) {
      normalizedPromo = 'farnesio';
    } else {
      normalizedPromo = 'arroyo';
    }

    // Comercial por defecto si no viene indicado
    if (!assigned_to) {
      assigned_to = 'Juan Herrero';
    }

    // Validación mínima: al menos debe existir nombre, o email, o teléfono
    if (!name && !email && !phone) {
      return new Response(JSON.stringify({ 
        error: "No se encontraron datos mínimos de contacto (nombre, email o teléfono en el payload recibido)." 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    if (!name) {
      name = email ? email.split('@')[0] : (phone ? `Contacto ${phone}` : 'Interesado Web');
    }

    // 1. Comprobación de duplicados (por email o teléfono)
    let existingLead: any = null;
    if (email) {
      const { data } = await supabase.from('leads').select('id, name, notes').eq('email', email).limit(1);
      if (data && data.length > 0) existingLead = data[0];
    }
    if (!existingLead && phone) {
      const { data } = await supabase.from('leads').select('id, name, notes').eq('phone', phone).limit(1);
      if (data && data.length > 0) existingLead = data[0];
    }

    // 2. Si ya existe, actualizar notas y registrar actividad sin duplicar el cliente
    if (existingLead) {
      const timestamp = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const updatedNotes = existingLead.notes 
        ? `${existingLead.notes}\n\n[Recontacto vía ${source} - ${timestamp}]: ${notes || 'Solicitud reiterada de información'}`
        : `[Recontacto vía ${source} - ${timestamp}]: ${notes || 'Solicitud de información'}`;

      await supabase.from('leads').update({ notes: updatedNotes }).eq('id', existingLead.id);

      // Registrar evento en timeline de historial
      await supabase.from('lead_history').insert([{
        lead_id: existingLead.id,
        event_type: 'creation',
        description: `Nueva solicitud recibida vía ${source}: ${notes ? notes.slice(0, 150) : 'Interés reiterado'}`,
        metadata: { source, duplicate: true, updated_at: new Date().toISOString() }
      }]);

      return new Response(JSON.stringify({
        success: true,
        message: 'Contacto existente actualizado con la nueva consulta',
        is_duplicate: true,
        lead_id: existingLead.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // 3. Inserción de Nuevo Lead
    const newLeadPayload: any = {
      name,
      email: email || null,
      phone: phone || null,
      source: source,
      promocion_interes: normalizedPromo,
      notes: notes,
      status: 'new',
      assigned_to: assigned_to,
      is_subscribed: true
    };

    const { data: createdLead, error: insertError } = await supabase
      .from('leads')
      .insert([newLeadPayload])
      .select()
      .single();

    if (insertError) {
      console.error('Error insertando lead:', insertError);
      throw insertError;
    }

    // 4. Registro en el Historial del Lead
    await supabase.from('lead_history').insert([{
      lead_id: createdLead.id,
      event_type: 'creation',
      description: `Lead captado a través de ${source}.`,
      metadata: { source, automated: true, created_at: new Date().toISOString() }
    }]);

    return new Response(JSON.stringify({
      success: true,
      message: 'Lead importado y registrado correctamente en el CRM',
      lead_id: createdLead.id,
      lead: createdLead
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: any) {
    console.error('Error en webhook import-lead:', error);
    return new Response(JSON.stringify({ error: error.message || 'Error procesando lead' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
