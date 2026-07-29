import { Link, useNavigate } from 'react-router-dom';
import { Store, LogIn, ArrowRight } from 'lucide-react';
import { Button } from '@/shared/ui';

export function LandingHeader() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Store className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight text-gray-900 leading-tight">
              Control<span className="text-blue-600">Core</span>
            </span>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest -mt-0.5">
              Supermercados
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <a href="#funcionalidades" className="hover:text-blue-600 transition-colors">
            Funcionalidades
          </a>
          <a href="#solucoes" className="hover:text-blue-600 transition-colors">
            Soluções
          </a>
          <a href="#depoimentos" className="hover:text-blue-600 transition-colors">
            Casos de Sucesso
          </a>
          <a href="#precos" className="hover:text-blue-600 transition-colors">
            Planos
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate('/login')}
            className="font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50/60 transition-colors gap-1.5 cursor-pointer"
          >
            <LogIn className="w-4 h-4 text-blue-600" />
            Entrar
          </Button>

          <Button
            onClick={() => navigate('/login')}
            className="font-semibold shadow-md shadow-blue-500/15 gap-1.5 cursor-pointer"
          >
            Agendar Demonstração
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
