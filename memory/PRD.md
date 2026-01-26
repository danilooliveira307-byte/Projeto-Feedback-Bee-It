# Bee It Feedback - PRD (Product Requirements Document)

## Problema Original
Sistema de gestão de feedbacks corporativo para a empresa Bee It, centralizando todos os feedbacks em um único sistema com:
- Registro estruturado de feedbacks
- Histórico completo por colaborador
- Controle do último e próximo feedback
- Acompanhamento de planos de ação
- Visão gerencial para gestores
- Governança e métricas para RH/Admin
- Alertas automáticos de atrasos e pendências

## User Personas
1. **ADMIN (RH/Gestão)**: Visão completa do sistema, gestão de usuários e times, métricas gerais
2. **GESTOR**: Gerencia feedbacks de sua equipe, cria planos de ação, acompanha desenvolvimento
3. **COLABORADOR**: Visualiza seus feedbacks, confirma ciência, acompanha planos de ação

## Core Requirements (Static)
- Autenticação JWT com controle de permissões por papel
- CRUD completo para Usuários, Times, Feedbacks, Planos de Ação
- Timeline de feedbacks por colaborador
- Sistema de notificações visuais
- Dashboards específicos por papel
- Badges de status: Em dia (verde), Aguardando ciência (azul), Atrasado (vermelho)
- Cálculo automático de próximo feedback baseado na frequência do time
- Progressos percentuais automáticos em planos de ação

## O que foi Implementado (26/01/2026)

### Backend (FastAPI + MongoDB)
- ✅ Autenticação JWT completa
- ✅ Endpoints para todas as entidades (Usuarios, Times, Feedbacks, PlanosDeAcao, ItemPlanoDeAcao, CheckIns, Notificacoes)
- ✅ Dashboards específicos por papel (/api/dashboard/admin, /api/dashboard/gestor, /api/dashboard/colaborador)
- ✅ Perfil de colaborador com timeline (/api/collaborator-profile/:id)
- ✅ Seed de dados de demonstração (/api/seed)
- ✅ Cálculo automático de status de feedbacks e planos
- ✅ Sistema de notificações

### Frontend (React + Shadcn/UI)
- ✅ Tela de Login com identidade visual Bee It (logo, cores, padrão hexagonal)
- ✅ Dashboard Admin (métricas gerais, gráfico de feedbacks por tipo)
- ✅ Dashboard Gestor (alertas, feedbacks atrasados, vencendo, recentes)
- ✅ Dashboard Colaborador (feedbacks recebidos, ciência, planos)
- ✅ Gestão de Feedbacks (listagem, criação, edição, filtros)
- ✅ Detalhe do Feedback (conteúdo, pontos fortes/melhoria, planos vinculados)
- ✅ Planos de Ação (listagem, checklist de itens, check-ins)
- ✅ Perfil do Colaborador (timeline, pontos recorrentes)
- ✅ Gestão de Usuários (CRUD, atribuição de gestor)
- ✅ Gestão de Times (CRUD, frequência de feedback)
- ✅ Sistema de notificações no header
- ✅ Navegação com sidebar responsiva

### Credenciais de Demonstração
- Admin: admin@beeit.com.br / admin123
- Gestor: gestor@beeit.com.br / gestor123
- Colaborador: colaborador@beeit.com.br / colab123

## Backlog Priorizado

### P0 (Crítico) - Já implementado ✅
- Autenticação e autorização
- CRUD de todas as entidades
- Dashboards por papel
- Fluxo de feedbacks completo

### P1 (Alta Prioridade) - Próximos passos
- [ ] Notificações por email (integração SendGrid/Resend)
- [ ] Exportação de relatórios em PDF
- [ ] Filtros avançados com período de data

### P2 (Média Prioridade)
- [ ] Gráficos e métricas mais detalhadas no dashboard
- [ ] Histórico de alterações (audit log completo)
- [ ] Busca global

### P3 (Baixa Prioridade)
- [ ] Modo escuro
- [ ] Personalização de cores por empresa
- [ ] Integração com calendário (Google Calendar)

## Arquitetura
- **Frontend**: React 19, React Router DOM, Shadcn/UI, TailwindCSS, Axios
- **Backend**: FastAPI, Motor (MongoDB async), PyJWT, Bcrypt
- **Database**: MongoDB
- **Auth**: JWT Bearer tokens

## Próximas Ações
1. Adicionar notificações por email para feedbacks pendentes
2. Implementar exportação de relatórios
3. Adicionar mais métricas no dashboard Admin
