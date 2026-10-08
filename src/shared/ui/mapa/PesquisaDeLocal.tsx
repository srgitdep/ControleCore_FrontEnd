import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, MapPin, Search } from 'lucide-react';
import { idiomaActivo } from '@/i18n';
import { pesquisarLocais } from '@/shared/utils/nomeDoLocal';
import type { ResultadoDePesquisa } from '@/shared/utils/nomeDoLocal';
import type { PontoNoMapa } from './MapaEntrega';

/**
 * Procurar o local pelo nome — «Bairro Central, Maputo» — e pôr o pino lá. É a saída quando o GPS não
 * ajuda (um computador sem GPS dá posições a quilómetros de distância) e a forma mais natural de
 * escolher um sítio em Moçambique, onde muitas ruas não têm número.
 *
 * Só pesquisa quando a pessoa pede (Enter ou botão): a política do Nominatim é de 1 pedido por
 * segundo, e pesquisar a cada tecla passava disso. Procura só em Moçambique.
 */
export function PesquisaDeLocal({ aoEscolher }: { aoEscolher: (ponto: PontoNoMapa) => void }) {
  const { t } = useTranslation('shell');
  const [consulta, setConsulta] = useState('');
  const [resultados, setResultados] = useState<ResultadoDePesquisa[] | null>(null);
  const [aPesquisar, setAPesquisar] = useState(false);
  const [falhou, setFalhou] = useState(false);

  const pesquisar = async () => {
    const texto = consulta.trim();
    if (texto.length < 3) return;
    setAPesquisar(true);
    setFalhou(false);
    try {
      setResultados(await pesquisarLocais(texto, idiomaActivo()));
    } catch {
      setResultados(null);
      setFalhou(true);
    } finally {
      setAPesquisar(false);
    }
  };

  return (
    <div>
      <label className="block text-xs font-medium text-slate-700">{t('mapa.pesquisar_titulo')}</label>
      <div className="mt-1 flex gap-2">
        <input
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          onKeyDown={(e) => {
            // Dentro de um formulário, Enter submeteria o formulário todo: aqui só pesquisa.
            if (e.key === 'Enter') {
              e.preventDefault();
              void pesquisar();
            }
          }}
          placeholder={t('mapa.pesquisar_placeholder')}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => void pesquisar()}
          disabled={aPesquisar || consulta.trim().length < 3}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {aPesquisar ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          {t('mapa.pesquisar')}
        </button>
      </div>

      {falhou && <p className="mt-2 text-xs text-amber-700">{t('mapa.erro_pesquisa')}</p>}
      {resultados && resultados.length === 0 && <p className="mt-2 text-xs text-slate-500">{t('mapa.sem_resultados')}</p>}
      {resultados && resultados.length > 0 && (
        <ul className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {resultados.map((r, i) => (
            <li key={`${r.latitude},${r.longitude},${i}`}>
              <button
                type="button"
                onClick={() => {
                  aoEscolher({ latitude: r.latitude, longitude: r.longitude });
                  setResultados(null);
                }}
                className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-slate-50"
              >
                <MapPin size={14} className="mt-0.5 shrink-0 text-blue-600" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-slate-800">{r.texto}</span>
                  <span className="block truncate text-xs text-slate-400">{r.detalhe}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
