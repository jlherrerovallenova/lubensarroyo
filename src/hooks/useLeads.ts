// src/hooks/useLeads.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useRealtimeSync } from './useRealtimeSync';
import type { Database } from '../types/supabase';

type Lead = Database['public']['Tables']['leads']['Row'];
type LeadUpdate = Database['public']['Tables']['leads']['Update'];
type LeadInsert = Database['public']['Tables']['leads']['Insert'];

export const LEADS_QUERY_KEY = ['leads'];

/**
 * Construye las condiciones de búsqueda en Supabase para leads,
 * permitiendo buscar por nombre, email y teléfono en múltiples formatos
 * (sin espacios, con espacios XXX XXX XXX, con formato XXX XX XX XX, prefijo +34, etc.)
 */
export function buildLeadSearchQuery(searchTerm: string): string {
  const cleanTerm = searchTerm.trim();
  if (!cleanTerm) return '';

  const conditions = [
    `name.ilike.%${cleanTerm}%`,
    `email.ilike.%${cleanTerm}%`,
    `phone.ilike.%${cleanTerm}%`
  ];

  // 1. Sin espacios, guiones ni puntos
  const noSpaces = cleanTerm.replace(/[\s.-]/g, '');
  if (noSpaces && noSpaces !== cleanTerm) {
    conditions.push(`phone.ilike.%${noSpaces}%`);
  }

  // 2. Variantes de formato telefónico
  const digitsOnly = cleanTerm.replace(/\D/g, '');
  if (digitsOnly && digitsOnly.length >= 3) {
    if (digitsOnly !== noSpaces && digitsOnly !== cleanTerm) {
      conditions.push(`phone.ilike.%${digitsOnly}%`);
    }

    // Prefijo de España 34 (+34)
    if (digitsOnly.startsWith('34') && digitsOnly.length > 9) {
      const without34 = digitsOnly.slice(2);
      conditions.push(`phone.ilike.%${without34}%`);
    }

    // Bloques de 3 dígitos (XXX XXX ...)
    const chunks3 = digitsOnly.match(/.{1,3}/g)?.join(' ');
    if (chunks3 && chunks3 !== cleanTerm && chunks3 !== noSpaces) {
      conditions.push(`phone.ilike.%${chunks3}%`);
    }

    // Bloques 3-2-2 (XXX XX XX ...)
    if (digitsOnly.length >= 5) {
      const head3 = digitsOnly.slice(0, 3);
      const rest = digitsOnly.slice(3);
      const chunks2 = rest.match(/.{1,2}/g)?.join(' ');
      const variant322 = `${head3} ${chunks2}`;
      if (variant322 !== cleanTerm && variant322 !== noSpaces && variant322 !== chunks3) {
        conditions.push(`phone.ilike.%${variant322}%`);
      }
    }
  }

  return Array.from(new Set(conditions)).join(',');
}

interface FetchLeadsParams {
  page: number;
  pageSize: number;
  searchTerm?: string;
  statusFilter?: string;
  sourceFilter?: string;
  promocionFilter?: string;
  assignedFilter?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export function useLeads(params: FetchLeadsParams) {
  const { page, pageSize, searchTerm, statusFilter, sourceFilter, promocionFilter, assignedFilter, sortField = 'created_at', sortDirection = 'desc' } = params;
  
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
        const searchConditions = buildLeadSearchQuery(searchTerm);
        if (searchConditions) {
          query = query.or(searchConditions);
        }
      }

      // Apply filters
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }
      if (sourceFilter) {
        query = query.ilike('source', `%${sourceFilter}%`);
      }
      if (assignedFilter) {
        if (assignedFilter === 'unassigned') {
          query = query.or('assigned_to.is.null,assigned_to.eq.""');
        } else {
          query = query.eq('assigned_to', assignedFilter);
        }
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
            const searchConditions = buildLeadSearchQuery(searchTerm);
            if (searchConditions) {
              fallbackQuery = fallbackQuery.or(searchConditions);
            }
          }
          if (statusFilter) fallbackQuery = fallbackQuery.eq('status', statusFilter);
          if (sourceFilter) fallbackQuery = fallbackQuery.ilike('source', `%${sourceFilter}%`);
          if (assignedFilter) {
            if (assignedFilter === 'unassigned') {
              fallbackQuery = fallbackQuery.or('assigned_to.is.null,assigned_to.eq.""');
            } else {
              fallbackQuery = fallbackQuery.eq('assigned_to', assignedFilter);
            }
          }
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
