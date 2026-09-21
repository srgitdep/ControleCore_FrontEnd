# Template — documento de plano de implementação

Esqueleto do ficheiro a gravar em `Docs/plano_feature_<slug>.md` na Fase 4.

Regras ao preencher:

- Substitui tudo entre `<...>` por conteúdo real. **Nenhum placeholder deve sobrar** no ficheiro final.
- Secções que genuinamente não se aplicam (ex: "Frontend" numa alteração puramente de backend) são removidas, não deixadas vazias com "N/A" — excepto **Assunções** e **Perguntas em aberto**, que ficam sempre, mesmo que seja para escrever "Nenhuma".
- Caminhos de ficheiros, nomes de modelos Prisma, rotas e componentes têm de ser os reais, verificados no código na Fase 0.
- Prefere tabelas e listas a parágrafos longos: este documento é para ser consultado durante a implementação, não lido de uma ponta à outra.

---

```markdown
# Plano de implementação — <Nome da funcionalidade>

- **Data**: <AAAA-MM-DD>
- **Estado**: Rascunho | Aprovado | Em implementação | Concluído
- **Âmbito**: Backend | Frontend | Fullstack
- **Repositórios afectados**: <ControleCore_BackEnd, ControleCore_FrontEnd>

## 1. Objectivo

<O porquê de negócio, em 3-5 linhas. Que problema real isto resolve e para quem.>

## 2. Requisito interpretado

<O que percebeste que tem de ser construído, em 3-6 linhas. Se a tua leitura diverge do literal da descrição original, diz aqui em que ponto e porquê.>

### Actores e permissões

| Actor / perfil | O que pode fazer |
| --- | --- |
| <perfil> | <acções permitidas> |

### Regras de negócio

1. <Regra explícita do requisito.>
2. <Regra implícita que o texto assume mas não diz — marcada como tal.>

### Fora de âmbito

- <O que esta funcionalidade deliberadamente não cobre.>

## 3. Análise técnica

### Impacto no sistema

| Camada | Criar | Alterar |
| --- | --- | --- |
| Dados | <modelos Prisma novos> | <modelos existentes a alterar> |
| Backend | <módulos/endpoints novos> | <módulos/endpoints a alterar> |
| Frontend | <rotas/ecrãs/componentes novos> | <existentes a alterar> |
| Permissões | <novas permissões> | <permissões a ajustar> |

### Decisões de arquitectura

| Decisão | Alternativa descartada | Porquê |
| --- | --- | --- |
| <caminho escolhido> | <alternativa> | <justificação em uma linha> |

### Riscos e pontos sensíveis

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| <migração destrutiva, quebra de contrato, performance, concorrência, segurança, dados existentes, retrocompatibilidade> | Alto / Médio / Baixo | <o que fazer para reduzir> |

## 4. Plano de implementação

Cada passo marcado como **[obrigatório]** (a funcionalidade não funciona sem ele) ou **[opcional]** (melhoria).

### 4.1 Dados

- [ ] **[obrigatório]** <Alteração de `prisma/schema.prisma`: modelo, campos, tipos, relações, índices.>
- [ ] **[obrigatório]** <Migração: nome, se é destrutiva, o que acontece aos dados existentes.>
- [ ] **[opcional]** <Seeds ou dados de arranque.>

### 4.2 Backend

- [ ] **[obrigatório]** <Serviço / regra de negócio a implementar e onde.>
- [ ] **[obrigatório]** <Validação, autenticação e autorização aplicadas.>
- [ ] **[opcional]** <Eventos, jobs agendados, integrações.>

#### Endpoints

| Método | Rota | DTO entrada | Resposta | Erros | Permissão |
| --- | --- | --- | --- | --- | --- |
| <GET/POST/...> | `<rota>` | `<DtoNome>` | `<forma da resposta>` | `<400/403/404/409...>` | `<perfil/permissão>` |

### 4.3 Frontend

- [ ] **[obrigatório]** <Rota e ecrã: caminho, onde se regista no router.>
- [ ] **[obrigatório]** <Componentes: quais são novos e quais são reutilizados de `src/shared/`.>
- [ ] **[obrigatório]** <Camada de API e tipos: onde ficam, alinhados exactamente com a resposta do backend.>
- [ ] **[obrigatório]** <Estado e cache: queries/mutations TanStack Query, chaves de cache, invalidações; estado global Zustand se aplicável.>
- [ ] **[obrigatório]** <Formulários e validação: react-hook-form + schema Zod, mensagens de erro.>
- [ ] **[obrigatório]** <Estados de loading, erro e lista vazia; feedback ao utilizador (toasts).>
- [ ] **[obrigatório]** <Permissões na UI: o que é escondido ou desactivado por perfil.>

### 4.4 Transversal

- [ ] **[obrigatório]** <Testes: que nível, que casos — cobre as regras de negócio e os casos limite identificados, não só o caminho feliz.>
- [ ] **[opcional]** <Logging, auditoria, observabilidade.>
- [ ] **[opcional]** <Configuração e variáveis de ambiente novas.>

## 5. Ficheiros afectados

### ControleCore_BackEnd

| Ficheiro | Acção | Porquê |
| --- | --- | --- |
| `<caminho>` | criar / alterar | <uma linha> |

### ControleCore_FrontEnd

| Ficheiro | Acção | Porquê |
| --- | --- | --- |
| `<caminho>` | criar / alterar | <uma linha> |

## 6. Assunções

Decisões tomadas sobre pontos ambíguos não bloqueantes. Se alguma estiver errada, corrigir antes de implementar.

1. <Assunção e comportamento assumido.>

## 7. Perguntas em aberto

Pontos bloqueantes que precisam de resposta antes de avançar.

1. <Pergunta concreta, com o impacto de cada resposta possível.>

## 8. Ordem de execução e verificação

1. <Passo a passo pela ordem real de implementação, ligando as secções 4.1 a 4.4.>

**Como verificar no fim**: <passos manuais concretos para testar a funcionalidade, mais os comandos de teste/build a correr em cada repositório.>

**Notas de deploy**: <migrações a correr, variáveis de ambiente novas, ordem de deploy entre backend e frontend, se aplicável.>
```
