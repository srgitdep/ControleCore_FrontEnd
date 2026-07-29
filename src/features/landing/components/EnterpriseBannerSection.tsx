import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, FileCheck, Award, Store } from 'lucide-react';
import { LANDING_COPYWRITING } from '../constants/landingCopywriting';
import { fadeInUp } from '../constants/landingAnimations';

export function EnterpriseBannerSection() {
  const navigate = useNavigate();
  const copy = LANDING_COPYWRITING.enterpriseBanner;

  return (
    <section className="py-16 md:py-24 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header with Security Badges (Matching Image 4 Top) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-12 gap-8">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
              {copy.eyebrow}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl heading-title text-gray-950 max-w-xl font-extrabold tracking-tight">
              {copy.title}
            </h2>
            <p className="text-sm sm:text-base text-gray-500 mt-2 max-w-lg font-normal">
              {copy.subtitle}
            </p>
          </div>

          {/* Compliance Badges Row (Matching Image 4 icons) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-gray-50 border border-gray-200/80">
              <ShieldCheck className="w-5 h-5 text-gray-700" />
              <div>
                <div className="text-xs font-extrabold text-gray-900">LGPD / GDPR</div>
                <div className="text-[10px] font-bold text-emerald-600">CONFORME</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-gray-50 border border-gray-200/80">
              <FileCheck className="w-5 h-5 text-gray-700" />
              <div>
                <div className="text-xs font-extrabold text-gray-900">ISO 27001</div>
                <div className="text-[10px] font-bold text-emerald-600">CERTIFICADO</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-gray-50 border border-gray-200/80">
              <Award className="w-5 h-5 text-gray-700" />
              <div>
                <div className="text-xs font-extrabold text-gray-900">SOC 2 TYPE II</div>
                <div className="text-[10px] font-bold text-emerald-600">AUDITADO</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-gray-50 border border-gray-200/80">
              <Lock className="w-5 h-5 text-gray-700" />
              <div>
                <div className="text-xs font-extrabold text-gray-900">256-BIT SSL</div>
                <div className="text-[10px] font-bold text-emerald-600">CRIPTOGRAFIA</div>
              </div>
            </div>
          </div>
        </div>

        {/* Large Rounded Immersive Banner (Matching Image 4 Bottom) */}
        <motion.div
          className="relative rounded-3xl sm:rounded-[36px] overflow-hidden shadow-2xl min-h-[380px] sm:min-h-[460px] flex items-center justify-center p-8 sm:p-14 text-center text-white"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={fadeInUp}
        >
          {/* Background Image with Dark Overlay */}
          <img
            src={copy.backgroundImage}
            alt="ControlCore Enterprise Security"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/70 to-black/80 backdrop-blur-xs" />

          {/* Centered Content */}
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            
            {/* Centered Logo Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
              <Store className="w-4 h-4 text-white" />
              <span className="text-xs font-bold tracking-wide">ControlCore Supermercados</span>
            </div>

            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tighter leading-tight text-white">
              {copy.bannerTitle}
            </h3>

            {/* Action Buttons (White Primary Pill + Translucent Glass Secondary Pill) */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto bg-white hover:bg-gray-100 text-black px-8 py-3.5 rounded-full font-bold text-sm sm:text-base shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                {copy.ctaPrimary}
              </button>

              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-md px-8 py-3.5 rounded-full font-bold text-sm sm:text-base transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                {copy.ctaSecondary}
              </button>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
