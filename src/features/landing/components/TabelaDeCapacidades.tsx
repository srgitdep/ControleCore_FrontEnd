import { Check, Minus } from 'lucide-react';
import type { Capacidade, Escalao } from '../precos.dados';

/**
 * Tabela de capacidades por escalão (Loja/Rede/Enterprise).
 *
 * Partilhada entre os módulos da página de preços — evita duplicar a mesma
 * tabela sete vezes.
 */
export function TabelaDeCapacidades({ capacidades }: { capacidades: Capacidade[] }) {
  const colunas: { chave: Escalao; nome: string; campo: keyof Capacidade }[] = [
    { chave: 'loja', nome: 'Loja', campo: 'loja' },
    { chave: 'rede', nome: 'Rede', campo: 'rede' },
    { chave: 'enterprise', nome: 'Enterprise', campo: 'enterprise' },
  ];

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', minWidth: 520, borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--linha)' }}>
            <th
              scope="col"
              style={{ padding: '8px 0', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--tinta-tenue)' }}
            >
              Capacidade
            </th>
            {colunas.map((c) => (
              <th
                key={c.chave}
                scope="col"
                style={{ width: 100, padding: '8px 0', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--tinta-tenue)', textAlign: 'center' }}
              >
                {c.nome}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {capacidades.map((cap, i) => (
            <tr
              key={cap.nome}
              style={{ borderBottom: i === capacidades.length - 1 ? 'none' : '1px solid var(--fundo-alt)' }}
            >
              <td style={{ padding: '10px 14px 10px 0', fontSize: 13.5, color: 'var(--tinta-suave)' }}>
                {cap.nome}
                {cap.chave && (
                  <span style={{ marginLeft: 8, verticalAlign: 'middle', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--tinta-tenue)' }}>
                    decide
                  </span>
                )}
              </td>
              {colunas.map((c) => (
                <td key={c.chave} style={{ padding: '10px 0', textAlign: 'center' }}>
                  {cap[c.campo] ? (
                    <Check size={16} strokeWidth={2.5} style={{ margin: '0 auto', color: '#059669' }} aria-label="incluído" />
                  ) : (
                    <Minus size={14} style={{ margin: '0 auto', color: 'var(--tinta-tenue)' }} aria-label="não incluído" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TituloDeSeccao({ texto, subtexto }: { texto: string; subtexto?: string }) {
  return (
    <div style={{ maxWidth: '42ch' }}>
      <h2 className="cc-titulo">{texto}</h2>
      {subtexto && <p className="cc-subtitulo">{subtexto}</p>}
    </div>
  );
}
