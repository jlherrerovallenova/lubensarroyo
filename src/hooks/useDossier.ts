import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useRealtimeSync } from './useRealtimeSync';

export interface Dossier {
  id: string;
  lead_id: string;
  token: string;
  promocion_id: 'arroyo' | 'farnesio';
  commercial_name: string;
  selected_property_ids: string[];
  created_at: string;
  last_viewed_at: string | null;
  total_views: number;
  total_time_seconds: number;
  is_active: boolean;
}

export interface DossierEvent {
  id: number;
  dossier_id: string;
  session_id: string;
  event_type: 'page_view' | 'zoom_plano' | 'expand_calidades' | 'contact_click';
  page_section: string;
  duration_seconds: number;
  metadata: Record<string, any>;
  created_at: string;
}

export interface SectionHeatmap {
  section: string;
  label: string;
  totalSeconds: number;
  percentage: number;
  views: number;
}

function generateDossierToken(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export function useDossier(leadId?: string) {
  const queryClient = useQueryClient();

  useRealtimeSync('dossiers', ['lead_dossier', leadId]);
  useRealtimeSync('dossier_events', ['dossier_events', leadId]);

  // Obtener o consultar el dossier activo para este lead
  const { data: dossier, isLoading: loadingDossier, refetch: refetchDossier } = useQuery({
    queryKey: ['lead_dossier', leadId],
    queryFn: async () => {
      if (!leadId) return null;
      const { data, error } = await supabase
        .from('dossiers')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching dossier for lead:', error);
        return null;
      }
      return data as Dossier | null;
    },
    enabled: !!leadId,
  });

  // Obtener la telemetría y eventos si hay dossier
  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ['dossier_events', dossier?.id],
    queryFn: async () => {
      if (!dossier?.id) return [];
      const { data, error } = await supabase
        .from('dossier_events')
        .select('*')
        .eq('dossier_id', dossier.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching dossier events:', error);
        return [];
      }
      return (data || []) as DossierEvent[];
    },
    enabled: !!dossier?.id,
  });

  // Calcular el heatmap de secciones
  const heatmap: SectionHeatmap[] = (() => {
    if (!events.length) return [];

    const sectionLabels: Record<string, string> = {
      portada: 'Portada e Identidad',
      ubicacion: 'Ubicación y Entorno',
      edificio: 'Renders 3D y Fachada',
      viviendas: 'Plano y Viviendas Seleccionadas',
      calidades: 'Memoria de Calidades (Aerotermia)',
      garajes: 'Garajes y Trasteros',
      contacto: 'Contacto Comercial',
    };

    const sectionTimes: Record<string, { totalSeconds: number; views: number }> = {};
    let totalDossierSeconds = 0;

    events.forEach(ev => {
      const sec = ev.page_section || 'general';
      const dur = ev.duration_seconds || 0;
      if (!sectionTimes[sec]) {
        sectionTimes[sec] = { totalSeconds: 0, views: 0 };
      }
      sectionTimes[sec].totalSeconds += dur;
      sectionTimes[sec].views += 1;
      totalDossierSeconds += dur;
    });

    return Object.entries(sectionTimes)
      .map(([sec, stats]) => ({
        section: sec,
        label: sectionLabels[sec] || sec.charAt(0).toUpperCase() + sec.slice(1),
        totalSeconds: stats.totalSeconds,
        percentage: totalDossierSeconds > 0 ? Math.round((stats.totalSeconds / totalDossierSeconds) * 100) : 0,
        views: stats.views,
      }))
      .sort((a, b) => b.totalSeconds - a.totalSeconds);
  })();

  // Mutación para crear o renovar un dossier
  const createDossierMutation = useMutation({
    mutationFn: async ({
      leadId,
      promocionId,
      commercialName,
      selectedPropertyIds = []
    }: {
      leadId: string;
      promocionId: 'arroyo' | 'farnesio';
      commercialName: string;
      selectedPropertyIds?: string[];
    }) => {
      const token = generateDossierToken();
      const payload = {
        lead_id: leadId,
        token,
        promocion_id: promocionId,
        commercial_name: commercialName,
        selected_property_ids: selectedPropertyIds,
        is_active: true,
      };

      const { data, error } = await (supabase as any)
        .from('dossiers')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return data as Dossier;
    },
    onSuccess: (newDossier) => {
      queryClient.setQueryData(['lead_dossier', newDossier.lead_id], newDossier);
      queryClient.invalidateQueries({ queryKey: ['lead_dossier', newDossier.lead_id] });
    },
  });

  return {
    dossier,
    events,
    heatmap,
    loading: loadingDossier || loadingEvents,
    createDossier: createDossierMutation.mutateAsync,
    isCreating: createDossierMutation.isPending,
    refetchDossier,
  };
}
