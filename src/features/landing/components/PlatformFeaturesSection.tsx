import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  ShoppingCart, 
  Package, 
  Users, 
  ShieldCheck, 
  ArrowUpRight,
  Sparkles,
  CheckCircle
} from 'lucide-react';
import { LANDING_COPYWRITING } from '../constants/landingCopywriting';
import { scaleIn } from '../constants/landingAnimations';

const ICON_MAP = {
  BarChart3,
  ShoppingCart,
  Package,
  Users,
  ShieldCheck,
};

export function PlatformFeaturesSection() {
  const [activeTabId, setActiveTabId] = useState('workspace');
  const navigate = useNavigate();
  const copy = LANDING_COPYWRITING.platformFeatures;
  const currentTab = copy.tabs.find((t) => t.id === activeTabId) || copy.tabs[0];

  return (
    <section id="recursos" className="py-16 md:py-24 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
              {copy.eyebrow}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl heading-title text-gray-950 max-w-2xl font-extrabold tracking-tight">
              {copy.title}
            </h2>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="self-start md:self-auto bg-black hover:bg-gray-900 text-white px-6 py-3 rounded-full text-sm font-semibold flex items-center gap-2 shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            {copy.ctaExplore}
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* Section Layout (Matching Image 2) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Vertical Interactive Feature List */}
          <div className="lg:col-span-4 space-y-2">
            {copy.tabs.map((tab) => {
              const Icon = ICON_MAP[tab.icon as keyof typeof ICON_MAP] || BarChart3;
              const isActive = tab.id === activeTabId;

              return (
                <div key={tab.id}>
                  <button
                    onClick={() => setActiveTabId(tab.id)}
                    className={`w-full text-left p-4 sm:p-5 rounded-2xl transition-all duration-200 cursor-pointer flex items-start gap-4 ${
                      isActive
                        ? 'bg-gray-100/80 text-gray-950 shadow-xs'
                        : 'hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-xl flex-shrink-0 ${
                        isActive ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1">
                      <div className="font-bold text-base tracking-tight flex items-center justify-between">
                        <span>{tab.title}</span>
                      </div>

                      {isActive && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-xs text-gray-500 mt-2 leading-relaxed"
                        >
                          {tab.description}
                        </motion.p>
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Right Column: Visual Mockup Showcase Canvas (Matching Image 2 Diagram Style) */}
          <div className="lg:col-span-8 bg-gray-50/80 border border-gray-200/80 rounded-3xl p-4 sm:p-8 relative min-h-[420px] sm:min-h-[500px] flex flex-col justify-between overflow-hidden shadow-sm">
            
            {/* Canvas Header Elements */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Visão Interativa do Sistema
              </span>
            </div>

            {/* Dynamic Screen Image Mockup */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTabId}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, scale: 0.98 }}
                variants={scaleIn}
                className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-xl bg-white aspect-[16/10] sm:aspect-[16/9]"
              >
                <img
                  src={currentTab.image}
                  alt={currentTab.title}
                  className="w-full h-full object-cover object-top"
                />

                {/* Floating Interactive Badge (Matching Image 2 Style) */}
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-lg border border-gray-100 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-teal-500 text-white flex items-center justify-center font-bold text-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-gray-800">
                    Módulo Ativo: {currentTab.title}
                  </span>
                </div>

                {/* Floating Quick Action Overlay */}
                <div className="absolute bottom-4 left-4 bg-gray-950/90 text-white px-4 py-2 rounded-xl backdrop-blur-md text-xs font-semibold flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-teal-400" />
                  Dados em tempo real sincronizados
                </div>
              </motion.div>
            </AnimatePresence>

          </div>

        </div>
      </div>
    </section>
  );
}
