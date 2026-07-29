import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PackageCheck, Edit3, Share2 } from 'lucide-react';
import { LANDING_COPYWRITING } from '../constants/landingCopywriting';
import { fadeInLeft, fadeInRight, floatingCard } from '../constants/landingAnimations';

export function HeroSection() {
  const navigate = useNavigate();
  const copy = LANDING_COPYWRITING.heroSection;

  return (
    <section className="relative bg-white pt-6 pb-16 md:pt-10 md:pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Typography & CTAs */}
          <motion.div
            className="lg:col-span-6 space-y-6 sm:space-y-8"
            initial="hidden"
            animate="visible"
            variants={fadeInLeft}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl heading-hero text-gray-950 font-extrabold tracking-tighter leading-[1.06]">
              {copy.headline}
            </h1>

            <p className="text-base sm:text-lg text-gray-600 font-normal leading-relaxed max-w-lg">
              {copy.description}
            </p>

            {/* Action Buttons (Black Primary Pill + Light Secondary Pill) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <button
                onClick={() => navigate('/login')}
                className="bg-black hover:bg-gray-900 text-white px-8 py-3.5 rounded-full font-semibold text-sm sm:text-base shadow-lg shadow-black/10 transition-all hover:scale-[1.02] active:scale-95 text-center cursor-pointer"
              >
                {copy.ctaPrimary}
              </button>

              <button
                onClick={() => {
                  document.getElementById('recursos')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-8 py-3.5 rounded-full font-semibold text-sm sm:text-base transition-all hover:scale-[1.02] active:scale-95 text-center cursor-pointer"
              >
                {copy.ctaSecondary}
              </button>
            </div>
          </motion.div>

          {/* Right Column: Hero Image with Floating Widgets (100% Matching Image 1) */}
          <motion.div
            className="lg:col-span-6 relative"
            initial="hidden"
            animate="visible"
            variants={fadeInRight}
          >
            <div className="relative rounded-3xl sm:rounded-[32px] overflow-hidden shadow-2xl border border-gray-100 aspect-[4/3] sm:aspect-[16/11] bg-gray-100">
              <img
                src={copy.heroImage}
                alt="Operações de Supermercado ControlCore"
                className="w-full h-full object-cover"
              />

              {/* Gradient Overlay for Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

              {/* Floating Glass Widget Card (Matching Image 1) */}
              <motion.div
                className="absolute top-8 left-6 sm:top-12 sm:left-8 bg-white/95 backdrop-blur-md p-5 sm:p-6 rounded-2xl shadow-2xl border border-white/60 max-w-[280px] sm:max-w-[320px] text-gray-900"
                initial="initial"
                animate="animate"
                variants={floatingCard}
              >
                <div className="flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  <span>{copy.floatingCard.orderId}</span>
                  <span>{copy.floatingCard.date}</span>
                </div>

                <div className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight mb-4">
                  {copy.floatingCard.amount}
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => navigate('/login')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-full transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    {copy.floatingCard.btnEdit}
                  </button>
                  <button 
                    onClick={() => navigate('/login')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-full transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    {copy.floatingCard.btnShare}
                  </button>
                </div>
              </motion.div>

              {/* Bottom Glass Overlay Badge (Matching Image 1) */}
              <div className="absolute bottom-6 left-6 right-6 sm:bottom-8 sm:left-8 sm:right-8 flex items-center justify-between text-white">
                <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/20">
                  <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold">
                    <PackageCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold tracking-wide truncate">
                    {copy.bottomOverlayText}
                  </span>
                </div>

                {/* Slider / Status Pills */}
                <div className="hidden sm:flex items-center gap-1.5">
                  <div className="w-8 h-1.5 bg-white rounded-full" />
                  <div className="w-4 h-1.5 bg-white/40 rounded-full" />
                  <div className="w-4 h-1.5 bg-white/40 rounded-full" />
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
