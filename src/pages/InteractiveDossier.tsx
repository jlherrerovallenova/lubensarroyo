import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { PROMOTIONS } from '../config/promotions';
import { useDossierTelemetry } from '../hooks/useDossierTelemetry';
import {
  Building2,
  MapPin,
  Flame,
  Wind,
  ShieldCheck,
  Phone,
  MessageCircle,
  FileText,
  ChevronRight,
  Maximize2,
  Download,
  CheckCircle2,
  Layers,
  Sparkles
} from 'lucide-react';

interface DossierData {
  id: string;
  lead_id: string;
  token: string;
  promocion_id: 'arroyo' | 'farnesio';
  commercial_name: string;
  selected_property_ids: string[];
  leads?: {
    name: string;
  } | null;
}

export default function InteractiveDossier() {
  const { token } = useParams<{ token: string }>();
  const [dossier, setDossier] = useState<DossierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'edificio' | 'planos' | 'calidades' | 'ubicacion'>('edificio');

  // Cargar datos del dossier a través del token
  useEffect(() => {
    async function fetchDossier() {
      if (!token) return;
      try {
        const { data, error } = await supabase
          .from('dossiers')
          .select('*, leads(name)')
          .eq('token', token)
          .single();

        if (error || !data) {
          console.error('Error cargando dossier:', error);
          setDossier(null);
        } else {
          setDossier(data as any);
        }
      } catch (err) {
        console.error('Fallo al obtener dossier:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDossier();
  }, [token]);

  // Hook de telemetría en tiempo real
  const { trackSection, logEvent } = useDossierTelemetry(dossier?.id);

  const handleTabChange = (tab: 'edificio' | 'planos' | 'calidades' | 'ubicacion') => {
    setActiveTab(tab);
    trackSection(tab);
  };

  const promoKey = dossier?.promocion_id === 'farnesio' ? 'farnesio' : 'arroyo';
  const promo = PROMOTIONS[promoKey];
  const clientName = dossier?.leads?.name || 'Futuro Propietario';
  const commercial = dossier?.commercial_name || 'Juan Herrero';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f3f7] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-slate-600 font-medium text-sm animate-pulse">Preparando tu dossier interactivo...</p>
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="min-h-screen bg-[#f0f3f7] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-4">
          <FileText size={24} />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Dossier no disponible</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          El enlace que estás intentando consultar ha expirado o no existe. Por favor, solicita uno nuevo a tu comercial.
        </p>
      </div>
    );
  }

  const handleWhatsAppContact = () => {
    logEvent('contact_click', 'whatsapp', 0, { commercial });
    const text = encodeURIComponent(
      `Hola ${commercial}, estoy viendo el dossier interactivo de ${promo.name} y me gustaría recibir más detalles.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#f0f3f7] text-slate-900 font-sans pb-24 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Barra superior fija con identidad */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-sm shadow-xs">
            L
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
              {promo.name}
            </h1>
            <p className="text-[10px] text-slate-500 font-medium">Lubens Residencial</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleWhatsAppContact}
          className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
        >
          <MessageCircle size={14} />
          <span className="hidden sm:inline">Hablar con</span> {commercial.split(' ')[0]}
        </button>
      </header>

      {/* Contenido principal */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Banner de Bienvenida personalizado */}
        <section className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold tracking-tight mb-3">
              <Sparkles size={13} className="text-emerald-600" />
              Dossier Exclusivo
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Bienvenido a tu nuevo hogar, {clientName}.
            </h2>
            <p className="text-sm text-slate-600 mt-2 font-medium leading-relaxed">
              Hemos preparado para ti la documentación interactiva con los planos, características técnicas y memoria de calidades de la promoción <strong className="text-slate-900">{promo.name}</strong>.
            </p>
          </div>
        </section>

        {/* Pestañas de Navegación del Dossier */}
        <div className="flex p-1 bg-slate-200/70 rounded-2xl gap-1 overflow-x-auto">
          {[
            { id: 'edificio', label: 'El Edificio' },
            { id: 'planos', label: 'Planos y Tipologías' },
            { id: 'calidades', label: 'Memoria de Calidades' },
            { id: 'ubicacion', label: 'Ubicación' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id as any)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sección 1: El Edificio */}
        {activeTab === 'edificio' && (
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Diseño Vanguardista y Sostenibilidad</h3>
              <p className="text-xs text-slate-500 mt-1">Líneas contemporáneas con máxima eficiencia energética (Calificación A).</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Wind size={20} />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Climatización por Aerotermia</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Sistema individual de suelo radiante y refrescante. Ahorro de hasta un 65% en el consumo energético anual.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Layers size={20} />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Amplias Terrazas y Luz</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Orientación estudiada para maximizar la entrada de luz natural en salones y cocinas diáfanas durante todo el día.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Sección 2: Planos y Tipologías */}
        {activeTab === 'planos' && (
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Distribución Interior y Planos Tipo</h3>
              <p className="text-xs text-slate-500 mt-1">Espacios optimizados para confort y funcionalidad diaria.</p>
            </div>

            <div className="space-y-4">
              {['2 Dormitorios', '3 Dormitorios', 'Ático con Terraza'].map((type, idx) => (
                <div
                  key={type}
                  onClick={() => logEvent('zoom_plano', `plano_${type}`, 0)}
                  className="p-4 rounded-2xl border border-slate-200/80 hover:border-emerald-300 transition-all cursor-pointer flex items-center justify-between group hover:bg-emerald-50/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-emerald-100 text-slate-500 group-hover:text-emerald-700 flex items-center justify-center transition-colors">
                      <FileText size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{type}</h4>
                      <p className="text-[11px] text-slate-500">Superficie útil desde 78 m² • Terraza y garaje incluidos</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sección 3: Memoria de Calidades */}
        {activeTab === 'calidades' && (
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Acabados y Materiales Premium</h3>
              <p className="text-xs text-slate-500 mt-1">Seleccionados por su durabilidad, aislamiento acústico y estética.</p>
            </div>

            <div className="space-y-3">
              {[
                { title: 'Aislamiento Térmico y Acústico', desc: 'Fachada con aislamiento continuo y rotura de puente térmico en carpinterías.' },
                { title: 'Pavimentos y Alicatados', desc: 'Gres porcelánico de primera calidad en toda la vivienda apto para suelo radiante.' },
                { title: 'Zonas Comunes', desc: 'Piscina comunitaria, zonas ajardinadas y preinstalación de recarga para vehículo eléctrico.' },
              ].map((item) => (
                <div key={item.title} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{item.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sección 4: Ubicación */}
        {activeTab === 'ubicacion' && (
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Emplazamiento y Conexiones</h3>
              <p className="text-xs text-slate-500 mt-1">{promo.siteAddress}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <MapPin size={22} className="text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-800">Excelente comunicación con el centro de la ciudad</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Paradas de autobús a 100m, supermercados, farmacia y centros deportivos cercanos.</p>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Botón flotante de contacto directo con el comercial en la esquina inferior */}
      <aside aria-label="Contacto Comercial" className="fixed bottom-4 inset-x-4 max-w-md mx-auto z-40 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-3 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center shrink-0 border border-emerald-100">
            {commercial.substring(0, 2).toUpperCase()}
          </div>
          <div className="truncate">
            <p className="text-xs font-bold text-slate-900 truncate">{commercial}</p>
            <p className="text-[10px] text-slate-400 font-medium">Tu asesor personal</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleWhatsAppContact}
          className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs shrink-0"
        >
          <MessageCircle size={14} />
          Consultar
        </button>
      </aside>
    </div>
  );
}
