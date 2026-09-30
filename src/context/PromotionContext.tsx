import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { PROMOTIONS, type PromotionConfig } from '../config/promotions';
import { Building2, CheckCircle2, Sparkles, MapPin, ArrowRight, ShieldCheck } from 'lucide-react';

interface PromotionContextType {
  activePromotion: PromotionConfig;
  activePromotionId: 'arroyo' | 'farnesio';
  selectPromotion: (id: 'arroyo' | 'farnesio') => void;
  openSelectorModal: () => void;
  closeSelectorModal: () => void;
  isSelectorModalOpen: boolean;
}

const PromotionContext = createContext<PromotionContextType | undefined>(undefined);

const STORAGE_KEY = 'lubens_active_promotion';
const SESSION_CHOICE_KEY = 'lubens_promotion_session_chosen';

export const PromotionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activePromotionId, setActivePromotionId] = useState<'arroyo' | 'farnesio'>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'farnesio' || saved === 'arroyo') {
      return saved;
    }
    return 'arroyo';
  });

  const [isSelectorModalOpen, setIsSelectorModalOpen] = useState<boolean>(() => {
    const chosenInSession = sessionStorage.getItem(SESSION_CHOICE_KEY);
    return !chosenInSession;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, activePromotionId);
  }, [activePromotionId]);

  const selectPromotion = useCallback((id: 'arroyo' | 'farnesio') => {
    setActivePromotionId(id);
    sessionStorage.setItem(SESSION_CHOICE_KEY, 'true');
    setIsSelectorModalOpen(false);
  }, []);

  const openSelectorModal = useCallback(() => setIsSelectorModalOpen(true), []);
  const closeSelectorModal = useCallback(() => setIsSelectorModalOpen(false), []);

  const activePromotion = PROMOTIONS[activePromotionId];

  const contextValue = useMemo(() => ({
    activePromotion,
    activePromotionId,
    selectPromotion,
    openSelectorModal,
    closeSelectorModal,
    isSelectorModalOpen,
  }), [
    activePromotion,
    activePromotionId,
    selectPromotion,
    openSelectorModal,
    closeSelectorModal,
    isSelectorModalOpen,
  ]);

  return (
    <PromotionContext.Provider value={contextValue}>
      {children}
      {isSelectorModalOpen && (
        <PromotionSelectionModal
          activeId={activePromotionId}
          onSelect={selectPromotion}
          canClose={sessionStorage.getItem(SESSION_CHOICE_KEY) === 'true'}
          onClose={closeSelectorModal}
        />
      )}
    </PromotionContext.Provider>
  );
};

export const usePromotion = () => {
  const context = useContext(PromotionContext);
  if (!context) {
    throw new Error('usePromotion must be used within a PromotionProvider');
  }
  return context;
};

interface PromotionSelectionModalProps {
  activeId: 'arroyo' | 'farnesio';
  onSelect: (id: 'arroyo' | 'farnesio') => void;
  canClose: boolean;
  onClose: () => void;
}

function PromotionSelectionModal({ activeId, onSelect, canClose, onClose }: PromotionSelectionModalProps) {
  const arroyo = PROMOTIONS.arroyo;
  const farnesio = PROMOTIONS.farnesio;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-white p-6 sm:p-10">
        
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-semibold text-altavik-400 mb-4 tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-altavik-400" />
            LUBENS PROYECTO S.L. · CRM INMOBILIARIO
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight text-white mb-3">
            Selecciona la Promoción
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            ¿Con qué promoción inmobiliaria deseas trabajar en esta sesión? Puedes cambiarla en cualquier momento desde la barra superior.
          </p>
        </div>

        {/* Promotion Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          {/* Card: Lubens Arroyo */}
          <div
            onClick={() => onSelect('arroyo')}
            className={`group relative flex flex-col justify-between p-6 sm:p-8 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${
              activeId === 'arroyo'
                ? 'bg-slate-800/90 border-blue-500/80 shadow-xl shadow-blue-500/10 ring-1 ring-blue-500/50'
                : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600 hover:bg-slate-800/70'
            }`}
          >
            <div className="absolute top-4 right-4">
              {activeId === 'arroyo' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Activa
                </span>
              ) : (
                <span className="text-xs text-slate-500">Seleccionar</span>
              )}
            </div>

            <div>
              <div className="h-16 flex items-center justify-start mb-6">
                <img
                  src={arroyo.logo}
                  alt={arroyo.name}
                  className="max-h-12 max-w-[200px] object-contain rounded filter brightness-110"
                />
              </div>

              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                {arroyo.name}
              </h3>
              <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                {arroyo.tagline}
              </p>

              <div className="space-y-2 text-xs text-slate-300 mb-6 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span className="text-slate-300">{arroyo.siteAddress}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-slate-400">Reserva: <strong>6.000 €</strong> · 10% Contrato · 18 cuotas</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 group-hover:translate-x-0.5"
            >
              <span>Acceder a Lubens Arroyo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card: Lubens Farnesio */}
          <div
            onClick={() => onSelect('farnesio')}
            className={`group relative flex flex-col justify-between p-6 sm:p-8 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${
              activeId === 'farnesio'
                ? 'bg-slate-800/90 border-emerald-500/80 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500/50'
                : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600 hover:bg-slate-800/70'
            }`}
          >
            <div className="absolute top-4 right-4">
              {activeId === 'farnesio' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Activa
                </span>
              ) : (
                <span className="text-xs text-slate-500">Seleccionar</span>
              )}
            </div>

            <div>
              <div className="h-16 flex items-center justify-start mb-6">
                <img
                  src={farnesio.logo}
                  alt={farnesio.name}
                  className="max-h-12 max-w-[200px] object-contain rounded"
                />
              </div>

              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                {farnesio.name}
              </h3>
              <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                {farnesio.tagline}
              </p>

              <div className="space-y-2 text-xs text-slate-300 mb-6 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-slate-300">{farnesio.siteAddress}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-slate-400">Reserva: <strong>6.000 €</strong> · 10% Contrato · 18 cuotas</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 group-hover:translate-x-0.5"
            >
              <span>Acceder a Lubens Farnesio</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-800/80">
          <span>Promotor: <strong>{arroyo.legalName}</strong> (CIF: {arroyo.cif})</span>
          {canClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white underline text-xs transition-colors"
            >
              Cerrar sin cambiar
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
