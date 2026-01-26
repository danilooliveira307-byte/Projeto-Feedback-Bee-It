import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getGestorDashboard,
  getColaboradorDashboard,
  getAdminDashboard,
  acknowledgeFeedback
} from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  MessageSquare,
  ClipboardList,
  Building2,
  TrendingUp,
  Calendar,
  ChevronRight,
  Plus,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const StatCard = ({ title, value, icon: Icon, color, subtitle, onClick }) => (
  <Card 
    className={`card-hover cursor-pointer ${onClick ? '' : 'cursor-default'}`}
    onClick={onClick}
  >
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color.replace('text-', 'bg-').replace('-600', '-100').replace('-700', '-100')}`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

const FeedbackItem = ({ feedback, onAcknowledge, showAcknowledge = false }) => {
  const navigate = useNavigate();
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Em dia':
        return <Badge className="status-em-dia">Em dia</Badge>;
      case 'Aguardando ciência':
        return <Badge className="status-aguardando">Aguardando ciência</Badge>;
      case 'Atrasado':
        return <Badge className="status-atrasado">Atrasado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateStr) => {
    try {
      return format(parseISO(dateStr), "dd 'de' MMM, yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-[hsl(210,54%,23%)]">
            {feedback.colaborador_nome || feedback.gestor_nome}
          </span>
          {getStatusBadge(feedback.status_feedback)}
        </div>
        <p className="text-sm text-gray-500">
          {feedback.tipo_feedback} • {formatDate(feedback.data_feedback)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {showAcknowledge && !feedback.ciencia_colaborador && (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAcknowledge(feedback.id);
            }}
            className="bg-[hsl(30,94%,54%)] hover:bg-[hsl(30,94%,45%)]"
            data-testid={`acknowledge-btn-${feedback.id}`}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Ciente
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => navigate(`/feedbacks/${feedback.id}`)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// Admin Dashboard
const AdminDashboard = ({ data }) => {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(210,54%,23%)]">Dashboard Admin</h1>
          <p className="text-gray-500">Visão geral do sistema Bee It Feedback</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Usuários"
          value={data.total_usuarios}
          icon={Users}
          color="text-[hsl(210,54%,30%)]"
          subtitle={`${data.total_admins} admins • ${data.total_gestores} gestores • ${data.total_colaboradores} colaboradores`}
          onClick={() => navigate('/usuarios')}
        />
        <StatCard
          title="Times"
          value={data.total_times}
          icon={Building2}
          color="text-purple-600"
          onClick={() => navigate('/times')}
        />
        <StatCard
          title="Total de Feedbacks"
          value={data.total_feedbacks}
          icon={MessageSquare}
          color="text-[hsl(30,94%,54%)]"
          subtitle={`${data.feedbacks_atrasados} atrasados • ${data.feedbacks_aguardando} aguardando`}
          onClick={() => navigate('/feedbacks')}
        />
        <StatCard
          title="Planos de Ação"
          value={data.total_planos}
          icon={ClipboardList}
          color="text-green-600"
          subtitle={`${data.planos_concluidos} concluídos • ${data.planos_atrasados} atrasados`}
          onClick={() => navigate('/planos-acao')}
        />
      </div>

      {/* Feedbacks by Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Feedbacks por Tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(data.feedbacks_por_tipo || {}).map(([tipo, count]) => (
              <div key={tipo} className="flex items-center gap-4">
                <span className="text-sm text-gray-600 w-48">{tipo}</span>
                <div className="flex-1">
                  <Progress 
                    value={(count / data.total_feedbacks) * 100} 
                    className="h-2"
                  />
                </div>
                <span className="text-sm font-medium w-12 text-right">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Gestor Dashboard
const GestorDashboard = ({ data }) => {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(210,54%,23%)]">Dashboard do Gestor</h1>
          <p className="text-gray-500">Acompanhe sua equipe e feedbacks</p>
        </div>
        <Button 
          onClick={() => navigate('/feedbacks/novo')}
          className="bg-[hsl(30,94%,54%)] hover:bg-[hsl(30,94%,45%)]"
          data-testid="new-feedback-btn"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Feedback
        </Button>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Feedbacks Atrasados"
          value={data.feedbacks_atrasados}
          icon={AlertTriangle}
          color="text-red-600"
          onClick={() => navigate('/feedbacks?status=Atrasado')}
        />
        <StatCard
          title="Vencendo em 7 dias"
          value={data.feedbacks_7_dias}
          icon={Clock}
          color="text-yellow-600"
        />
        <StatCard
          title="Vencendo em 30 dias"
          value={data.feedbacks_30_dias}
          icon={Calendar}
          color="text-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Aguardando Ciência"
          value={data.aguardando_ciencia}
          icon={Eye}
          color="text-sky-600"
        />
        <StatCard
          title="Sem Feedback Recente"
          value={data.colaboradores_sem_feedback}
          icon={Users}
          color="text-orange-600"
          subtitle="Últimos 90 dias"
        />
        <StatCard
          title="Planos Atrasados"
          value={data.planos_atrasados}
          icon={ClipboardList}
          color="text-red-600"
          onClick={() => navigate('/planos-acao?status=Atrasado')}
        />
      </div>

      {/* Recent Feedbacks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Feedbacks Recentes</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/feedbacks')}>
            Ver todos <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recent_feedbacks?.length > 0 ? (
              data.recent_feedbacks.map((feedback) => (
                <FeedbackItem key={feedback.id} feedback={feedback} />
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">Nenhum feedback recente</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Colaborador Dashboard
const ColaboradorDashboard = ({ data, onRefresh }) => {
  const navigate = useNavigate();
  const [acknowledging, setAcknowledging] = useState(null);

  const handleAcknowledge = async (feedbackId) => {
    setAcknowledging(feedbackId);
    try {
      await acknowledgeFeedback(feedbackId);
      toast.success('Ciência confirmada com sucesso!');
      onRefresh();
    } catch (error) {
      toast.error('Erro ao confirmar ciência');
    } finally {
      setAcknowledging(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Não definida';
    try {
      return format(parseISO(dateStr), "dd 'de' MMMM, yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(210,54%,23%)]">Meu Dashboard</h1>
          <p className="text-gray-500">Acompanhe seus feedbacks e desenvolvimento</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Feedbacks"
          value={data.total_feedbacks}
          icon={MessageSquare}
          color="text-[hsl(30,94%,54%)]"
          onClick={() => navigate('/feedbacks')}
        />
        <StatCard
          title="Pendentes de Ciência"
          value={data.pendente_ciencia}
          icon={Eye}
          color="text-yellow-600"
        />
        <StatCard
          title="Planos Ativos"
          value={data.planos_ativos}
          icon={ClipboardList}
          color="text-blue-600"
          onClick={() => navigate('/planos-acao')}
        />
        <StatCard
          title="Planos Atrasados"
          value={data.planos_atrasados}
          icon={AlertTriangle}
          color="text-red-600"
        />
      </div>

      {/* Next Feedback */}
      {data.proximo_feedback && (
        <Card className="border-l-4 border-l-[hsl(30,94%,54%)]">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-[hsl(30,94%,54%)]" />
              <div>
                <p className="text-sm text-gray-500">Próximo feedback agendado</p>
                <p className="font-semibold text-[hsl(210,54%,23%)]">
                  {formatDate(data.proximo_feedback)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Feedbacks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Meus Feedbacks</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/feedbacks')}>
            Ver todos <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recent_feedbacks?.length > 0 ? (
              data.recent_feedbacks.map((feedback) => (
                <FeedbackItem
                  key={feedback.id}
                  feedback={feedback}
                  showAcknowledge={true}
                  onAcknowledge={handleAcknowledge}
                />
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">Nenhum feedback recebido ainda</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const { user, isAdmin, isGestor, isColaborador } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({});

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      let response;
      if (isAdmin()) {
        response = await getAdminDashboard();
      } else if (isGestor()) {
        response = await getGestorDashboard();
      } else {
        response = await getColaboradorDashboard();
      }
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
      toast.error('Erro ao carregar dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.papel]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(30,94%,54%)]"></div>
      </div>
    );
  }

  if (isAdmin()) {
    return <AdminDashboard data={data} />;
  } else if (isGestor()) {
    return <GestorDashboard data={data} />;
  } else {
    return <ColaboradorDashboard data={data} onRefresh={fetchDashboardData} />;
  }
};

export default Dashboard;
