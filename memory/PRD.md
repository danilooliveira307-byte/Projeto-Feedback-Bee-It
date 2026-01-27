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

## Status do Sistema: ✅ COMPLETO E FUNCIONAL

### Últimas Correções (27/01/2026)
- ✅ **Bug Dropdowns**: Corrigido posicionamento dos dropdowns na página de Feedbacks
- ✅ **Bug Mensagem de Erro Login**: Mensagem de login inválido agora aparece corretamente
- ✅ **Bug CRÍTICO removeChild**: Resolvido erro persistente de runtime do React 18 + Radix UI
  - Causa: Bug conhecido do Radix Primitives (issue #3795) com Portals no React 18
  - Solução: Removido StrictMode, eliminado React Fragments dentro de componentes Radix, adicionado keys estáveis
- ✅ **Sistema de Toast**: Migrado para Sonner (biblioteca recomendada pelo Shadcn/UI)
- ✅ **Downgrade Radix UI**: Versões estáveis compatíveis com React 18
- ✅ **Restrição Colaborador**: Colaboradores não podem excluir itens de planos de ação (apenas adicionar)
- ✅ **Notificações por E-mail**: Integração com SendGrid implementada
  - Novo feedback criado → notifica colaborador
  - Feedback atrasado → notifica gestor
  - Prazo de plano de ação próximo → notifica responsável

### Features Implementadas

#### Visual & Design
- ✅ Tema dark mode corporativo baseado em beeitpartner.com.br
- ✅ Logo oficial Bee It integrado (Login + Header)
- ✅ Paleta: Navy (#0F172A), Orange (#F59E0B), Slate tones
- ✅ Glassmorphism cards com backdrop-blur
- ✅ Tipografia Manrope
- ✅ Status badges coloridos (verde, azul, vermelho, amarelo)
- ✅ Animações suaves
- ✅ Design responsivo em todas as páginas

#### Backend (FastAPI + MongoDB)
- ✅ Autenticação JWT completa
- ✅ Endpoints para todas as entidades
- ✅ Dashboards específicos por papel
- ✅ Perfil de colaborador com timeline
- ✅ Seed de dados de demonstração
- ✅ Cálculo automático de status

#### Frontend (React + Shadcn/UI)
- ✅ Login split-screen com branding
- ✅ Dashboard Admin (10 usuários, 8 times, 20 feedbacks, 12 planos)
- ✅ Dashboard Gestor (alertas, feedbacks recentes)
- ✅ Dashboard Colaborador (feedbacks, ciência)
- ✅ Gestão de Feedbacks (listagem, criação, edição, filtros)
- ✅ Detalhe do Feedback (conteúdo, pontos fortes/melhoria)
- ✅ Planos de Ação (listagem, checklist, check-ins)
- ✅ Perfil do Colaborador (timeline, pontos recorrentes)
- ✅ Gestão de Usuários (CRUD)
- ✅ Gestão de Times (CRUD)
- ✅ Sistema de notificações
- ✅ Toasts com tema dark

### Credenciais de Demonstração
- **Admin**: danilo.oliveira@beeitpartner.com.br / admin123
- **Gestor**: milcio.gutierrez@beeitpartner.com.br / gestor123
- **Colaborador**: cristopher.pinho@beeitpartner.com.br / colaborador123

## Backlog Priorizado

### P0 (Crítico) - ✅ CONCLUÍDO
Todas as funcionalidades core estão implementadas e testadas.
Todos os bugs conhecidos foram corrigidos.

### P1 (Alta Prioridade) - Próximos passos
- [ ] Notificações por email (SendGrid/Resend)
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
```
/app/
├── backend/
│   ├── server.py         # FastAPI - todas as rotas e modelos
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/        # 10 páginas principais
│   │   ├── components/   # Layout, Shadcn/UI
│   │   ├── contexts/     # AuthContext
│   │   ├── hooks/        # use-toast
│   │   └── lib/          # api.js, utils.js
│   └── package.json
└── memory/
    └── PRD.md
```

## Design System
- **Logo**: https://customer-assets.emergentagent.com/job_beeitfeedback/artifacts/i4773jcn_Logo%20BEE%20IT%20Original.png
- **Tema**: Dark Mode Corporate
- **Primary**: #F59E0B (Orange)
- **Background**: #0F172A (Navy)
- **Typography**: Manrope
