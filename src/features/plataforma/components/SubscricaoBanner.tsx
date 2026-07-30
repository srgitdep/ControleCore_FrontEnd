import { AlertTriangle, Info } from 'lucide-react';
import { useEstadoSubscricao } from '../hooks/usePlataforma';

const ESTADOS_COM_AVISO = new Set([
  'EM_ATRASO',
  'EM_RENOVACAO',
  'EXPIRADA',
  'SUSPENSA',
  'CANCELADA',
]);

export function SubscricaoBanner() {
  const { data } = useEstadoSubscricao();

  if (!data?.estado || !ESTADOS_COM_AVISO.has(data.estado)) return null;

  const bloqueada = data.escritaPermitida === false;
  const Icon = bloqueada ? AlertTriangle : Info;

  return (
    <div
      className={[
        'flex items-start gap-3 border-b px-4 py-3 text-sm sm:px-6',
        bloqueada
          ? 'border-amber-200 bg-amber-50 text-amber-900'
          : 'border-blue-200 bg-blue-50 text-blue-900',
      ].join(' ')}
      role="status"
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        <strong>Subscrição {data.estado.toLowerCase().replaceAll('_', ' ')}.</strong>{' '}
        {bloqueada
          ? 'A consulta e exportação mantêm-se disponíveis, mas novas alterações estão bloqueadas.'
          : 'O serviço continua disponível durante este período.'}
      </p>
    </div>
  );
}
