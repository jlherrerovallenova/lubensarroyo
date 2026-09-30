import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { PROMOTIONS, type PromotionConfig } from '../config/promotions';
import { Building2, Check, ChevronRight, X } from 'lucide-react';

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
  const promotionsList = [PROMOTIONS.arroyo, PROMOTIONS.farnesio];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (canClose && e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200">
        {/* Cabecera discreta */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Seleccionar Promoción
              </h3>
              <p className="text-[11px] text-slate-500">
                Elige la promoción activa de trabajo
              </p>
            </div>
          </div>
          {canClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Opciones de promoción */}
        <div className="p-3.5 space-y-2">
          {promotionsList.map((promo) => {
            const isActive = activeId === promo.id;
            return (
              <button
                key={promo.id}
                type="button"
                onClick={() => onSelect(promo.id)}
                className={`w-full group flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-slate-50/90 border-slate-300 shadow-xs ring-1 ring-slate-300'
                    : 'bg-white border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-16 h-10 flex-shrink-0 flex items-center justify-center p-1 bg-white border border-slate-100 rounded-lg shadow-2xs">
                    <img
                      src={promo.logo}
                      alt={promo.name}
                      className="max-h-7 max-w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 group-hover:text-altavik-600 transition-colors truncate">
                        {promo.name}
                      </span>
                      {isActive && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-900 text-white">
                          Activa
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 block truncate">
                      {promo.id === 'arroyo' ? 'Arroyo de la Encomienda' : 'Calle General Shelly 1, Valladolid'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center pl-2">
                  {isActive ? (
                    <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    </div>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Pie sutil */}
        <div className="px-5 py-2.5 bg-slate-50/75 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>LUBENS PROYECTO S.L.</span>
          {canClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-800 font-medium transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
