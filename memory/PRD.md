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

## O que foi Implementado

### Redesenho Visual Dark Corporativo (27/01/2026)
- ✅ Tema dark mode baseado em beeitpartner.com.br
- ✅ Logo oficial Bee It integrado (Login + Header)
- ✅ Paleta de cores: Navy (#0F172A), Orange (#F59E0B), Slate tones
- ✅ Glassmorphism cards com backdrop-blur
- ✅ Tipografia Manrope
- ✅ Sidebar moderna com hover effects
- ✅ Status badges coloridos (verde, azul, vermelho, amarelo)
- ✅ Animações suaves (fade-in, slide-in, glow)
- ✅ Design responsivo em TODAS as páginas

### Páginas Atualizadas com Tema Dark
- ✅ Login (split-screen com logo)
- ✅ Dashboard (Admin/Gestor/Colaborador)
- ✅ Feedbacks (lista com filtros)
- ✅ FeedbackForm (criação/edição)
- ✅ FeedbackDetail (visualização completa)
- ✅ ActionPlans (lista de planos)
- ✅ ActionPlanDetail (itens e check-ins)
- ✅ CollaboratorProfile (timeline)
- ✅ Users (gestão de usuários)
- ✅ Teams (gestão de times)
- ✅ Layout/Sidebar (navegação)

### Backend (FastAPI + MongoDB)
- ✅ Autenticação JWT completa
- ✅ Endpoints para todas as entidades
- ✅ Dashboards específicos por papel
- ✅ Perfil de colaborador com timeline
- ✅ Seed de dados de demonstração
- ✅ Cálculo automático de status

### Testes Realizados
- ✅ 100% dos testes backend passaram
- ✅ 100% dos testes frontend passaram
- ✅ Todas as funcionalidades verificadas

### Credenciais de Demonstração
- Admin: admin@beeit.com.br / admin123
- Gestor: gestor@beeit.com.br / gestor123
- Colaborador: colaborador@beeit.com.br / colab123

## Backlog Priorizado

### P0 (Crítico) - Concluído ✅
- Autenticação e autorização
- CRUD de todas as entidades
- Dashboards por papel
- Fluxo de feedbacks completo
- Redesenho visual dark corporativo
- Logo oficial integrado

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
- **Logo**: https://customer-assets.emergentagent.com/job_beeitfeedback/artifacts/i4773jcn_Logo%20BEE%20IT%20Original.png
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
