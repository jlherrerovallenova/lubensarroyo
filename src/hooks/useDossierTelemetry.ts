import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useDossierTelemetry(dossierId?: string) {
  const sessionIdRef = useRef<string>(
    'sess_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now()
  );
  const activeSectionRef = useRef<string>('portada');
  const sectionStartTimeRef = useRef<number>(Date.now());
  const [currentSection, setCurrentSection] = useState<string>('portada');

  // Registrar un evento puntual o acumular tiempo
  const logEvent = useCallback(async (
    eventType: 'page_view' | 'zoom_plano' | 'expand_calidades' | 'contact_click',
    pageSection: string,
    durationSeconds: number = 0,
    metadata: Record<string, any> = {}
  ) => {
    if (!dossierId) return;

    try {
      await (supabase as any).from('dossier_events').insert([
        {
          dossier_id: dossierId,
          session_id: sessionIdRef.current,
          event_type: eventType,
          page_section: pageSection,
          duration_seconds: durationSeconds,
          metadata: {
            ...metadata,
            userAgent: navigator.userAgent,
            screen: `${window.innerWidth}x${window.innerHeight}`,
          },
        },
      ]);
    } catch (err) {
      console.warn('Error registrando telemetría de dossier:', err);
    }
  }, [dossierId]);

  // Cambiar de sección activa y registrar el tiempo transcurrido en la anterior
  const trackSection = useCallback((newSection: string) => {
    if (newSection === activeSectionRef.current) return;

    const now = Date.now();
    const duration = Math.max(1, Math.round((now - sectionStartTimeRef.current) / 1000));
    const prevSection = activeSectionRef.current;

    // Guardar telemetría de la sección previa
    logEvent('page_view', prevSection, duration);

    // Actualizar punteros
    activeSectionRef.current = newSection;
    sectionStartTimeRef.current = now;
    setCurrentSection(newSection);
  }, [logEvent]);

  // Al montar: registrar apertura y sumar visita
  useEffect(() => {
    if (!dossierId) return;

    const recordOpen = async () => {
      try {
        // Incrementar contador de aperturas y fecha
        const { data } = await (supabase as any)
          .from('dossiers')
          .select('total_views')
          .eq('id', dossierId)
          .single();

        const currentViews = data?.total_views || 0;

        await (supabase as any)
          .from('dossiers')
          .update({
            total_views: currentViews + 1,
            last_viewed_at: new Date().toISOString(),
          })
          .eq('id', dossierId);

        logEvent('page_view', 'portada', 0, { type: 'initial_open' });
      } catch (err) {
        console.warn('Error en apertura de dossier:', err);
      }
    };

    recordOpen();

    // Al desmontar (o cerrar ventana): guardar el último bloque de tiempo
    const handleUnload = () => {
      const now = Date.now();
      const duration = Math.max(1, Math.round((now - sectionStartTimeRef.current) / 1000));
      logEvent('page_view', activeSectionRef.current, duration);
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      handleUnload();
    };
  }, [dossierId, logEvent]);

  return {
    currentSection,
    trackSection,
    logEvent,
  };
}
