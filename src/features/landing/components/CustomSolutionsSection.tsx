import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ArrowRight, ShoppingBag, PackageCheck, Truck } from 'lucide-react';
import { LANDING_COPYWRITING } from '../constants/landingCopywriting';
import { fadeInUp, staggerContainer } from '../constants/landingAnimations';

export function CustomSolutionsSection() {
  const navigate = useNavigate();
  const copy = LANDING_COPYWRITING.customSolutions;
  const card1 = copy.cards[0];
  const card2 = copy.cards[1];

  return (
    <section id="solucoes" className="py-16 md:py-24 bg-white border-t border-gray-100">
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
            {copy.ctaLearnMore}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 2 Side-by-Side Large Rounded Cards Grid (Matching Image 3) */}
        {card1 && card2 && (
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
          >
            {/* Card 1: Time to ditch spreadsheets */}
            <motion.div
              variants={fadeInUp}
              className="bg-gray-50/90 border border-gray-200/80 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:shadow-lg transition-all"
            >
              <div className="mb-6">
                <h3 className="text-xl sm:text-2xl font-extrabold text-gray-950 tracking-tight mb-3">
                  {card1.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed font-normal">
                  {card1.description}
                </p>
              </div>

              {/* Preview Image with Request Widget Card Overlay */}
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-md bg-white aspect-[16/10]">
                <img
                  src={card1.image}
                  alt="Catalogo de Produtos ControlCore"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/10" />

                {/* Floating Request Card (Matching Image 3 left card) */}
                {card1.requestWidget && (
                  <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-xl border border-gray-100 max-w-xs sm:max-w-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {card1.requestWidget.badge}
                      </span>
                      <span className="text-[11px] font-bold text-gray-400">
                        {card1.requestWidget.account}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-gray-900 mb-2">
                      {card1.requestWidget.title}
                    </h4>
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                      <span>Prioridade: <strong className="text-red-600">{card1.requestWidget.priority}</strong></span>
                      <button 
                        onClick={() => navigate('/login')}
                        className="bg-black hover:bg-gray-800 text-white px-3 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        {card1.requestWidget.btnApprove}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Card 2: Software that sees the world the way you do */}
            <motion.div
              variants={fadeInUp}
              className="bg-gray-50/90 border border-gray-200/80 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:shadow-lg transition-all"
            >
              <div className="mb-6">
                <h3 className="text-xl sm:text-2xl font-extrabold text-gray-950 tracking-tight mb-3">
                  {card2.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed font-normal">
                  {card2.description}
                </p>
              </div>

              {/* Preview Container with Floating Status Pills Grid (Matching Image 3 right card) */}
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-md bg-white p-6 aspect-[16/10] flex flex-col justify-center items-center bg-radial from-gray-50 to-white">
                <img
                  src={card2.image}
                  alt="CRM ControlCore"
                  className="w-full h-full object-cover rounded-xl shadow-xs opacity-90"
                />

                {/* Status Pills Overlay Grid (Matching Image 3) */}
                {card2.statsPills && card2.statsPills.length >= 3 && (
                  <div className="absolute inset-0 bg-white/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-md">
                      <div className="bg-white p-3.5 rounded-xl shadow-lg border border-gray-100 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 font-bold">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-900">{card2.statsPills[0].count}</div>
                          <div className="text-[10px] font-semibold text-gray-400">{card2.statsPills[0].label}</div>
                        </div>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl shadow-lg border border-gray-100 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-50 text-orange-600 font-bold">
                          <PackageCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-900">{card2.statsPills[1].count}</div>
                          <div className="text-[10px] font-semibold text-gray-400">{card2.statsPills[1].label}</div>
                        </div>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl shadow-lg border border-gray-100 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 font-bold">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-900">{card2.statsPills[2].count}</div>
                          <div className="text-[10px] font-semibold text-gray-400">{card2.statsPills[2].label}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

          </motion.div>
        )}
      </div>
    </section>
  );
}
