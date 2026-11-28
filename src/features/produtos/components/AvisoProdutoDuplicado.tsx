import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ProdutoDuplicado } from '../api/catalog.api';

/**
 * Aviso de que o produto a criar já parece existir, com o stock que ele tem em cada loja.
 *
 * ## Porquê
 *
 * O mesmo artigo foi criado uma vez por loja — 89 registos em 38 grupos (28/11/2026),
 * com o código de barras alterado no último dígito para passar a unicidade. A loja nova
 * não tinha onde dar entrada ao produto existente. Isso foi corrigido (armazém novo abre
 * as posições); este aviso fecha o hábito: mostra o produto que já existe e onde tem
 * stock, e só deixa criar com confirmação explícita.
 *
 * Reutilizável: recebe a lista e o estado da confirmação, não sabe de formulários.
 */
export function AvisoProdutoDuplicado({
  duplicados,
  confirmado,
  onConfirmar,
}: {
  duplicados: ProdutoDuplicado[];
  confirmado: boolean;
  onConfirmar: (confirmado: boolean) => void;
}) {
  const { t } = useTranslation('produtos');
  if (duplicados.length === 0) return null;

  return (
    <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-900">{t('duplicado.titulo')}</p>
          <p className="text-xs text-amber-800 mt-0.5">{t('duplicado.explicacao')}</p>
        </div>
      </div>

      <ul className="space-y-2">
        {duplicados.map((p) => {
          const comSaldo = p.stocks.filter((s) => s.currentQuantity !== 0);
          // A posição para «ver stock»: a de maior saldo, ou a primeira se todas a zero.
          const posicao = p.stocks[0];
          return (
            <li key={p.id} className="rounded-md bg-white border border-amber-100 px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{p.nome}</p>
                  <p className="text-xs text-slate-500">
                    {p.codigoBarras ?? p.sku ?? '—'} · {t(`duplicado.motivo_${p.motivo}`)}
                  </p>
                </div>
                {posicao && (
                  <Link
                    to={`/stock/${posicao.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    {t('duplicado.ver_stock')} <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
              {comSaldo.length > 0 && (
                <p className="mt-1 text-xs text-slate-600">
                  {comSaldo
                    .map((s) => `${s.loja}: ${t('duplicado.unidades', { n: s.currentQuantity })}`)
                    .join(' · ')}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <label className="flex items-center gap-2 text-sm text-amber-900 cursor-pointer">
        <input
          type="checkbox"
          checked={confirmado}
          onChange={(e) => onConfirmar(e.target.checked)}
          className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
        />
        {t('duplicado.confirmar')}
      </label>
    </div>
  );
}
