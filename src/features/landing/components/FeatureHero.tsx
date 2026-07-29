import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  Package, 
  ShieldAlert, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp, 
  AlertTriangle,
  Mic,
  Zap,
  Check
} from 'lucide-react';
import { HERO_COPYWRITING, type HeroFeature } from '../constants/heroCopywriting';
import { Button } from '@/shared/ui';

const ICON_MAP = {
  ShoppingCart,
  Package,
  ShieldAlert,
  Sparkles,
};

export function FeatureHero() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const currentFeature = HERO_COPYWRITING.features[activeTab];

  return (
    <section className="relative overflow-hidden bg-white pt-12 pb-16 md:pt-20 md:pb-24 border-b border-gray-100">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-50/60 via-indigo-50/30 to-transparent pointer-events-none -z-10 blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Eyebrow Badge */}
        <div className="flex justify-center mb-4">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 shadow-xs tracking-wider uppercase">
            <Zap className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
            {HERO_COPYWRITING.eyebrow}
          </span>
        </div>

        {/* Header Section (Mobile First + Premium Typography) */}
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl heading-hero text-gray-900 mb-5 tracking-tighter">
            {HERO_COPYWRITING.headline}
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto mb-8 font-normal">
            {HERO_COPYWRITING.subheadline}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold shadow-lg shadow-blue-500/15 transition-transform active:scale-95 cursor-pointer"
            >
              {HERO_COPYWRITING.ctaPrimary}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => {
                document.getElementById('funcionalidades')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
            >
              {HERO_COPYWRITING.ctaSecondary}
            </Button>
          </div>
        </div>

        {/* Feature Tabs (Mobile First Horizontal Scroll / Desktop Grid) */}
        <div id="funcionalidades" className="flex flex-nowrap overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-3 pb-4 md:grid md:grid-cols-4 md:overflow-visible md:pb-0 scroll-mt-24">
          {HERO_COPYWRITING.features.map((feature: HeroFeature, index: number) => {
            const Icon = ICON_MAP[feature.iconName];
            const isActive = activeTab === index;

            return (
              <button
                key={feature.id}
                onClick={() => setActiveTab(index)}
                className={`min-w-[82vw] sm:min-w-[280px] snap-center flex-shrink-0 text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer md:min-w-0 md:w-full ${
                  isActive
                    ? 'border-blue-600 bg-blue-50/40 shadow-sm ring-1 ring-blue-600/20'
                    : 'border-gray-200/80 bg-white hover:border-gray-300 hover:bg-gray-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`p-2.5 rounded-xl transition-colors ${
                      isActive ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {feature.badge}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-1 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                  {feature.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Visual Mockup Area (Glassmorphism + Framer Motion) */}
        <div className="mt-6 w-full min-h-[380px] md:h-[500px] bg-gradient-to-b from-gray-50 to-white backdrop-blur-md border border-gray-200/90 rounded-2xl shadow-xl overflow-hidden relative p-4 sm:p-6 flex flex-col">
          {/* Mockup Header bar */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-200/70">
            <div className="flex items-center gap-2.5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
              </div>
              <span className="text-xs font-semibold text-gray-700 ml-2 truncate">
                {currentFeature.mockupTitle}
              </span>
            </div>
            <span className="text-[11px] font-medium text-gray-400 hidden sm:inline-block">
              {currentFeature.mockupSubtitle}
            </span>
          </div>

          {/* Dynamic Mockup Body */}
          <div className="flex-1 relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="h-full flex flex-col justify-between"
              >
                {/* 1. PDV MOCKUP */}
                {activeTab === 0 && (
                  <div className="space-y-3.5 h-full flex flex-col justify-between">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2 space-y-2">
                        <div className="flex items-center justify-between p-3 bg-white border border-gray-200/80 rounded-xl shadow-2xs">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">01</div>
                            <div>
                              <p className="text-xs font-bold text-gray-800">Leite Integral 1L - Marca Alvorada</p>
                              <p className="text-[11px] text-gray-400">Cod: 7891234567890 • Qtd: 3</p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-gray-900">R$ 17,97</span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-white border border-gray-200/80 rounded-xl shadow-2xs">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">02</div>
                            <div>
                              <p className="text-xs font-bold text-gray-800">Café Torrado e Moído 500g</p>
                              <p className="text-[11px] text-gray-400">Cod: 7899876543210 • Qtd: 1</p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-gray-900">R$ 18,50</span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-200 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">SCAN</div>
                            <div>
                              <p className="text-xs font-bold text-blue-950">Biscoito Recheado Chocolate</p>
                              <p className="text-[11px] text-blue-600">Registrado agora por código de barras</p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-blue-700">R$ 4,20</span>
                        </div>
                      </div>

                      {/* Cashier Sidebar Totals */}
                      <div className="bg-gray-900 text-white p-4 rounded-xl flex flex-col justify-between shadow-md">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Total da Compra</p>
                          <p className="text-3xl font-extrabold tracking-tight text-white mt-1">R$ 40,67</p>
                          <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            NFC-e Pronta para Emissão
                          </p>
                        </div>
                        <button className="w-full py-2.5 mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2">
                          FINALIZAR (F12)
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-100/70 p-2.5 rounded-lg border border-gray-200/50">
                      <span>Operador: Carlos Silva (Matrícula #842)</span>
                      <span className="text-emerald-600 font-semibold">● Modo Offline Ativo (Sincronização Automática)</span>
                    </div>
                  </div>
                )}

                {/* 2. ESTOQUE ANTI-RUPTURA MOCKUP */}
                {activeTab === 1 && (
                  <div className="space-y-4 h-full flex flex-col justify-between">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-4 bg-white border border-gray-200 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-500">Hortifrúti</span>
                          <span className="text-xs font-bold text-emerald-600">92% Em estoque</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full w-[92%]" />
                        </div>
                      </div>

                      <div className="p-4 bg-red-50/60 border border-red-200 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-red-900">Laticínios</span>
                          <span className="text-xs font-extrabold text-red-600 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> 14% ALERTA
                          </span>
                        </div>
                        <div className="w-full h-2 bg-red-100 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500 rounded-full w-[14%]" />
                        </div>
                      </div>

                      <div className="p-4 bg-white border border-gray-200 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-500">Mercearia</span>
                          <span className="text-xs font-bold text-blue-600">78% Em estoque</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full w-[78%]" />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-900 text-white rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-800 rounded-lg">
                          <TrendingUp className="w-5 h-5 text-blue-300" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Sugestão de Reposição Automática por IA</p>
                          <p className="text-[11px] text-blue-200">200un Leite Desnatado 1L — Chegada estimada: Amanhã às 08h</p>
                        </div>
                      </div>
                      <button className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-colors">
                        Aprovar Pedido
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. AUDITORIA ANTI-FRAUDE MOCKUP */}
                {activeTab === 2 && (
                  <div className="space-y-3.5 h-full flex flex-col justify-between">
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center text-xs font-bold text-gray-600">
                        <span>Fluxo de Registro de Caixas</span>
                        <span>Status de Segurança: Seguro</span>
                      </div>
                      <div className="divide-y divide-gray-100">
                        <div className="p-3 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="font-semibold text-gray-800">Caixa 03 — Venda Regular</span>
                          </div>
                          <span className="text-gray-500">Valor: R$ 142,90</span>
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium text-[11px]">Auditado Normal</span>
                        </div>
                        <div className="p-3 flex items-center justify-between text-xs bg-amber-50/50">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <span className="font-semibold text-amber-950">Caixa 02 — Cancelamento de Item Atípico</span>
                          </div>
                          <span className="text-gray-600">Valor: R$ 380,00</span>
                          <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-bold text-[11px]">Requer Validação Gerencial</span>
                        </div>
                        <div className="p-3 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="font-semibold text-gray-800">Caixa 01 — Sangria de Segurança</span>
                          </div>
                          <span className="text-gray-500">Valor: R$ 1.000,00</span>
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium text-[11px]">Autorizado por Biometria</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-900 text-gray-300 rounded-xl text-xs flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        Sistema de Alerta de Divergências Ativo
                      </span>
                      <span className="text-emerald-400 font-semibold">0 Fraudes Detectadas Hoje</span>
                    </div>
                  </div>
                )}

                {/* 4. COPILOTO MAYRA AI MOCKUP */}
                {activeTab === 3 && (
                  <div className="space-y-3.5 h-full flex flex-col justify-between">
                    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-2xs">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-purple-950">Assistente Mayra AI</p>
                          <p className="text-xs text-gray-700 bg-purple-50 p-3 rounded-xl rounded-tl-none border border-purple-100">
                            Olá! O faturamento da Loja 02 nas últimas 4 horas foi de <strong>R$ 14.850,00</strong> (+12% comparado a ontem). O setor mais rentável foi a padaria.
                          </p>
                        </div>
                      </div>

                      {/* Voice Waveform Mockup */}
                      <div className="p-3 bg-gray-900 text-white rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                            <Mic className="w-4 h-4" />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-1 h-3 bg-purple-400 rounded-full animate-bounce" />
                            <span className="w-1 h-5 bg-purple-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                            <span className="w-1 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <span className="w-1 h-6 bg-purple-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                            <span className="w-1 h-3 bg-purple-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                          </div>
                        </div>
                        <span className="text-[11px] font-medium text-purple-300">Ouvindo comando por voz...</span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
