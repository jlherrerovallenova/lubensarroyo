import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useRealtimeSync } from './useRealtimeSync';
import type { Database } from '../types/supabase';

export type AgendaItem = Database['public']['Tables']['agenda']['Row'] & {
  leads?: { name: string, phone: string | null } | null;
  email_tracking?: { id: string; status: string; opens_count: number; last_opened_at: string | null } | null;
};

export interface SourceStat {
  name: string;
  count: number;
  percentage: number;
}

export interface RecentLead {
  id: string;
  name: string;
  source: string | null;
  created_at: string;
}

export interface UntreatedLead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string;
  created_at: string;
  assigned_to: string | null;
  daysUntreated: number;
}

function applyPromotionFilter(query: any, promotionId?: string) {
  if (!promotionId || promotionId === 'all') return query;
  if (promotionId === 'arroyo') {
    return query.or('promocion_interes.eq.arroyo,promocion_interes.eq.ambas,promocion_interes.is.null');
  } else if (promotionId === 'farnesio') {
    return query.or('promocion_interes.eq.farnesio,promocion_interes.eq.ambas');
  } else {
    return query.eq('promocion_interes', promotionId);
  }
}

export function useDashboardData(userId: string | undefined, promotionId?: string, userCommercialName?: string | null) {
  const queryClient = useQueryClient();

  // Escuchar cambios en tiempo real en la agenda y los clientes
  useRealtimeSync('agenda', ['dashboard_agenda']);
  useRealtimeSync('leads', ['dashboard_stats']);
  useRealtimeSync('leads', ['dashboard_recent']);
  useRealtimeSync('leads', ['dashboard_critical']);
  useRealtimeSync('leads', ['dashboard_feedback']);
  useRealtimeSync('leads', ['dashboard_auto_imported']);
  useRealtimeSync('leads', ['dashboard_untreated']);

  const { data: statsData, isLoading: loadingStats, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard_stats', userId, promotionId],
    queryFn: async () => {
      let countQuery = supabase.from('leads').select('*', { count: 'exact', head: true });
      let sourceQuery = supabase.from('leads').select('source');

      countQuery = applyPromotionFilter(countQuery, promotionId);
      sourceQuery = applyPromotionFilter(sourceQuery, promotionId);

      const [countRes, sourceRes] = await Promise.all([
        countQuery,
        sourceQuery
      ]);
      const count = countRes.count;
      const sourceData = sourceRes.data;
      
      let topSources: SourceStat[] = [];
      const total = count || 0;
      if (sourceData) {
        const sourceCounts: Record<string, number> = {};
        sourceData.forEach((lead: any) => {
          const source = lead.source ? lead.source.trim() : 'Desconocido';
          sourceCounts[source] = (sourceCounts[source] || 0) + 1;
        });
        topSources = Object.entries(sourceCounts)
          .map(([name, c]) => ({
            name,
            count: c,
            percentage: total > 0 ? Math.round((c / total) * 100) : 0
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);
      }
      return { totalLeads: total, topSources };
    },
    enabled: !!userId,
  });

  const { data: recentLeads = [], isLoading: loadingRecent, refetch: refetchRecent } = useQuery({
    queryKey: ['dashboard_recent', userId, promotionId],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select('id, name, source, created_at')
        .order('created_at', { ascending: false })
        .limit(6);
      query = applyPromotionFilter(query, promotionId);
      const { data, error } = await query;
      if (error) throw error;
      return data as RecentLead[];
    },
    enabled: !!userId,
  });

  const { data: agenda = [], isLoading: loadingAgenda, refetch: refetchAgenda } = useQuery({
    queryKey: ['dashboard_agenda', userId, promotionId],
    queryFn: async () => {
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('agenda')
        .select('*, leads(name, phone, promocion_interes), email_tracking(*)')
        .or(`completed.eq.false,and(completed.eq.true,due_date.gte.${lastWeek})`)
        .order('due_date', { ascending: true });
      if (error) throw error;
      let list = (data || []).map((item: any) => ({
        ...item,
        leads: Array.isArray(item.leads) ? item.leads[0] : item.leads,
        email_tracking: Array.isArray(item.email_tracking) ? item.email_tracking[0] : item.email_tracking
      })) as AgendaItem[];

      if (promotionId && promotionId !== 'all') {
        list = list.filter((item: any) => {
          if (!item.leads) return true;
          const leadPromo = item.leads.promocion_interes;
          if (promotionId === 'arroyo') {
            return !leadPromo || leadPromo === 'arroyo' || leadPromo === 'ambas';
          }
          if (promotionId === 'farnesio') {
            return leadPromo === 'farnesio' || leadPromo === 'ambas';
          }
          return leadPromo === promotionId;
        });
      }
      return list;
    },
    enabled: !!userId,
  });

  const { data: criticalLeads = [], isLoading: loadingCritical, refetch: refetchCritical } = useQuery({
    queryKey: ['dashboard_critical', userId, promotionId],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select('id, name, source, created_at, status, agenda(due_date, completed)')
        .not('status', 'in', '("closed","lost")');
      query = applyPromotionFilter(query, promotionId);
      const { data, error } = await query;
      if (error) throw error;
      const now = new Date();
      return (data || [])
        .map((l: any) => {
          const agendaItems = l.agenda || [];
          const lastActivity = agendaItems.length > 0
            ? new Date(Math.max(...agendaItems.map((a: any) => new Date(a.due_date).getTime())))
            : new Date(l.created_at);
          
          const daysSinceLastActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
          const hasFutureTask = agendaItems.some((a: any) => !a.completed && new Date(a.due_date) > now);

          return {
            id: l.id,
            name: l.name,
            source: l.source,
            created_at: l.created_at,
            status: l.status,
            daysSinceLastActivity,
            isCritical: daysSinceLastActivity >= 7 && !hasFutureTask,
            hasAgenda: agendaItems.length > 0
          };
        })
        .filter((l: any) => l.isCritical)
        .sort((a: any, b: any) => b.daysSinceLastActivity - a.daysSinceLastActivity)
        .slice(0, 50);
    },
    enabled: !!userId,
  });

  const { data: feedbackLeads = [], isLoading: loadingFeedback, refetch: refetchFeedback } = useQuery({
    queryKey: ['dashboard_feedback', userId, promotionId],
    queryFn: async () => {
      let feedbackData: any[] = [];
      let query = supabase
        .from('leads')
        .select('id, name, email, source, created_at, status, feedback_sent, feedback_rating, feedback_responded_at')
        .or(`status.in.(visiting,closed),feedback_rating.not.is.null,feedback_sent.eq.true`);
      query = applyPromotionFilter(query, promotionId);
      const { data, error } = await query;
      
      if (!error && data) {
        feedbackData = data;
      } else {
        let fallbackQuery = supabase
          .from('leads')
          .select('id, name, email, source, created_at, status, feedback_sent')
          .in('status', ['visiting', 'closed'])
          .eq('feedback_sent', false);
        fallbackQuery = applyPromotionFilter(fallbackQuery, promotionId);
        const { data: fallbackData } = await fallbackQuery;
        feedbackData = fallbackData || [];
      }
      const now = new Date();
      return feedbackData
        .map((l: any) => {
          const daysSinceCreated = Math.floor((now.getTime() - new Date(l.created_at).getTime()) / (1000 * 60 * 60 * 24));
          return { ...l, daysSinceCreated };
        })
        .sort((a: any, b: any) => {
          if (a.feedback_responded_at && b.feedback_responded_at) {
            return new Date(b.feedback_responded_at).getTime() - new Date(a.feedback_responded_at).getTime();
          }
          if (a.feedback_responded_at) return -1;
          if (b.feedback_responded_at) return 1;
          return b.daysSinceCreated - a.daysSinceCreated;
        });
    },
    enabled: !!userId,
  });

  const { data: autoImportedLeads = [], isLoading: loadingAuto, refetch: refetchAuto } = useQuery({
    queryKey: ['dashboard_auto_imported', userId, promotionId],
    queryFn: async () => {
      let query = (supabase as any)
        .from('leads')
        .select('id, name, source, email, phone, status, created_at')
        .like('source', '%(Auto IA)%')
        .order('created_at', { ascending: false })
        .limit(20);
      query = applyPromotionFilter(query, promotionId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  const { data: untreatedLeads = [], isLoading: loadingUntreated, refetch: refetchUntreated } = useQuery({
    queryKey: ['dashboard_untreated', userId, promotionId, userCommercialName],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select('id, name, email, phone, source, status, created_at, assigned_to, agenda(id, completed)')
        .not('status', 'in', '("closed","lost")');

      query = applyPromotionFilter(query, promotionId);

      // Si el usuario tiene comercial asignado, filtrar por sus clientes
      if (userCommercialName) {
        query = query.eq('assigned_to', userCommercialName);
      }

      const { data, error } = await query;
      if (error) throw error;

      const now = new Date();

      return (data || [])
        .filter((lead: any) => {
          const agendaItems = lead.agenda || [];
          // Cliente sin tratar:
          // 1. Está en estado 'new' O
          // 2. No tiene ninguna acción en la agenda (o ninguna completada)
          const hasCompletedAction = agendaItems.some((a: any) => a.completed);
          const hasAnyAction = agendaItems.length > 0;
          const isUntreated = lead.status === 'new' || !hasAnyAction || !hasCompletedAction;

          return isUntreated;
        })
        .map((lead: any) => {
          const createdAt = new Date(lead.created_at);
          const diffMs = now.getTime() - createdAt.getTime();
          const daysUntreated = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

          return {
            id: lead.id,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            source: lead.source,
            status: lead.status,
            created_at: lead.created_at,
            assigned_to: lead.assigned_to,
            daysUntreated,
          } as UntreatedLead;
        })
        // Ordenados de más antiguo a más nuevo (mayor cantidad de días sin tratar primero)
        .sort((a: UntreatedLead, b: UntreatedLead) => b.daysUntreated - a.daysUntreated);
    },
    enabled: !!userId,
  });

  const loading = loadingStats || loadingRecent || loadingAgenda || loadingCritical || loadingFeedback || loadingAuto || loadingUntreated;

  const refresh = () => {
    refetchStats();
    refetchRecent();
    refetchAgenda();
    refetchCritical();
    refetchFeedback();
    refetchAuto();
    refetchUntreated();
  };

  const setAgenda = (updater: any) => {
    queryClient.setQueryData(['dashboard_agenda', userId, promotionId], updater);
  };

  return {
    stats: statsData || { totalLeads: 0, topSources: [] },
    recentLeads,
    agenda,
    criticalLeads,
    feedbackLeads,
    autoImportedLeads,
    untreatedLeads,
    loading,
    refresh,
    setAgenda
  };
}
