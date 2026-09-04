import { useQuery } from '@tanstack/react-query';
import { Package, PackageX } from 'lucide-react';
import { Card } from '@/shared/ui';
import { modulosApi } from '../api/modulos.api';

const moeda = (valor: number) =>
  Number(valor).toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' });

/**
 * Os módulos que esta empresa subscreve.
 *
 * ## Porque é só de leitura
 *
 * Subscrever ou cancelar um módulo altera a `Assinatura` e o que se paga, e não há no
 * servidor nenhuma rota que o faça — `AssinaturaModulo` só é escrito durante o onboarding.
 * Um botão «subscrever» aqui não teria para onde chamar, e um botão que não funciona é pior
 * do que a sua ausência.
 *
 * Fica dito no ecrã, para quem o usa não concluir que a lista está avariada.
 */
export function MeusModulos() {
  const { data: modulos, isLoading } = useQuery({
    queryKey: ['meus-modulos'],
    queryFn: () => modulosApi.meusModulos(),
  });

  if (isLoading) return <p className="text-sm text-slate-400">A carregar…</p>;

  const total = (modulos ?? []).reduce((soma, m) => soma + Number(m.precoMensal), 0);

  return (
    <div className="space-y-4">
      {(modulos ?? []).length === 0 ? (
        <div className="py-12 text-center">
          <PackageX className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-medium text-slate-700">
            Sem módulos subscritos.
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Ou não há assinatura activa nem em avaliação, ou a assinatura foi criada sem
            módulos. Alterar a subscrição é feito por quem administra a plataforma.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {modulos!.map((m) => (
              <Card key={m.id}>
                <div className="flex items-start gap-3 p-4">
                  <div className="mt-0.5 rounded-lg bg-indigo-50 p-2">
                    <Package className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{m.nome}</p>
                    <p className="font-mono text-[11px] text-slate-400">{m.codigo}</p>
                    {m.descricao && (
                      <p className="mt-1 text-xs text-slate-500">{m.descricao}</p>
                    )}
                    <p className="mt-2 text-sm font-semibold text-slate-700">
                      {moeda(m.precoMensal)}
                      <span className="ml-1 text-xs font-normal text-slate-400">/mês</span>
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <p className="text-right text-sm text-slate-500">
            {modulos!.length} módulo(s) ·{' '}
            <span className="font-semibold text-slate-800">{moeda(total)}</span> por mês
          </p>

          <p className="text-xs text-slate-400">
            Esta lista vem da assinatura em vigor. Para subscrever ou cancelar um módulo, fale
            com quem administra a plataforma — a alteração não se faz por aqui.
          </p>
        </>
      )}
    </div>
  );
}
