// src/services/emailTrackingSync.ts
import { supabase } from '../lib/supabase';
import { getResendApiKey } from './emailService';

/**
 * Sincroniza el estado de apertura de correos consultando directamente
 * la API de Resend para actualizar la tabla email_tracking y lead_history en Supabase.
 */
export async function syncResendEmailOpens(): Promise<number> {
  const apiKey = await getResendApiKey();
  if (!apiKey) return 0;

  try {
    const res = await fetch('/api/resend/emails', {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    if (!res.ok) return 0;

    const json = await res.json();
    const resendEmails: any[] = json.data || [];
    if (resendEmails.length === 0) return 0;

    // Buscar los últimos 50 envíos en lead_history
    const { data: historyRecords } = await (supabase as any)
      .from('lead_history')
      .select('id, lead_id, created_at, metadata')
      .or('event_type.eq.email,event_type.eq.document')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!historyRecords || historyRecords.length === 0) return 0;

    let updatedCount = 0;

    for (const h of historyRecords) {
      const meta = h.metadata || {};
      const trackingId = meta.tracking_id;
      if (!trackingId) continue;

      // Buscar coincidencia en Resend por resend_id o por asunto y destinatario
      const match = resendEmails.find((re: any) => {
        if (meta.resend_id && re.id === meta.resend_id) return true;
        if (meta.subject && re.subject === meta.subject) {
          const timeDiff = Math.abs(new Date(re.created_at).getTime() - new Date(h.created_at).getTime());
          return timeDiff < 10 * 60 * 1000; // dentro de 10 minutos
        }
        return false;
      });

      if (match && (match.last_event === 'opened' || match.last_event === 'clicked')) {
        // Verificar el estado actual en email_tracking
        const { data: trackingRecord } = await (supabase as any)
          .from('email_tracking')
          .select('id, status, opens_count')
          .eq('id', trackingId)
          .single();

        if (trackingRecord && trackingRecord.status !== 'opened') {
          await (supabase as any).rpc('increment_email_open', { tracking_id: trackingId });
          
          // Actualizar metadata en lead_history
          await (supabase as any)
            .from('lead_history')
            .update({
              metadata: {
                ...meta,
                opened: true,
                opened_at: new Date().toISOString(),
                resend_id: match.id,
                resend_status: match.last_event
              }
            })
            .eq('id', h.id);

          updatedCount++;
        }
      }
    }

    return updatedCount;
  } catch (err) {
    console.warn('Error en syncResendEmailOpens:', err);
    return 0;
  }
}
