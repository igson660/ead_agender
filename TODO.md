# Entregas — Studio IEPTEC

- [x] **Agenda pública e experiência de consulta:** página inicial com o título “Studio IEPTEC — Sistema de Agendamento”, mensagem institucional, agenda visual diária e semanal, horários ocupados diferenciados, identificação resumida sem dados pessoais, próximos horários, botão “+ Novo agendamento” e layout responsivo para computador, tablet e celular.

- [x] **Solicitação e feedback de agendamento:** formulário completo para solicitante e utilização, validação compartilhada, consulta de disponibilidade, indicação de blocos de 15 minutos, bloqueio visual, mensagens de sucesso/conflito/intervalo e atualização da disponibilidade após solicitação válida.

- [x] **Regras de agenda confiáveis:** regras de horário final, passado, sobreposição, intervalo mínimo de 15 minutos, pendência bloqueante, liberação por rejeição/cancelamento e fuso America/Rio_Branco centralizadas no servidor e cobertas por sete testes automatizados.

- [x] **Antecedência e dias permitidos:** novos agendamentos exigem no mínimo 48 horas de antecedência; horários anteriores ao limite ficam travados no formulário; sábados e domingos são bloqueados na validação do servidor, no seletor de data e nos blocos de horário.

- [ ] **Persistência, transações e histórico:** schema PostgreSQL, migration, exclusion constraint GiST, transações, auditoria e mapeamento de conflitos foram implementados. A execução da migration e o teste de concorrência contra banco real dependem de uma `DATABASE_URL` PostgreSQL; o ambiente atual fornece MySQL e é corretamente recusado para não enfraquecer a garantia concorrente.

- [x] **Administração protegida:** `/admin` e `/admin/login` protegidos por sessão assinada, indicadores, filtros por período/status/solicitante/setor/finalidade, detalhes completos, histórico e ações de aprovar, rejeitar e cancelar.

- [x] **Segredos e ações administrativas:** código administrativo somente no backend via `ADMIN_APPROVAL_CODE`, sessão por `AUTH_SECRET`, confirmação de código nas decisões, cookies `httpOnly`, origem confiável para operações administrativas e limitação de tentativas por instância.

- [x] **Qualidade de interface, acessibilidade e segurança:** identidade IEPTEC responsiva, contraste, teclado, labels, foco, mensagens de erro, `aria` relevante, Zod, sanitização, consultas parametrizadas e tratamento de erro.

- [x] **Operação e documentação:** Next.js App Router, TypeScript, Tailwind, Yarn, componentes reutilizáveis, `.env.example`, README completo, testes, manifesto de rotas, logo de projeto e preparação de deploy Vercel.
