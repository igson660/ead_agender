# Studio IEPTEC — Sistema de Agendamento

Aplicação web para consulta e solicitação de uso do Studio IEPTEC. Usuários consultam uma agenda diária ou semanal, escolhem um horário e enviam uma solicitação. O período fica reservado imediatamente como **Aguardando aprovação**; a administração analisa, aprova, rejeita ou cancela com histórico auditável.

## Tecnologias

| Camada | Tecnologia |
| --- | --- |
| Aplicação | Next.js 15, App Router e React 19 |
| Linguagem | TypeScript com validação Zod compartilhada |
| Interface | Tailwind CSS, Lucide Icons e componentes acessíveis |
| Dados | PostgreSQL serverless via `postgres` e schema Drizzle |
| Operação | Yarn, variáveis de ambiente e deploy Vercel |

A interface usa azul institucional profundo com acento dourado inspirado nos materiais públicos do IEPTEC/EAD. O campo **Setor / unidade** oferece `EAD` como opção identificável, além de permitir informar outros setores.

## Pré-requisitos

- Node.js 20.9 ou superior (Node 22 recomendado)
- Corepack habilitado (`corepack enable`)
- Uma instância **PostgreSQL serverless** acessível por URL (Neon, Vercel Postgres ou Supabase)

> O projeto usa recursos nativos de PostgreSQL (`tstzrange`, GiST e exclusion constraint) para impedir conflitos sob concorrência. Portanto, a `DATABASE_URL` precisa apontar para PostgreSQL — e não para MySQL.

## Instalação local

```bash
corepack enable
yarn install
cp .env.example .env.local
```

Preencha o arquivo `.env.local` com os valores reais e nunca faça commit dele.

```env
DATABASE_URL=postgresql://...
ADMIN_APPROVAL_CODE=defina-um-codigo-administrativo-forte
AUTH_SECRET=use-uma-string-aleatoria-com-pelo-menos-32-caracteres
```

Aplique a migração e inicie o servidor:

```bash
yarn migrate
yarn dev
```

Acesse `http://localhost:3000`.

## Comandos

| Comando | Finalidade |
| --- | --- |
| `yarn dev` | inicia o ambiente de desenvolvimento |
| `yarn build` | gera e valida o build de produção |
| `yarn start` | inicia o build de produção |
| `yarn lint` | executa o linter |
| `yarn test` | executa testes das regras de agenda |
| `yarn migrate` | aplica `db/migrations/0001_initial.sql` |

## Banco de dados e concorrência

A migração cria `appointments` e `appointment_history`.

- `appointments` armazena solicitante, setor, contatos, início/fim, finalidade, observações, status, datas e responsável pela aprovação.
- `appointment_history` registra criação, aprovação, rejeição e cancelamento com ator, horário e observação.
- Solicitações `PENDING` e eventos `APPROVED` são bloqueantes.
- Eventos `REJECTED` e `CANCELLED` não bloqueiam novos horários.

### Proteção definitiva contra conflito

A coluna PostgreSQL `reservation_window` representa `[início, fim + 15 minutos)`. Ela é preenchida por um trigger `BEFORE INSERT/UPDATE`, porque a soma de intervalos em `timestamptz` não é uma expressão imutável aceita por colunas geradas do PostgreSQL. A tabela possui uma **exclusion constraint GiST** que não permite interseção dessa faixa para o recurso `studio-ieptec` quando o status é pendente ou aprovado.

Como a constraint faz parte da mesma inserção/transação, duas requisições praticamente simultâneas para a mesma janela não podem ser aceitas. Uma delas receberá conflito do banco, mesmo que ambas tenham passado por validação visual no navegador.

## Regras de agendamento

1. O horário final deve ser posterior ao inicial.
2. Não é possível solicitar horário no passado.
3. Sobreposições são bloqueadas.
4. Há intervalo obrigatório de **15 minutos** após cada utilização, inclusive antes do próximo evento.
5. Solicitações aguardando aprovação já bloqueiam o período.
6. Rejeição e cancelamento liberam o período.
7. A aprovação é uma atualização transacional e mantém a constraint de conflito.
8. Datas e horários são tratados no fuso **America/Rio_Branco**.

## Administração e segurança

- `/admin/login`: entrada administrativa por código validado exclusivamente no backend.
- `/admin`: indicadores, filtros, agenda, detalhes e histórico.
- `/admin/agendamentos`: rota administrativa equivalente para a lista completa.
- O código é comparado em tempo constante no servidor; ele nunca é enviado ao JavaScript do navegador.
- `AUTH_SECRET` assina a sessão `httpOnly`; em Preview HTTPS a sessão usa `SameSite=None; Secure`.
- Login e decisões administrativas têm limitação de tentativas por IP/instância.
- Os schemas Zod validam cliente e servidor; a API normaliza campos textuais e usa parâmetros SQL preparados.

Para instalações de grande escala, substitua o limitador de memória por um armazenamento compartilhado (por exemplo, Vercel KV/Upstash) mantendo a mesma interface de `lib/rate-limit.ts`.

## Deploy na Vercel

1. Crie um projeto PostgreSQL serverless (Neon, Vercel Postgres ou Supabase) e copie a string de conexão.
2. Importe este repositório na Vercel.
3. Em **Settings → Environment Variables**, cadastre `DATABASE_URL`, `ADMIN_APPROVAL_CODE` e `AUTH_SECRET` para Production, Preview e Development.
4. Execute `yarn migrate` uma única vez contra a instância selecionada (localmente com a mesma `DATABASE_URL` ou em pipeline seguro).
5. O build Vercel usa `yarn build`; o App Router disponibiliza as rotas de página e API automaticamente.

Nenhuma variável sensível deve começar com `NEXT_PUBLIC_`.

## Estrutura relevante

```text
app/                         páginas App Router e APIs
components/                  calendário, formulário, cards e painel admin
lib/scheduling.ts            fuso e regras de 15 minutos/conflito
lib/repository.ts            operações PostgreSQL transacionais
db/migrations/               DDL e constraint de concorrência
db/schema.ts                 mapa tipado do schema
lib/auth.ts                  sessão e validação administrativa no servidor
tests/                       testes de regras de negócio
```

## Acessibilidade e responsividade

A interface tem labels explícitos, estados de foco, mensagens de erro, contraste de status e controles dimensionados para toque. No celular, cartões e agenda se reorganizam para leitura vertical; no desktop, a agenda semanal e o painel exibem mais contexto.
