import { Link } from 'react-router-dom';
import { Store } from 'lucide-react';
import { LANDING_COPYWRITING } from '../constants/landingCopywriting';

export function LandingFooter() {
  const copy = LANDING_COPYWRITING.footer;

  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-12 text-gray-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-gray-100">
          
          {/* Brand Column */}
          <div className="md:col-span-4 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center text-white font-bold">
                <Store className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-gray-950">
                Control<span className="text-blue-600">Core</span>
              </span>
            </Link>

            <p className="text-xs sm:text-sm text-gray-500 max-w-sm leading-relaxed font-normal">
              {copy.tagline}
            </p>
          </div>

          {/* Links Columns (Matching Image 5) */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {copy.columns.map((col) => (
              <div key={col.title} className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  {col.title}
                </h4>
                <ul className="space-y-2 text-xs sm:text-sm">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-gray-600 hover:text-gray-950 font-medium transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-4">
          <p>{copy.copyright}</p>
          <div className="flex gap-6 font-medium">
            <a href="#" className="hover:text-gray-600">Privacidade</a>
            <a href="#" className="hover:text-gray-600">Termos de Serviço</a>
            <a href="#" className="hover:text-gray-600">Segurança</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
