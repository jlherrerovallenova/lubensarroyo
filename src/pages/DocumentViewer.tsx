// src/pages/DocumentViewer.tsx
import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, MessageCircle, Phone, FileText, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PROMOTIONS } from '../config/promotions';

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} ${seconds === 1 ? 'segundo' : 'segundos'}`;
  }
  const mins = Math.floor(seconds / 60);
  const remSecs = seconds % 60;
  if (remSecs === 0) {
    return `${mins} ${mins === 1 ? 'minuto' : 'minutos'}`;
  }
  return `${mins} ${mins === 1 ? 'minuto' : 'minutos'} y ${remSecs} ${remSecs === 1 ? 'segundo' : 'segundos'}`;
}

export default function DocumentViewer() {
  const [searchParams] = useSearchParams();
  const trackingId = searchParams.get('t') || '';
  const leadId = searchParams.get('lead') || '';
  const docName = searchParams.get('doc') || 'Documento';
  const docUrl = searchParams.get('url') || '';
  const promoId = searchParams.get('promo') || 'farnesio';

  const [activeSeconds, setActiveSeconds] = useState(0);
  const activeSecondsRef = useRef(0);
  const historyRecordIdRef = useRef<string | null>(null);
  const isDocumentVisibleRef = useRef(!document.hidden);

  const promoKey = (promoId === 'arroyo' || promoId === 'farnesio') ? promoId : 'farnesio';
  const promotion = PROMOTIONS[promoKey];

  // 1. Al cargar la página: registrar apertura y crear registro de historial
  useEffect(() => {
    // Si viene con tracking_id de email, registrar la apertura inmediatamente en Supabase
    if (trackingId) {
      (supabase as any)
        .rpc('increment_email_open', { tracking_id: trackingId })
        .then(() => {
          console.log('✅ Apertura de correo confirmada al abrir documento:', trackingId);
        });
    }

    // Si viene con lead_id, crear el registro de visualización en lead_history
    if (leadId) {
      (supabase as any)
        .from('lead_history')
        .insert([{
          lead_id: leadId,
          event_type: 'document_view',
          description: `Lectura de plano/documento: "${docName}"`,
          metadata: {
            tracking_id: trackingId || null,
            doc_name: docName,
            doc_url: docUrl,
            promo: promoId,
            duration_seconds: 0,
            duration_formatted: '0 segundos',
            first_viewed_at: new Date().toISOString()
          }
        }])
        .select('id')
        .single()
        .then(({ data, error }: any) => {
          if (!error && data?.id) {
            historyRecordIdRef.current = data.id;
          }
        });
    }
  }, [trackingId, leadId, docName, docUrl, promoId]);

  const saveDuration = useCallback(async () => {
    const recordId = historyRecordIdRef.current;
    const currentSecs = activeSecondsRef.current;
    if (!recordId || currentSecs <= 0) return;

    try {
      const formatted = formatDuration(currentSecs);
      await (supabase as any)
        .from('lead_history')
        .update({
          description: `Revisó "${docName}" durante ${formatted}`,
          metadata: {
            tracking_id: trackingId || null,
            doc_name: docName,
            doc_url: docUrl,
            promo: promoId,
            duration_seconds: currentSecs,
            duration_formatted: formatted,
            last_ping_at: new Date().toISOString()
          }
        })
        .eq('id', recordId);
    } catch (err) {
      console.warn('Error al guardar duración de lectura:', err);
    }
  }, [docName, docUrl, promoId, trackingId]);

  // 2. Medir tiempo de lectura activo (solo cuando la pestaña está visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      isDocumentVisibleRef.current = !document.hidden;
      if (document.hidden) {
        saveDuration();
      }
    };

    const handleBeforeUnload = () => {
      saveDuration();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Temporizador cada segundo
    const interval = setInterval(() => {
      if (isDocumentVisibleRef.current) {
        activeSecondsRef.current += 1;
        setActiveSeconds(activeSecondsRef.current);
      }
    }, 1000);

    // Guardar periódicamente en Supabase cada 10 segundos
    const syncInterval = setInterval(() => {
      if (activeSecondsRef.current > 0) {
        saveDuration();
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      clearInterval(syncInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      saveDuration();
    };
  }, [saveDuration]);

  const isPdf = docUrl.toLowerCase().endsWith('.pdf') || docName.toLowerCase().endsWith('.pdf');

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Barra Superior Branded */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-lg z-20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2.5">
            {promotion.publicLogoUrl ? (
              <img 
                src={promotion.publicLogoUrl} 
                alt={promotion.name} 
                className="h-9 w-auto object-contain brightness-110 drop-shadow-sm" 
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-altavik-600 flex items-center justify-center font-black text-white text-xs">
                {promoId === 'farnesio' ? 'LF' : 'LA'}
              </div>
            )}
            <div className="hidden sm:block border-l border-slate-700 pl-3">
              <span className="text-[10px] uppercase font-black tracking-widest text-altavik-400 block leading-tight">
                {promotion.name}
              </span>
              <span className="text-xs font-semibold text-slate-300 block truncate max-w-[220px]">
                {docName}
              </span>
            </div>
          </div>
        </div>

        {/* Indicador discreto de tiempo activo */}
        <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700/60 text-xs font-medium text-slate-300">
          <Clock size={13} className="text-altavik-400" />
          <span>Tiempo de lectura: <strong className="text-white font-bold">{formatDuration(activeSeconds)}</strong></span>
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center gap-2 shrink-0">
          {docUrl && (
            <a
              href={docUrl}
              download={docName}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 shadow-sm"
              title="Descargar archivo"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Descargar</span>
            </a>
          )}
          <a
            href={`https://wa.me/34983342132?text=${encodeURIComponent(`Hola, estoy revisando el plano ${docName} de ${promotion.name} y me gustaría recibir más información.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            title="Contactar con la promotora por WhatsApp"
          >
            <MessageCircle size={14} />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        </div>
      </header>

      {/* Contenedor del Documento */}
      <main className="flex-1 w-full bg-slate-900 relative overflow-hidden flex items-center justify-center">
        {docUrl ? (
          isPdf ? (
            <iframe
              src={`${docUrl}#toolbar=1&navpanes=0`}
              title={docName}
              className="w-full h-full border-0 bg-white"
            />
          ) : (
            <div className="w-full h-full p-4 overflow-auto flex items-center justify-center">
              <img
                src={docUrl}
                alt={docName}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl bg-white"
              />
            </div>
          )
        ) : (
          <div className="text-center p-8 text-slate-400 max-w-md">
            <FileText size={48} className="mx-auto mb-3 opacity-30 text-altavik-400" />
            <h3 className="text-base font-bold text-slate-200 mb-1">Documento no disponible</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              El enlace al documento no contiene una ruta válida o ha caducado. Por favor, contacte con su asesor comercial.
            </p>
          </div>
        )}
      </main>

      {/* Pie de página discreto */}
      <footer className="h-9 bg-slate-950 border-t border-slate-800/80 px-4 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
        <span className="truncate">
          Promoción comercializada por <strong className="text-slate-400">TERRAVALL</strong> · Plaza Mayor 8, 1ºA, Valladolid
        </span>
        <a href="tel:983342132" className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors shrink-0 ml-2">
          <Phone size={12} />
          <span>983 342 132</span>
        </a>
      </footer>
    </div>
  );
}
