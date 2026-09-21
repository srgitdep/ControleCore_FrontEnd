# Guia de implementação e entrega

Só relevante depois do plano da Fase 4 estar gravado e o utilizador pedir para avançar com o código. Se ele ainda não pediu, não implementes — o valor da skill está em ele poder ler e corrigir o plano antes de existir código para deitar fora.

## Enquanto implementas

- **Segue os padrões do projecto, não os teus.** Mesmo naming, mesma estrutura de pastas, mesmo estilo de erros, mesmo idioma nos identificadores e mensagens que a feature análoga que identificaste na Fase 0.
- **Reutiliza antes de criar.** Procura helpers, componentes, hooks, serviços e utilitários já existentes em `src/shared/`. Duplicação é defeito, não velocidade.
- **Contrato coerente entre frontend e backend**: os tipos do cliente têm de corresponder exactamente ao que a API devolve. Divergência aqui é um bug que só aparece em runtime, e normalmente em produção.
- **Trata a realidade, não o caminho feliz**: validação de entradas, erros de rede, permissões insuficientes, listas vazias, concorrência, valores nulos.
- **Segurança por omissão**: valida sempre no servidor (nunca confies só no cliente), autoriza cada endpoint, não exponhas nas respostas mais dados do que o ecrã precisa, cuidado com injecção e com segredos em código.
- **Não faças refactors não pedidos.** Se encontrares um problema fora de âmbito, reporta-o em vez de o corrigires por iniciativa própria — um plano aprovado que cresce em silêncio deixa de ser revisível.
- **Testes** ao nível do que o projecto já pratica: cobre as regras de negócio e os casos limite que identificaste na análise, não só o trivial.
- **Implementa o âmbito todo.** Se algo ficar por fazer, diz explicitamente o quê e porquê — não encolhas o âmbito em silêncio.

## Ao entregar

Reporta ao utilizador, de forma curta:

- **O que foi feito** — resumo por camada.
- **Ficheiros criados e alterados** — uma linha a explicar cada um.
- **Desvios ao plano** — o que saiu diferente do documento e porquê. Actualiza o documento em `Docs/` para reflectir o que foi realmente construído, incluindo o campo `Estado`.
- **Assunções confirmadas ou invalidadas** durante a implementação.
- **Como verificar** — passos concretos para o utilizador testar manualmente, mais os comandos de teste/build a correr.
- **Por fazer / limitações conhecidas**, se existir.
- **Notas de deploy** — migrações a correr, variáveis de ambiente novas, ordem de deploy entre backend e frontend.

Reporta com honestidade: se um teste falha, mostra a falha; se um passo foi saltado, diz que foi.
