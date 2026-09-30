// src/pages/Pipeline.tsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Loader2,
  Globe,
  Smartphone,
  Users,
  Phone,
  HelpCircle,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { useLeads, useUpdateLead } from '../hooks/useLeads';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import type { Database } from '../types/supabase';
import LeadDetailModal from '../components/leads/LeadDetailModal';
import { usePromotion } from '../context/PromotionContext';

type Lead = Database['public']['Tables']['leads']['Row'];

const COLUMNS = [
  { id: 'new', title: 'Nuevos', color: 'border-blue-400', bg: 'bg-blue-50/50', text: 'text-blue-700' },
  { id: 'contacted', title: 'Contactados', color: 'border-purple-400', bg: 'bg-purple-50/50', text: 'text-purple-700' },
  { id: 'qualified', title: 'Cualificados', color: 'border-altavik-400', bg: 'bg-altavik-50/50', text: 'text-altavik-700' },
  { id: 'visiting', title: 'Visitando', color: 'border-cyan-400', bg: 'bg-cyan-50/50', text: 'text-cyan-700' },
  { id: 'closed', title: 'Venta Cerrada', color: 'border-slate-800', bg: 'bg-slate-100', text: 'text-slate-800' },
];

export default function Pipeline() {
  const navigate = useNavigate();
  const { activePromotion, activePromotionId } = usePromotion();
  const [promoFilter, setPromoFilter] = useState<'current' | 'all'>('current');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const draggedLeadIdRef = useRef<string | null>(null);

  // React Query para obtener todos los leads activos
  const { data, isLoading: loading } = useLeads({
    page: 1,
    pageSize: 1000, // En el pipeline queremos ver todos los activos a la vez
    statusFilter: undefined, // No filtramos por status aquí porque los separamos por columnas
    promocionFilter: promoFilter === 'current' ? activePromotionId : 'all',
    sortField: 'created_at',
    sortDirection: 'desc'
  });

  const updateMutation = useUpdateLead();
  const leads = (data?.leads || []).filter(l => l.status !== 'lost');

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    draggedLeadIdRef.current = leadId;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', leadId);

    setTimeout(() => {
      const element = document.getElementById(`lead-card-${leadId}`);
      if (element) element.classList.add('opacity-50');
    }, 0);
  };

  const handleDragEnd = (_e: React.DragEvent, leadId: string) => {
    draggedLeadIdRef.current = null;
    const element = document.getElementById(`lead-card-${leadId}`);
    if (element) element.classList.remove('opacity-50');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadIdRef.current;

    if (!leadId) return;

    const leadToMove = leads.find(l => l.id === leadId);
    if (!leadToMove || leadToMove.status === newStatus) return;

    // Actualización mediante mutación de React Query
    updateMutation.mutate({
      id: leadId,
      updates: { status: newStatus as any }
    });
    
    draggedLeadIdRef.current = null;
  };

  const getSourceIcon = (sourceName: string | null) => {
    if (!sourceName) return <HelpCircle size={12} />;
    const lower = sourceName.toLowerCase();
    if (lower.includes('importado') || lower.includes('excel') || lower.includes('csv')) {
      return (
        <div className="w-3.5 h-3.5 bg-amber-100 flex items-center justify-center rounded shadow-sm border border-amber-200 overflow-hidden shrink-0">
          <FileSpreadsheet size={10} className="text-amber-700" />
        </div>
      );
    }
    if (lower.includes('idealista')) {
      return (
        <div className="w-3.5 h-3.5 bg-[#deff30] flex items-center justify-center rounded shadow-sm border border-black/10 overflow-hidden shrink-0">
          <span className="text-[7px] font-black text-slate-900 leading-none mr-[0.5px]">id</span>
        </div>
      );
    }
    if (lower.includes('web') || lower.includes('google')) return <Globe size={12} className="text-blue-500" />;
    if (lower.includes('insta') || lower.includes('facebook')) return <Smartphone size={12} className="text-pink-500" />;
    if (lower.includes('referido') || lower.includes('amigo')) return <Users size={12} className="text-purple-500" />;
    if (lower.includes('llamada') || lower.includes('tel')) return <Phone size={12} className="text-green-500" />;
    return <HelpCircle size={12} className="text-slate-400" />;
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-slate-400 gap-4">
        <Loader2 className="animate-spin" size={40} />
        <p className="font-medium animate-pulse">Cargando tablero de ventas...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] animate-in fade-in duration-500 max-w-[1600px] mx-auto w-full gap-6">
      <PageHeader 
        title="Pipeline de Ventas"
        icon={<TrendingUp className="text-white" strokeWidth={3} size={24} />}
        subtitle={
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
            <span className="tabular-nums font-bold text-altavik-600 bg-altavik-50 px-2 py-0.5 rounded-lg border border-altavik-100">
              {leads.length}
            </span> 
            clientes activos {promoFilter === 'current' ? `(${activePromotion.name})` : '(Todas las promociones)'}
          </p>
        }
        actions={
          <div className="flex items-center gap-1 bg-white/80 border border-slate-200 p-1 rounded-xl shadow-xs">
            <button
              type="button"
              onClick={() => setPromoFilter('current')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                promoFilter === 'current'
                  ? 'bg-altavik-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {activePromotion.name}
            </button>
            <button
              type="button"
              onClick={() => setPromoFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                promoFilter === 'all'
                  ? 'bg-altavik-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Todas
            </button>
          </div>
        }
      />

      <div className="flex-1 flex gap-1.5 md:gap-2 overflow-hidden pb-4">
        {COLUMNS.map(column => {
          const columnLeads = leads.filter(lead => (lead.status || 'new') === column.id);
          const totalValue = columnLeads.length;

          return (
            <div
              key={column.id}
              className={`flex flex-col min-w-0 flex-1 rounded-xl border ${column.bg} border-slate-200 shadow-sm`}
              onDragOver={handleDragOver}
              // react-doctor-disable-next-line no-impure-state-updater
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className={`p-2 border-b border-slate-200/50 flex flex-col sm:flex-row justify-between items-center rounded-t-xl bg-white/50 backdrop-blur-sm border-t-2 ${column.color}`}>
                <h3 className={`font-bold text-[9px] sm:text-[10px] ${column.text} uppercase tracking-tighter truncate w-full text-center sm:text-left`}>
                  {column.title}
                </h3>
                <span className="bg-white/80 text-slate-700 px-1.5 py-0.5 rounded-full text-[9px] font-black border border-slate-100 shadow-sm shrink-0">
                  {totalValue}
                </span>
              </div>

              <div className="p-1.5 flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                {columnLeads.length === 0 ? (
                  <div className="h-16 border border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-300 text-[8px] font-bold uppercase tracking-tighter text-center">
                    +
                  </div>
                ) : (
                  columnLeads.map(lead => (
                    <div
                      key={lead.id}
                      id={`lead-card-${lead.id}`}
                      draggable
                      // react-doctor-disable-next-line no-impure-state-updater
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      // react-doctor-disable-next-line no-impure-state-updater
                      onDragEnd={(e) => handleDragEnd(e, lead.id)}
                      onClick={() => setSelectedLead(lead)}
                      onDoubleClick={() => navigate(`/leads?search=${encodeURIComponent(lead.name)}`)}
                      className="bg-white p-2 rounded-lg shadow-sm border border-slate-100 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-altavik-400 transition-all group relative overflow-hidden"
                    >
                      {/* Name & Promotion Badge */}
                      <div className="flex items-start justify-between gap-1 mb-2">
                        <h4 className="font-bold text-slate-900 text-[10px] sm:text-[11px] leading-tight break-words group-hover:text-altavik-700 transition-colors">
                          {lead.name}
                        </h4>
                        {lead.promocion_interes === 'farnesio' && (
                          <span className="shrink-0 text-[7px] font-black uppercase px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            F
                          </span>
                        )}
                        {lead.promocion_interes === 'arroyo' && (
                          <span className="shrink-0 text-[7px] font-black uppercase px-1 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            A
                          </span>
                        )}
                        {lead.promocion_interes === 'ambas' && (
                          <span className="shrink-0 text-[7px] font-black uppercase px-1 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200">
                            A+F
                          </span>
                        )}
                      </div>

                      {/* Footer: Ultra compact */}
                      <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-50">
                        <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[60%]">
                          {getSourceIcon(lead.source)}
                          <span className="truncate">{lead.source || 'Dir'}</span>
                        </div>
                        
                        <span className="text-[8px] text-slate-400 font-bold whitespace-nowrap bg-slate-50 px-1 rounded border border-slate-100">
                          {new Date(lead.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={() => {
            // React Query se encarga de invalidar las queries, así que no necesitamos una función local
            setSelectedLead(null);
          }}
        />
      )}
    </div>
  );
}