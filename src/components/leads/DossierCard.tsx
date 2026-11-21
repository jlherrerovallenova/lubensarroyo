import React, { useState } from 'react';
import { Sparkles, Copy, Check, MessageCircle, Mail, ExternalLink, Flame, Clock, Eye, AlertCircle, Building2 } from 'lucide-react';
import { useDossier } from '../../hooks/useDossier';
import { PROMOTIONS } from '../../config/promotions';

interface DossierCardProps {
  lead: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    assigned_to: string | null;
    promocion_interes?: string | null;
  };
  agentName?: string;
}

export function DossierCard({ lead, agentName = 'Juan Herrero' }: DossierCardProps) {
  const { dossier, events, heatmap, loading, createDossier, isCreating } = useDossier(lead.id);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Determinar promoción
  const promoKey = (lead.promocion_interes === 'farnesio' ? 'farnesio' : 'arroyo') as 'arroyo' | 'farnesio';
  const promo = PROMOTIONS[promoKey];

  const commercial = lead.assigned_to || agentName;
  const dossierUrl = dossier ? `${window.location.origin}/dossier/${dossier.token}` : '';

  const handleCreate = async () => {
    try {
      setGenerating(true);
      await createDossier({
        leadId: lead.id,
        promocionId: promoKey,
        commercialName: commercial,
      });
    } catch (err) {
      console.error('Error generando dossier:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyLink = () => {
    if (!dossierUrl) return;
    navigator.clipboard.writeText(dossierUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    if (!dossierUrl) return;
    const phone = lead.phone?.replace(/\D/g, '') || '';
    const text = encodeURIComponent(
      `Hola ${lead.name}, soy ${commercial} de Terravall. Te comparto el dossier interactivo exclusivo de ${promo.name} preparado para ti:\n\n👉 ${dossierUrl}\n\nPuedes ver los planos detallados, calidades y memoria. Quedo a tu disposición para cualquier duda.`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  const handleShareEmail = () => {
    if (!dossierUrl) return;
    const subject = encodeURIComponent(`Dossier Interactivo Exclusivo: ${promo.name} - Lubens Residencial`);
    const body = encodeURIComponent(
      `Hola ${lead.name},\n\nSoy ${commercial} de Terravall.\n\nHe preparado para ti el dossier interactivo con la información de la promoción ${promo.name}:\n${dossierUrl}\n\nEn este enlace podrás examinar los planos en alta definición, renders y memoria de calidades.\n\nUn cordial saludo,\n${commercial}`
    );
    window.open(`mailto:${lead.email || ''}?subject=${subject}&body=${body}`, '_blank');
  };

  const formatMinutes = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
      {/* Cabecera */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <Sparkles size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              Dossier Interactivo Inteligente
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Live
              </span>
            </h4>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              Telemetría de lectura, tiempo por plano y mapa de calor
            </p>
          </div>
        </div>

        {!dossier && (
          <button
            type="button"
            disabled={isCreating || generating}
            onClick={handleCreate}
            className="text-[10px] font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-3 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <Sparkles size={12} />
            {isCreating || generating ? 'Generando...' : 'Generar Enlace'}
          </button>
        )}
      </div>

      {/* Si ya hay un dossier generado */}
      {dossier ? (
        <div className="space-y-4">
          {/* Métricas destacadas de lectura */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
            <div className="text-center border-r border-slate-200/70 pr-2">
              <span className="text-[10px] font-medium text-slate-400 block flex items-center justify-center gap-1">
                <Eye size={11} className="text-slate-400" />
                Aperturas
              </span>
              <span className="text-base font-black text-slate-800 font-mono">
                {dossier.total_views}
              </span>
            </div>
            <div className="text-center border-r border-slate-200/70 px-2">
              <span className="text-[10px] font-medium text-slate-400 block flex items-center justify-center gap-1">
                <Clock size={11} className="text-slate-400" />
                Tiempo total
              </span>
              <span className="text-base font-black text-slate-800 font-mono">
                {formatMinutes(dossier.total_time_seconds)}
              </span>
            </div>
            <div className="text-center pl-2">
              <span className="text-[10px] font-medium text-slate-400 block flex items-center justify-center gap-1">
                <Flame size={11} className={dossier.total_views > 0 ? 'text-amber-500' : 'text-slate-300'} />
                Interés
              </span>
              <span className="text-xs font-bold text-slate-700 block mt-1">
                {dossier.total_views === 0
                  ? 'Sin abrir'
                  : dossier.total_time_seconds > 300
                  ? 'Muy Alto 🔥'
                  : dossier.total_time_seconds > 60
                  ? 'Medio'
                  : 'Bajo'}
              </span>
            </div>
          </div>

          {/* Enlace y Botones de compartir */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={dossierUrl}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-600 truncate focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                title="Copiar enlace"
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all active:scale-95 shrink-0"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              </button>
              <a
                href={dossierUrl}
                target="_blank"
                rel="noreferrer"
                title="Abrir vista previa del cliente"
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all active:scale-95 shrink-0"
              >
                <ExternalLink size={14} />
              </a>
            </div>

            <div className="flex items-center gap-2 pt-1">
              {lead.phone && (
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <MessageCircle size={13} />
                  Enviar por WhatsApp
                </button>
              )}
              {lead.email && (
                <button
                  type="button"
                  onClick={handleShareEmail}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Mail size={13} />
                  Enviar por Email
                </button>
              )}
            </div>
          </div>

          {/* Heatmap de secciones consultadas */}
          {heatmap.length > 0 && (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <h5 className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                <span>Mapa de calor de atención</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {events.length} interacciones
                </span>
              </h5>

              <div className="space-y-1.5">
                {heatmap.map((sec) => (
                  <div key={sec.section} className="space-y-0.5">
                    <div className="flex justify-between items-center text-[10px] text-slate-600">
                      <span className="font-medium truncate">{sec.label}</span>
                      <span className="font-mono text-slate-400 shrink-0">
                        {formatMinutes(sec.totalSeconds)} ({sec.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          sec.percentage >= 40
                            ? 'bg-amber-500'
                            : sec.percentage >= 20
                            ? 'bg-emerald-500'
                            : 'bg-slate-300'
                        }`}
                        style={{ width: `${sec.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dossier.last_viewed_at && (
            <p className="text-[10px] text-slate-400 text-center font-medium">
              Última lectura: {new Date(dossier.last_viewed_at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
            </p>
          )}
        </div>
      ) : (
        <div className="py-4 text-center">
          <p className="text-xs text-slate-500">
            Aún no se ha generado un dossier interactivo para este cliente.
          </p>
        </div>
      )}
    </div>
  );
}
