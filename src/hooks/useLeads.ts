// src/hooks/useLeads.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useRealtimeSync } from './useRealtimeSync';
import type { Database } from '../types/supabase';

type Lead = Database['public']['Tables']['leads']['Row'];
type LeadUpdate = Database['public']['Tables']['leads']['Update'];
type LeadInsert = Database['public']['Tables']['leads']['Insert'];

export const LEADS_QUERY_KEY = ['leads'];

interface FetchLeadsParams {
  page: number;
  pageSize: number;
  searchTerm?: string;
  statusFilter?: string;
  sourceFilter?: string;
  promocionFilter?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export function useLeads(params: FetchLeadsParams) {
  const { page, pageSize, searchTerm, statusFilter, sourceFilter, promocionFilter, sortField = 'created_at', sortDirection = 'desc' } = params;
  
  // Sincronización en tiempo real
  useRealtimeSync('leads', LEADS_QUERY_KEY);

  return useQuery({
    queryKey: [...LEADS_QUERY_KEY, params],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('leads')
        .select('*', { count: 'exact' });

      // Apply sorting
      query = query.order(sortField as keyof Lead, { ascending: sortDirection === 'asc' });

      // Apply search
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }

      // Apply filters
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }
      if (sourceFilter) {
        query = query.ilike('source', `%${sourceFilter}%`);
      }

      // Apply promotion filter
      if (promocionFilter && promocionFilter !== 'all') {
        if (promocionFilter === 'arroyo') {
          query = query.or('promocion_interes.eq.arroyo,promocion_interes.eq.ambas,promocion_interes.is.null');
        } else if (promocionFilter === 'farnesio') {
          query = query.or('promocion_interes.eq.farnesio,promocion_interes.eq.ambas');
        } else {
          query = query.eq('promocion_interes', promocionFilter);
        }
      }

      const { data, error, count } = await query.range(from, to);

      if (error) {
        // Fallback si la columna promocion_interes aún no ha sido creada en Supabase
        if (error.message?.includes('promocion_interes') || error.code === '42703') {
          let fallbackQuery = supabase
            .from('leads')
            .select('*', { count: 'exact' })
            .order(sortField as keyof Lead, { ascending: sortDirection === 'asc' });
          if (searchTerm) {
            fallbackQuery = fallbackQuery.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
          }
          if (statusFilter) fallbackQuery = fallbackQuery.eq('status', statusFilter);
          if (sourceFilter) fallbackQuery = fallbackQuery.ilike('source', `%${sourceFilter}%`);
          const fbResult = await fallbackQuery.range(from, to);
          if (fbResult.error) throw fbResult.error;
          return {
            leads: (fbResult.data || []) as Lead[],
            totalCount: fbResult.count || 0
          };
        }
        throw error;
      }

      return {
        leads: (data || []) as Lead[],
        totalCount: count || 0
      };
    }
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: LeadUpdate }) => {
      const { data, error } = await (supabase as any)
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Lead;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY });
      queryClient.setQueryData(['lead', data.id], data);
    }
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newLead: LeadInsert) => {
      const { data, error } = await (supabase as any)
        .from('leads')
        .insert([newLead])
        .select()
        .single();

      if (error) throw error;
      return data as Lead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY });
    }
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY });
    }
  });
}
