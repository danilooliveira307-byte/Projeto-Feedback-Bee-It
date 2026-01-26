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
  Eye,
  Hexagon
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const StatCard = ({ title, value, icon: Icon, color, bgColor, subtitle, onClick }) => (
  <div 
    className={`metric-card rounded-xl p-6 card-hover ${onClick ? 'cursor-pointer' : ''}`}
    onClick={onClick}
    data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-400 mb-1">{title}</p>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-xl ${bgColor}`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
    </div>
  </div>
);

const FeedbackItem = ({ feedback, onAcknowledge, showAcknowledge = false }) => {
  const navigate = useNavigate();
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Em dia':
        return <Badge className="status-em-dia text-xs">Em dia</Badge>;
      case 'Aguardando ciência':
        return <Badge className="status-aguardando text-xs">Aguardando ciência</Badge>;
      case 'Atrasado':
        return <Badge className="status-atrasado text-xs">Atrasado</Badge>;
      default:
        return <Badge className="bg-slate-700 text-slate-300 text-xs">{status}</Badge>;
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
    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800/80 transition-all border border-slate-700/50">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-white">
            {feedback.colaborador_nome || feedback.gestor_nome}
          </span>
          {getStatusBadge(feedback.status_feedback)}
        </div>
        <p className="text-sm text-slate-400">
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
            className="bg-[#F59E0B] hover:bg-[#D97706] text-white"
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
          className="text-slate-400 hover:text-white hover:bg-slate-700"
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
          <h1 className="text-3xl font-bold text-white">Dashboard Admin</h1>
          <p className="text-slate-400 mt-1">Visão geral do sistema Bee It Feedback</p>
        </div>
      </div>

      {/* Stats Grid - Bento Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Usuários"
          value={data.total_usuarios}
          icon={Users}
          color="text-blue-400"
          bgColor="bg-blue-500/20"
          subtitle={`${data.total_admins} admins • ${data.total_gestores} gestores • ${data.total_colaboradores} colaboradores`}
          onClick={() => navigate('/usuarios')}
        />
        <StatCard
          title="Times"
          value={data.total_times}
          icon={Building2}
          color="text-purple-400"
          bgColor="bg-purple-500/20"
          onClick={() => navigate('/times')}
        />
        <StatCard
          title="Total de Feedbacks"
          value={data.total_feedbacks}
          icon={MessageSquare}
          color="text-[#F59E0B]"
          bgColor="bg-[#F59E0B]/20"
          subtitle={`${data.feedbacks_atrasados} atrasados • ${data.feedbacks_aguardando} aguardando`}
          onClick={() => navigate('/feedbacks')}
        />
        <StatCard
          title="Planos de Ação"
          value={data.total_planos}
          icon={ClipboardList}
          color="text-emerald-400"
          bgColor="bg-emerald-500/20"
          subtitle={`${data.planos_concluidos} concluídos • ${data.planos_atrasados} atrasados`}
          onClick={() => navigate('/planos-acao')}
        />
      </div>

      {/* Feedbacks by Type */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white">Feedbacks por Tipo</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {Object.entries(data.feedbacks_por_tipo || {}).map(([tipo, count]) => (
              <div key={tipo} className="flex items-center gap-4">
                <span className="text-sm text-slate-400 w-48">{tipo}</span>
                <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] rounded-full transition-all"
                    style={{ width: `${(count / data.total_feedbacks) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-white w-12 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
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
          <h1 className="text-3xl font-bold text-white">Dashboard do Gestor</h1>
          <p className="text-slate-400 mt-1">Acompanhe sua equipe e feedbacks</p>
        </div>
        <Button 
          onClick={() => navigate('/feedbacks/novo')}
          className="bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold shadow-lg shadow-orange-500/20"
          data-testid="new-feedback-btn"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Feedback
        </Button>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="metric-card-highlight rounded-xl p-6 card-hover cursor-pointer" onClick={() => navigate('/feedbacks?status=Atrasado')}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Feedbacks Atrasados</p>
              <p className="text-3xl font-bold text-red-400">{data.feedbacks_atrasados}</p>
            </div>
            <div className="p-3 rounded-xl bg-red-500/20">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
          </div>
        </div>
        <StatCard
          title="Vencendo em 7 dias"
          value={data.feedbacks_7_dias}
          icon={Clock}
          color="text-yellow-400"
          bgColor="bg-yellow-500/20"
        />
        <StatCard
          title="Vencendo em 30 dias"
          value={data.feedbacks_30_dias}
          icon={Calendar}
          color="text-blue-400"
          bgColor="bg-blue-500/20"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Aguardando Ciência"
          value={data.aguardando_ciencia}
          icon={Eye}
          color="text-sky-400"
          bgColor="bg-sky-500/20"
        />
        <StatCard
          title="Sem Feedback Recente"
          value={data.colaboradores_sem_feedback}
          icon={Users}
          color="text-orange-400"
          bgColor="bg-orange-500/20"
          subtitle="Últimos 90 dias"
        />
        <StatCard
          title="Planos Atrasados"
          value={data.planos_atrasados}
          icon={ClipboardList}
          color="text-red-400"
          bgColor="bg-red-500/20"
          onClick={() => navigate('/planos-acao?status=Atrasado')}
        />
      </div>

      {/* Recent Feedbacks */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Feedbacks Recentes</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/feedbacks')}
            className="text-slate-400 hover:text-white"
          >
            Ver todos <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {data.recent_feedbacks?.length > 0 ? (
              data.recent_feedbacks.map((feedback) => (
                <FeedbackItem key={feedback.id} feedback={feedback} />
              ))
            ) : (
              <p className="text-center text-slate-500 py-8">Nenhum feedback recente</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Colaborador Dashboard
const ColaboradorDashboard = ({ data, onRefresh }) => {
  const navigate = useNavigate();
  const [acknowledging, setAcknowledging] = useState(null);
  const { toast } = useToast();

  const handleAcknowledge = async (feedbackId) => {
    setAcknowledging(feedbackId);
    try {
      await acknowledgeFeedback(feedbackId);
      toast({ title: 'Ciência confirmada com sucesso!' });
      onRefresh();
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao confirmar ciência', variant: 'destructive' });
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
          <h1 className="text-3xl font-bold text-white">Meu Dashboard</h1>
          <p className="text-slate-400 mt-1">Acompanhe seus feedbacks e desenvolvimento</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Feedbacks"
          value={data.total_feedbacks}
          icon={MessageSquare}
          color="text-[#F59E0B]"
          bgColor="bg-[#F59E0B]/20"
          onClick={() => navigate('/feedbacks')}
        />
        <StatCard
          title="Pendentes de Ciência"
          value={data.pendente_ciencia}
          icon={Eye}
          color="text-yellow-400"
          bgColor="bg-yellow-500/20"
        />
        <StatCard
          title="Planos Ativos"
          value={data.planos_ativos}
          icon={ClipboardList}
          color="text-blue-400"
          bgColor="bg-blue-500/20"
          onClick={() => navigate('/planos-acao')}
        />
        <StatCard
          title="Planos Atrasados"
          value={data.planos_atrasados}
          icon={AlertTriangle}
          color="text-red-400"
          bgColor="bg-red-500/20"
        />
      </div>

      {/* Next Feedback */}
      {data.proximo_feedback && (
        <div className="metric-card-highlight rounded-xl p-6 border-l-4 border-l-[#F59E0B]">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#F59E0B]/20">
              <Calendar className="h-6 w-6 text-[#F59E0B]" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Próximo feedback agendado</p>
              <p className="font-semibold text-white text-lg">
                {formatDate(data.proximo_feedback)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Feedbacks */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Meus Feedbacks</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/feedbacks')}
            className="text-slate-400 hover:text-white"
          >
            Ver todos <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        <div className="p-6">
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
              <p className="text-center text-slate-500 py-8">Nenhum feedback recebido ainda</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const { user, isAdmin, isGestor, isColaborador } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({});
  const { toast } = useToast();

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
      toast({ title: 'Erro', description: 'Erro ao carregar dashboard', variant: 'destructive' });
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
        <div className="flex flex-col items-center gap-4">
          <Hexagon className="h-12 w-12 text-[#F59E0B] animate-pulse" />
          <p className="text-slate-400">Carregando dashboard...</p>
        </div>
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
