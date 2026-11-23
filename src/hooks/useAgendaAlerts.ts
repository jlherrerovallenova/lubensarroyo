// src/hooks/useAgendaAlerts.ts
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface AgendaAlerts {
  todayCount: number;
  overdueCount: number;
  total: number;
  loading: boolean;
}

export function useAgendaAlerts(): AgendaAlerts {
  const { session, isAdmin, commercialName } = useAuth();
  const [todayCount, setTodayCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    let isMounted = true;

    const fetchAlerts = async () => {
      try {
        const now = new Date();

        // Inicio y fin del día de hoy (en local → ISO)
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

        let todayQuery = (supabase as any)
          .from('agenda')
          .select('id, leads!inner(assigned_to)', { count: 'exact', head: true })
          .eq('completed', false)
          .gte('due_date', startOfDay)
          .lte('due_date', endOfDay);

        let overdueQuery = (supabase as any)
          .from('agenda')
          .select('id, leads!inner(assigned_to)', { count: 'exact', head: true })
          .eq('completed', false)
          .lt('due_date', startOfDay);

        if (!isAdmin && commercialName) {
          todayQuery = todayQuery.eq('leads.assigned_to', commercialName);
          overdueQuery = overdueQuery.eq('leads.assigned_to', commercialName);
        }

        const [todayRes, overdueRes] = await Promise.all([
          todayQuery,
          overdueQuery,
        ]);

        if (isMounted) {
          setTodayCount(todayRes.count ?? 0);
          setOverdueCount(overdueRes.count ?? 0);
        }
      } catch (err) {
        console.error('Error fetching agenda alerts:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAlerts();

    // Refresca cada 5 minutos
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [session, isAdmin, commercialName]);

  return { todayCount, overdueCount, total: todayCount + overdueCount, loading };
}
