import { X, User, Shield, Building2, CheckCircle2, Ban, Hash } from 'lucide-react';
import type { UserDetail } from '@/features/users';
import { ROLE_LABELS } from '@/features/auth';

interface UserDetailsModalProps {
  user: UserDetail;
  onClose: () => void;
}

export function UserDetailsModal({ user, onClose }: UserDetailsModalProps) {
  // Se tivéssemos createdAt vindo da API para os users:
  // const formatDate = (dateString: string) => { ... };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <User size={20} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">Detalhes do Utilizador</h2>
              <p className="text-xs text-slate-500">Perfil e acessos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Status Badge */}
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">{user.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                user.isActive
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-100 text-rose-700 border border-rose-200'
              }`}
            >
              {user.isActive ? <CheckCircle2 size={14} /> : <Ban size={14} />}
              {user.isActive ? 'Acesso Ativo' : 'Acesso Suspenso'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informações Base */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Identificação</h4>
              
              <div className="flex items-start gap-3">
                <Hash size={16} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Código de Acesso</p>
                  <p className="text-sm font-mono font-medium text-slate-800">{user.code}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Shield size={16} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">NÍvel de Acesso (Role)</p>
                  <p className="text-sm font-medium text-slate-800">{ROLE_LABELS[user.role]}</p>
                </div>
              </div>
            </div>

            {/* VÍnculos */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">VÍnculos Institucionais</h4>
              
              <div className="flex items-start gap-3">
                <Building2 size={16} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Empresa Associada</p>
                  <p className="text-sm font-medium text-slate-800">
                    {user.empresa?.nome || <span className="italic text-slate-400">Plataforma Global (SRG)</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
}
