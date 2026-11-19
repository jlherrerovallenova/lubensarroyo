import React, { useState } from 'react';
import { Box, ExternalLink, RefreshCw, Maximize2, Sparkles, Sun, CheckCircle, Info } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { usePromotion } from '../context/PromotionContext';

export default function Edificio3D() {
  const { activePromotion } = usePromotion();
  const [iframeKey, setIframeKey] = useState(0);
  const [loading, setLoading] = useState(true);

  const app3dUrl = 'https://lubens-farnesio.netlify.app/';

  const handleRefresh = () => {
    setLoading(true);
    setIframeKey(k => k + 1);
  };

  const handleOpenExternal = () => {
    window.open(app3dUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-300">
      <PageHeader
        title="Edificio 3D Interactivo"
        icon={<Box size={24} strokeWidth={2.5} className="text-indigo-600" />}
        subtitle={
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
            <span>Maqueta 3D oficial de</span>
            <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
              Lubens Farnesio
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              En Vivo
            </span>
          </p>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleRefresh}
              className="bg-white shadow-xs hover:bg-slate-50"
              title="Recargar visor 3D"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Recargar</span>
            </Button>
            <Button
              type="button"
              onClick={handleOpenExternal}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              title="Abrir a pantalla completa en pestaña nueva"
            >
              <ExternalLink size={16} />
              <span>Abrir en Pestaña Completa</span>
            </Button>
          </div>
        }
      />

      {/* Banner informativo de características */}
      <div className="bg-gradient-to-r from-indigo-50/90 via-sky-50/60 to-white rounded-2xl p-4 border border-indigo-100/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles size={18} />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-950">Estudio 3D & Simulación Solar</h4>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Corte isométrico, recorridos solares por hora y estado de viviendas en tiempo real.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200/70">
            <Sun size={13} className="text-amber-500" /> Sol en Vivo
          </span>
          <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200/70">
            <CheckCircle size={13} className="text-emerald-500" /> 80 Viviendas
          </span>
        </div>
      </div>

      {/* Visor 3D Embebido */}
      <Card noPadding className="relative overflow-hidden rounded-2xl border border-slate-200 shadow-lg bg-slate-950 min-h-[680px]">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-xs text-white gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Box size={26} className="animate-bounce" />
            </div>
            <p className="font-bold text-sm text-slate-200">Cargando Edificio 3D...</p>
            <p className="text-xs text-slate-400">Preparando Three.js, texturas y geometrías</p>
          </div>
        )}
        <iframe
          key={iframeKey}
          src={app3dUrl}
          title="Edificio 3D Lubens Farnesio"
          onLoad={() => setLoading(false)}
          className="w-full h-[calc(100vh-230px)] min-h-[680px] border-none"
          allow="accelerometer; autoplay; camera; encrypted-media; gyroscope; picture-in-picture; xr-spatial-tracking"
        />
      </Card>
    </div>
  );
}
