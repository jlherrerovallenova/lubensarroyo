// src/hooks/useInventory.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type PropertyInfo = Database['public']['Tables']['inventory']['Row'];

/**
 * Hook para obtener el listado del Inventario filtrado opcionalmente por promoción
 */
export function useInventory(promotionId?: string) {
    return useQuery({
        queryKey: ['inventory', promotionId || 'all'],
        queryFn: async () => {
            let query = supabase
                .from('inventory')
                .select('*');

            if (promotionId) {
                if (promotionId === 'arroyo') {
                    query = query.or('promocion.eq.arroyo,promocion.is.null');
                } else {
                    query = query.eq('promocion', promotionId);
                }
            }

            const { data, error } = await query;

            if (error) {
                // Si la columna promocion todavía no existe en Supabase (antes de ejecutar la migración SQL)
                // hacemos un fallback a select('*') general para no romper la app
                if (error.message?.includes('promocion') || error.code === '42703') {
                    const fallback = await supabase.from('inventory').select('*');
                    if (fallback.error) throw new Error(fallback.error.message);
                    return sortProperties((fallback.data as PropertyInfo[]) || []);
                }
                throw new Error(error.message);
            }
            
            return sortProperties((data as PropertyInfo[]) || []);
        },
    });
}

function sortProperties(items: PropertyInfo[]) {
    return items.sort((a, b) => {
        const valA = a.n_orden || '';
        const valB = b.n_orden || '';
        const numA = parseInt(valA) || 0;
        const numB = parseInt(valB) || 0;
        if (numA !== numB) return numA - numB;
        return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
    });
}

/**
 * Mutación para eliminar una propiedad del inventario
 */
export function useDeleteProperty() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const { error } = await supabase.from('inventory').delete().eq('id', id);
            if (error) throw new Error(error.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
        },
    });
}
