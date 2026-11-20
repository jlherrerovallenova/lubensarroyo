import React from 'react';
import { UserX, Clock, Phone, Mail, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import type { UntreatedLead } from '../../hooks/useDashboardData';

interface UntreatedLeadsWidgetProps {
  leads: UntreatedLead[];
  userName?: string | null;
  onSelectLead?: (lead: UntreatedLead) => void;
}

export function UntreatedLeadsWidget({ leads, userName, onSelectLead }: UntreatedLeadsWidgetProps) {
  const navigate = useNavigate();

  const handleLeadClick = (lead: UntreatedLead) => {
    if (onSelectLead) {
      onSelectLead(lead);
    } else {
      navigate(`/leads?search=${encodeURIComponent(lead.name)}`);
    }
  };

  const getUrgencyBadge = (days: number) => {
    if (days >= 15) {
      return {
        bg: 'bg-rose-50 border-rose-200/80 text-rose-700',
        dot: 'bg-rose-500',
        label: `${days}d sin tratar`,
      };
    }
    if (days >= 7) {
      return {
        bg: 'bg-amber-50 border-amber-200/80 text-amber-700',
        dot: 'bg-amber-500',
        label: `${days}d sin tratar`,
      };
    }
    return {
      bg: 'bg-emerald-50 border-emerald-200/80 text-emerald-700',
      dot: 'bg-emerald-500',
      label: days === 0 ? 'Hoy' : `${days}d sin tratar`,
    };
  };

  return (
    <Card variant="white" noPadding className="flex flex-col group border border-slate-200/80 shadow-xs">
      {/* Cabecera uniforme con altura fija h-[96px] idéntica a Agenda Comercial y Nuevos Contactos */}
      <div className="px-6 sm:px-8 py-5 min-h-[96px] bg-slate-50/70 border-b border-slate-200/70 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-900 flex items-center gap-2.5 text-base sm:text-lg tracking-tight">
            <div className="w-9 h-9 bg-amber-50 rounded-xl border border-amber-200/70 flex items-center justify-center shrink-0">
              <UserX size={19} className="text-amber-600" />
            </div>
            Clientes sin Tratar
            {leads.length > 0 && (
              <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-500 text-white shadow-xs">
                {leads.length}
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {userName ? `Asignados a ${userName}` : 'Mis clientes pendientes de primera acción'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/leads?status=new')}
          className="text-[10px] font-bold uppercase tracking-wider text-slate-700 hover:text-slate-900 transition-all bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-xs hover:bg-slate-50 shrink-0"
        >
          Ver leads
        </button>
      </div>

      {/* Contenido / Listado ordenado de más antiguo a más nuevo */}
      <div className="p-4 space-y-1.5 overflow-y-auto max-h-[460px]">
        {leads.length === 0 ? (
          <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-3 shadow-xs">
              <Clock size={22} strokeWidth={2.5} />
            </div>
            <p className="text-sm font-bold text-slate-800">¡Todo al día!</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[240px]">
              No tienes ningún cliente sin atender o pendiente de primera acción comercial.
            </p>
          </div>
        ) : (
          leads.map((lead) => {
            const urgency = getUrgencyBadge(lead.daysUntreated);
            return (
              <div
                key={lead.id}
                onClick={() => handleLeadClick(lead)}
                className="flex items-center justify-between gap-3 p-3 hover:bg-slate-50/90 rounded-xl transition-all cursor-pointer group/item border border-slate-100 hover:border-slate-200/80 shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover/item:scale-105 group-hover/item:border-amber-200 group-hover/item:text-amber-600 transition-all shrink-0">
                    <UserX size={18} strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-bold text-slate-900 tracking-tight truncate group-hover/item:text-amber-700 transition-colors" title={lead.name}>
                        {lead.name}
                      </p>
                      {lead.status === 'new' && (
                        <span className="shrink-0 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          Nuevo
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-medium truncate">
                      {lead.phone ? (
                        <span className="flex items-center gap-1 font-mono text-[10px]">
                          <Phone size={10} className="text-slate-400 shrink-0" />
                          {lead.phone}
                        </span>
                      ) : lead.email ? (
                        <span className="flex items-center gap-1 text-[10px] truncate max-w-[150px]">
                          <Mail size={10} className="text-slate-400 shrink-0" />
                          {lead.email}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Sin contacto directo</span>
                      )}
                      <span className="text-[8px] text-slate-300">•</span>
                      <span className="text-[10px] text-slate-400 truncate">{lead.source || 'Directo'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold border shadow-2xs ${urgency.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${urgency.dot}`} />
                    {urgency.label}
                  </span>
                  <ChevronRight size={14} className="text-slate-300 group-hover/item:text-slate-600 transition-colors" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
