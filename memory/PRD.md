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

## O que foi Implementado

### Redesenho Visual Dark Corporativo (27/01/2026)
- ✅ Tema dark mode baseado em beeitpartner.com.br
- ✅ Paleta de cores: Navy (#0F172A), Orange (#F59E0B), Slate tones
- ✅ Glassmorphism cards com backdrop-blur
- ✅ Tipografia Manrope
- ✅ Ícone Hexágono como branding
- ✅ Sidebar moderna com hover effects
- ✅ Status badges coloridos (verde, azul, vermelho, amarelo)
- ✅ Animações suaves (fade-in, slide-in, glow)
- ✅ Design responsivo

### Backend (FastAPI + MongoDB) - 26/01/2026
- ✅ Autenticação JWT completa
- ✅ Endpoints para todas as entidades (Usuarios, Times, Feedbacks, PlanosDeAcao, ItemPlanoDeAcao, CheckIns, Notificacoes)
- ✅ Dashboards específicos por papel (/api/dashboard/admin, /api/dashboard/gestor, /api/dashboard/colaborador)
- ✅ Perfil de colaborador com timeline (/api/collaborator-profile/:id)
- ✅ Seed de dados de demonstração (/api/seed)
- ✅ Cálculo automático de status de feedbacks e planos
- ✅ Sistema de notificações

### Frontend (React + Shadcn/UI) - 26/01/2026
- ✅ Tela de Login split-screen com branding
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
- Redesenho visual dark corporativo

### P1 (Alta Prioridade) - Próximos passos
- [ ] Notificações por email (integração SendGrid/Resend)
- [ ] Exportação de relatórios em PDF
- [ ] Filtros avançados com período de data

### P2 (Média Prioridade)
- [ ] Gráficos e métricas mais detalhadas no dashboard
- [ ] Histórico de alterações (audit log completo)
- [ ] Busca global

### P3 (Baixa Prioridade)
- [ ] Personalização de cores por empresa
- [ ] Integração com calendário (Google Calendar)

## Arquitetura
- **Frontend**: React 19, React Router DOM, Shadcn/UI, TailwindCSS, Axios
- **Backend**: FastAPI, Motor (MongoDB async), PyJWT, Bcrypt
- **Database**: MongoDB
- **Auth**: JWT Bearer tokens

## Design System
- **Tema**: Dark Mode Corporate
- **Background**: #0F172A (Navy), #1E293B (Paper), #020617 (Sidebar)
- **Primary**: #F59E0B (Orange), #D97706 (Orange Hover)
- **Status**: Success (#10B981), Warning (#F59E0B), Error (#EF4444), Info (#3B82F6)
- **Typography**: Manrope (primary), system fonts (fallback)
- **Components**: Glassmorphism cards, rounded-xl borders, shadow-lg

## Próximas Ações
1. Implementar notificações por email para feedbacks pendentes
2. Adicionar exportação de relatórios em PDF
3. Implementar filtros avançados com período de data
