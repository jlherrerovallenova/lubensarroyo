import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { PROMOTIONS } from '../config/promotions';
import { useDossierTelemetry } from '../hooks/useDossierTelemetry';
import {
  Building2,
  MapPin,
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
  Sparkles,
  Calendar,
  Compass,
  ArrowRight,
  Home,
  Check,
  Eye,
  Award
} from 'lucide-react';

interface PropertyItem {
  id: string;
  n_orden: string;
  portal: string;
  planta: string;
  letra: string;
  dormitorios: number;
  banos: number;
  sup_util: number;
  sup_construida?: number;
  sup_terrazas: number;
  orientacion: string;
  precio: number;
  estado_vivienda: string;
  promocion: string;
  ficha_url?: string | null;
}

interface DossierData {
  id: string;
  lead_id: string;
  token: string;
  promocion_id: 'arroyo' | 'farnesio';
  commercial_name: string;
  selected_property_ids: string[];
  leads?: {
    name: string;
    phone: string | null;
    email: string | null;
  } | null;
}

export default function InteractiveDossier() {
  const { token } = useParams<{ token: string }>();
  const [dossier, setDossier] = useState<DossierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<PropertyItem | null>(null);
  const [filterDorm, setFilterDorm] = useState<number | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'edificio' | 'viviendas' | 'calidades' | 'ubicacion' | 'financiacion'>('edificio');

  // Cargar datos del dossier a través del token
  useEffect(() => {
    async function fetchDossierAndInventory() {
      if (!token) return;
      try {
        const { data: rawDossier, error: dossierError } = await (supabase as any)
          .from('dossiers')
          .select('*, leads(name, phone, email)')
          .eq('token', token)
          .single();

        if (dossierError || !rawDossier) {
          console.error('Error cargando dossier:', dossierError);
          setDossier(null);
        } else {
          const dossierData = rawDossier as DossierData;
          setDossier(dossierData);

          // Cargar el inventario de la promoción correspondiente
          const promo = dossierData.promocion_id || 'arroyo';
          const { data: invData } = await (supabase as any)
            .from('inventory')
            .select('*')
            .eq('promocion', promo)
            .order('dormitorios', { ascending: true })
            .order('precio', { ascending: true });

          if (invData && invData.length > 0) {
            setProperties(invData as PropertyItem[]);
            setSelectedProperty(invData[0] as PropertyItem);
          }
        }
      } catch (err) {
        console.error('Fallo al obtener dossier:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDossierAndInventory();
  }, [token]);

  // Hook de telemetría en tiempo real
  const { trackSection, logEvent } = useDossierTelemetry(dossier?.id);

  const handleTabChange = (tab: 'edificio' | 'viviendas' | 'calidades' | 'ubicacion' | 'financiacion') => {
    setActiveTab(tab);
    trackSection(tab);
  };

  const promoKey = dossier?.promocion_id === 'farnesio' ? 'farnesio' : 'arroyo';
  const promo = PROMOTIONS[promoKey];
  const clientName = dossier?.leads?.name || 'Estimado/a cliente';
  const commercial = dossier?.commercial_name || 'Juan Herrero';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f3f7] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-slate-600 font-medium text-sm animate-pulse">Cargando catálogo y memoria técnica...</p>
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

  const handleWhatsAppContact = (customMsg?: string) => {
    logEvent('contact_click', 'whatsapp', 0, { commercial, unit: selectedProperty?.n_orden });
    const text = encodeURIComponent(
      customMsg || `Hola ${commercial}, estoy viendo el dossier interactivo de ${promo.name} y me gustaría recibir más detalles.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const filteredProperties = properties.filter(p => {
    if (filterDorm === 'all') return true;
    return p.dormitorios === filterDorm;
  });

  return (
    <div className="min-h-screen bg-[#f0f3f7] text-slate-900 font-sans pb-24 selection:bg-emerald-100 selection:text-emerald-900">
      {/* HEADER SUPERIOR */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <img
            src={promo.logo || promo.publicLogoUrl}
            alt={promo.name}
            className="h-8 max-w-[130px] object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="border-l border-slate-200 pl-3">
            <h1 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
              {promo.name}
            </h1>
            <p className="text-[10px] text-slate-500 font-medium">{promo.tagline}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleWhatsAppContact()}
          className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
        >
          <MessageCircle size={14} />
          <span className="hidden sm:inline">Contactar con</span> {commercial.split(' ')[0]}
        </button>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* BANNER DE BIENVENIDA */}
        <section className="bg-gradient-to-br from-white via-white to-emerald-50/40 rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold tracking-tight">
              <Sparkles size={13} className="text-emerald-600" />
              Dossier Informativo Exclusivo
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Bienvenido/a, {clientName}.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              Te presentamos la información completa y actualizada de la promoción <strong className="text-slate-900 font-bold">{promo.name}</strong>. Explora las viviendas disponibles, planos con terrazas, memoria de calidades con aerotermia y simulador de formas de pago.
            </p>
          </div>
        </section>

        {/* BARRA DE PESTAÑAS */}
        <div className="flex p-1.5 bg-slate-200/70 rounded-2xl gap-1 overflow-x-auto custom-scrollbar-hide">
          {[
            { id: 'edificio', label: 'El Proyecto' },
            { id: 'viviendas', label: `Viviendas Disponibles (${properties.length})` },
            { id: 'calidades', label: 'Memoria de Calidades' },
            { id: 'financiacion', label: 'Forma de Pago' },
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

        {/* ================= PESTAÑA 1: EL PROYECTO ================= */}
        {activeTab === 'edificio' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Arquitectura, Confort y Sostenibilidad</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Un concepto residencial pensado para disfrutar cada estancia con máxima eficiencia.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                    Calificación Energética A
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Wind size={20} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Aerotermia y Suelo Radiante</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Climatización completa por suelo radiante-refrescante con termostato inteligente. Máximo confort térmico con un ahorro de hasta el 65% en factura energética.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-2.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Layers size={20} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Terrazas en Todas las Viviendas</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Salones y cocinas conectadas con amplias terrazas exteriores con barandillas de vidrio de seguridad que maximizan la luz natural y las vistas abiertas.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <ShieldCheck size={20} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Garaje y Trastero Incluidos</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Todas las viviendas cuentan con plaza de garaje de cómodo acceso y cuarto trastero independiente incluidos en el precio publicado.
                  </p>
                </div>
              </div>

              {promoKey === 'farnesio' && (
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h5 className="text-xs font-bold text-emerald-900">¿Quieres ver la maqueta interactiva 3D?</h5>
                    <p className="text-[11px] text-emerald-700 mt-0.5">Explora el edificio completo, fachadas y alturas desde cualquier ángulo.</p>
                  </div>
                  <a
                    href="https://lubens-farnesio.netlify.app/"
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs shrink-0 flex items-center gap-1.5"
                  >
                    Abrir Visor 3D <ArrowRight size={14} />
                  </a>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ================= PESTAÑA 2: VIVIENDAS DISPONIBLES Y PLANOS ================= */}
        {activeTab === 'viviendas' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Filtros de dormitorios */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Filtrar por:</span>
              {[
                { id: 'all', label: 'Todas las viviendas' },
                { id: 2, label: '2 Dormitorios' },
                { id: 3, label: '3 Dormitorios' },
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterDorm(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    filterDorm === f.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Listado de viviendas */}
              <div className="lg:col-span-5 space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {filteredProperties.map((p) => {
                  const isSelected = selectedProperty?.id === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedProperty(p);
                        logEvent('zoom_plano', `unidad_${p.portal}_${p.planta}_${p.letra}`, 0);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
                        isSelected
                          ? 'bg-emerald-50/70 border-emerald-400 shadow-xs'
                          : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900">
                              Portal {p.portal} • Planta {p.planta} {p.letra}
                            </span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-100/80 text-emerald-800">
                              {p.dormitorios} Dorm.
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium mt-1">
                            {p.sup_util} m² útiles • Terraza {p.sup_terrazas} m² • Orientación {p.orientacion}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-slate-900 font-mono block">
                            {p.precio.toLocaleString('es-ES')} €
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium">+10% IVA</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Ficha técnica y plano de la vivienda seleccionada */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5 sticky top-20">
                {selectedProperty ? (
                  <>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          Vivienda Seleccionada
                        </span>
                        <h4 className="text-lg font-black text-slate-900 mt-1">
                          Portal {selectedProperty.portal} — Planta {selectedProperty.planta} {selectedProperty.letra}
                        </h4>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="text-xl font-black text-emerald-700 font-mono">
                          {selectedProperty.precio.toLocaleString('es-ES')} €
                        </span>
                        <span className="text-[10px] text-slate-400 block font-medium">+10% IVA (Garaje y trastero incl.)</span>
                      </div>
                    </div>

                    {/* Desglose de superficies */}
                    <div className="grid grid-cols-3 gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium block">Sup. Útil</span>
                        <span className="text-sm font-bold text-slate-800 font-mono">{selectedProperty.sup_util} m²</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium block">Terraza</span>
                        <span className="text-sm font-bold text-slate-800 font-mono">{selectedProperty.sup_terrazas} m²</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium block">Orientación</span>
                        <span className="text-sm font-bold text-slate-800">{selectedProperty.orientacion}</span>
                      </div>
                    </div>

                    {/* Visor de Plano o Descarga de Ficha */}
                    {selectedProperty.ficha_url ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                          <span>Plano Oficial de la Vivienda:</span>
                          <a
                            href={selectedProperty.ficha_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-semibold"
                          >
                            <Download size={13} /> Descargar PDF
                          </a>
                        </div>
                        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 h-[320px]">
                          <iframe
                            src={`${selectedProperty.ficha_url}#toolbar=0&navpanes=0`}
                            title="Plano de vivienda"
                            className="w-full h-full border-0"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 rounded-2xl border border-dashed border-slate-200 text-center space-y-2 bg-slate-50/50">
                        <FileText size={28} className="mx-auto text-slate-400" />
                        <p className="text-xs font-bold text-slate-700">Plano acotado disponible con tu comercial</p>
                        <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                          Solicita a {commercial.split(' ')[0]} el plano en alta resolución con cotas detalladas de todas las estancias.
                        </p>
                      </div>
                    )}

                    {/* Botón para consultar por esta unidad */}
                    <button
                      type="button"
                      onClick={() => handleWhatsAppContact(
                        `Hola ${commercial}, me interesa la vivienda Portal ${selectedProperty.portal} - Planta ${selectedProperty.planta} ${selectedProperty.letra} (${selectedProperty.dormitorios} dorm.) de ${selectedProperty.precio.toLocaleString('es-ES')}€ de ${promo.name}. ¿Sigue libre para reservar visita?`
                      )}
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={15} />
                      Consultar disponibilidad de esta vivienda
                    </button>
                  </>
                ) : (
                  <p className="text-xs text-slate-500 text-center py-10">Selecciona una vivienda para ver su plano y ficha.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= PESTAÑA 3: MEMORIA DE CALIDADES ================= */}
        {activeTab === 'calidades' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Memoria de Calidades Constructivas</h3>
                <p className="text-xs text-slate-500 mt-0.5">Materiales nobles seleccionados bajo estrictos controles de aislamiento y durabilidad.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">01. Estructura y Fachada</span>
                  <h4 className="text-xs font-bold text-slate-800">Aislamiento Térmico Continuo</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Estructura de hormigón armado según normativa sismorresistente. Fachada con doble hoja cerámica, cámara de aire y aislamiento termoacústico continuo que suprime puentes térmicos.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">02. Carpintería Exterior</span>
                  <h4 className="text-xs font-bold text-slate-800">PVC con Rotura de Puente Térmico</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Carpintería de alta gama con perfiles multicámara y rotura de puente térmico. Doble acristalamiento bajo emisivo con cámara de gas argón para máxima atenuación de ruidos y pérdidas de calor.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">03. Climatización y Confort</span>
                  <h4 className="text-xs font-bold text-slate-800">Suelo Radiante y Refrescante</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Bomba de calor aerotérmica de alta eficiencia con distribución uniforme por suelo radiante en invierno y refrescante en verano. Sin radiadores que resten espacio a tus muebles.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">04. Pavimentos y Revestimientos</span>
                  <h4 className="text-xs font-bold text-slate-800">Gres Porcelánico Rectificado</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Pavimento porcelánico de primera marca en toda la vivienda especial para suelo radiante. Alicatados cerámicos de gran formato en baños con griferías termostáticas de bajo consumo de agua.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ================= PESTAÑA 4: FORMA DE PAGO Y CONDICIONES ================= */}
        {activeTab === 'financiacion' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Estructura de Pagos Garantizada</h3>
                <p className="text-xs text-slate-500 mt-0.5">Cantidades avaladas y aseguradas mediante cuenta especial de promoción bancaria.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">1. Señal Reserva</span>
                  <span className="text-lg font-black text-slate-900 font-mono block">{promo.reservationAmount.toLocaleString('es-ES')} €</span>
                  <span className="text-[10px] text-slate-500">Bloqueo de la vivienda</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">2. Contrato Compra</span>
                  <span className="text-lg font-black text-slate-900 font-mono block">{promo.contractPercentage}%</span>
                  <span className="text-[10px] text-slate-500">Menos la reserva pagada</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">3. Aplazado Obra</span>
                  <span className="text-lg font-black text-slate-900 font-mono block">{promo.installmentPercentage}%</span>
                  <span className="text-[10px] text-slate-500">En {promo.installmentCount} mensualidades</span>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase">4. Escritura / Llaves</span>
                  <span className="text-lg font-black text-emerald-900 font-mono block">{promo.deedPercentage}%</span>
                  <span className="text-[10px] text-emerald-700">Subrogación hipotecaria</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed">
                <strong className="text-slate-800">Entidad bancaria depositaria:</strong> {promo.bankName} (Cuenta: <span className="font-mono">{promo.bankAccount}</span>). Todas las cantidades entregadas durante la obra están cubiertas por aval bancario individual conforme a la Ley de Ordenación de la Edificación (LOE).
              </div>
            </section>
          </div>
        )}

        {/* ================= PESTAÑA 5: UBICACIÓN ================= */}
        {activeTab === 'ubicacion' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Emplazamiento y Servicios del Entorno</h3>
                <p className="text-xs text-slate-500 mt-0.5">{promo.siteAddress}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                    <MapPin size={16} /> Parada de Autobús y Accesos
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Líneas regulares de autobús urbano con parada a menos de 100 metros. Conexión directa y rápida con la autovía y las principales arterias de la ciudad.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
                    <Building2 size={16} /> Colegios y Zonas Comerciales
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Supermercados, farmacias, centros de salud y centros escolares de referencia a escasos minutos a pie de la parcela.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* FOOTER FLOTANTE PERMANENTE DE CONTACTO */}
      <aside aria-label="Contacto Comercial" className="fixed bottom-4 inset-x-4 max-w-lg mx-auto z-40 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-3 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center shrink-0 border border-emerald-100 shadow-2xs">
            {commercial.substring(0, 2).toUpperCase()}
          </div>
          <div className="truncate">
            <p className="text-xs font-bold text-slate-900 truncate">{commercial}</p>
            <p className="text-[10px] text-slate-400 font-medium">Asesor Comercial Terravall</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleWhatsAppContact()}
          className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs shrink-0"
        >
          <MessageCircle size={14} />
          Hablar por WhatsApp
        </button>
      </aside>
    </div>
  );
}
