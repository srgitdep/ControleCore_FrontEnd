export interface Empresa {
  id: string;
  nome: string;
  nuit: string;
  telefone?: string;
  email: string;
  endereco?: string;
  cidade?: string;
  pais: string;
  moeda: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Payload para CRIAR uma empresa (fluxo completo de onboarding)
export interface OnboardingPayload {
  // Dados da Empresa
  empresaNome: string;
  empresaNuit: string;
  empresaEmail: string;
  empresaTelefone: string;
  // Dados do Gestor Principal
  gestorNome: string;
  gestorEmail: string;
  // Módulos subscritos (IDs)
  modulos: string[];
}

// Payload para ATUALIZAR uma empresa existente
export type UpdateEmpresaPayload = Partial<Omit<Empresa, 'id' | 'createdAt' | 'updatedAt'>>;

// Mantido para compatibilidade
export type CreateEmpresaPayload = OnboardingPayload;

export interface EmpresaDetails extends Empresa {
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  }>;
  assinaturas: Array<{
    id: string;
    estado: string;
    valorTotal: number;
    ciclo: string;
    dataInicio: string;
    dataFim: string;
    modulos: Array<{
      modulo: {
        id: string;
        nome: string;
        codigo: string;
      }
    }>;
  }>;
  lojas: Array<{
    id: string;
    nome: string;
    endereco: string;
    cidade: string;
    isActive: boolean;
  }>;
}
