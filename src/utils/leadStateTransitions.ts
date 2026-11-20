import { supabase } from '../lib/supabase';
import type { QueryClient } from '@tanstack/react-query';
import { LEADS_QUERY_KEY } from '../hooks/useLeads';

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'visiting' | 'proposal' | 'negotiation' | 'closed' | 'lost';

const STATUS_RANK: Record<string, number> = {
  new: 1,
  contacted: 2,
  qualified: 3,
  visiting: 4,
  proposal: 5,
  negotiation: 6,
  closed: 7,
  lost: 0
};

/**
 * Determina si el nuevo estado representa un avance o progreso comercial
 * respecto al estado actual, sin degradar estados superiores (ej. closed, proposal, etc.).
 */
export function shouldPromoteLeadStatus(currentStatus: string | null | undefined, targetStatus: LeadStatus): boolean {
  const current = currentStatus || 'new';
  if (current === targetStatus) return false;
  if (current === 'closed' || current === 'lost' || current === 'proposal' || current === 'negotiation') {
    return false;
  }
  const currentRank = STATUS_RANK[current] ?? 1;
  const targetRank = STATUS_RANK[targetStatus] ?? 0;
  return targetRank > currentRank;
}

/**
 * Actualiza el estado de un lead en la base de datos y sincroniza las queries de React Query.
 */
export async function updateLeadStatusIfEligible(
  leadId: string,
  targetStatus: LeadStatus,
  queryClient?: QueryClient,
  reason?: string
): Promise<boolean> {
  if (!leadId) return false;

  try {
    const { data: lead, error: fetchErr } = await (supabase as any)
      .from('leads')
      .select('id, status, name')
      .eq('id', leadId)
      .maybeSingle();

    if (fetchErr || !lead) return false;

    if (!shouldPromoteLeadStatus(lead.status, targetStatus)) {
      return false;
    }

    const { error: updateErr } = await (supabase as any)
      .from('leads')
      .update({ status: targetStatus })
      .eq('id', leadId);

    if (updateErr) {
      console.error('Error al actualizar estado automático del lead:', updateErr);
      return false;
    }

    // Registrar en el historial del lead si hay razón
    try {
      await (supabase as any).from('lead_history').insert([{
        lead_id: leadId,
        event_type: 'status_change',
        description: reason || `Estado actualizado automáticamente a "${targetStatus}"`,
        metadata: {
          previous_status: lead.status,
          new_status: targetStatus,
          automatic: true
        }
      }]);
    } catch (histErr) {
      console.warn('Error registrando historial de transición:', histErr);
    }

    if (queryClient) {
      queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_recent'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_critical'] });
    }

    return true;
  } catch (err) {
    console.error('Excepción en updateLeadStatusIfEligible:', err);
    return false;
  }
}

/**
 * Maneja la transición de estado cuando una tarea de la agenda pasa a completada:
 * - Cualquier acción completada (Llamada, Visita, Email, WhatsApp, etc.) pasa a 'contacted'.
 * - Si la acción es 'Visita' realizada, pasa directamente a 'visiting'.
 */
export async function handleTaskCompletedTransition(
  task: { lead_id?: string | null; type?: string | null; completed?: boolean },
  isNowCompleted: boolean,
  queryClient?: QueryClient
): Promise<void> {
  if (!isNowCompleted || !task.lead_id) return;

  const rawType = (task.type || '').toLowerCase();
  
  if (rawType.includes('visita')) {
    // Si hay una acción de visita realizada, se pasa a 'visiting'
    await updateLeadStatusIfEligible(
      task.lead_id,
      'visiting',
      queryClient,
      'Visita completada: estado actualizado a "Visitando"'
    );
  } else {
    // Cualquier otra acción (llamada, email, whatsapp, reunión) pasa a 'contacted'
    await updateLeadStatusIfEligible(
      task.lead_id,
      'contacted',
      queryClient,
      `Acción de ${task.type || 'contacto'} completada: estado actualizado a "Contactado"`
    );
  }
}
