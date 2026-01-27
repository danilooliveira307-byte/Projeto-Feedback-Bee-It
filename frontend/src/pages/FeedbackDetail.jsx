import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getFeedback,
  getActionPlans,
  acknowledgeFeedback,
  createActionPlan
} from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  ArrowLeft,
  Edit,
  CheckCircle2,
  Calendar as CalendarIcon,
  User,
  MessageSquare,
  ClipboardList,
  Target,
  TrendingUp,
  TrendingDown,
  Plus,
  Lock,
  Hexagon
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const FeedbackDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isColaborador, isGestorOrAdmin } = useAuth();
  const { toast } = useToast();
  
  const [feedback, setFeedback] = useState(null);
  const [actionPlans, setActionPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acknowledging, setAcknowledging] = useState(false);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [newPlan, setNewPlan] = useState({
    objetivo: '',
    prazo_final: null,
    responsavel: 'Colaborador'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [feedbackRes, plansRes] = await Promise.all([
        getFeedback(id),
        getActionPlans({ feedback_id: id })
      ]);
      setFeedback(feedbackRes.data);
      setActionPlans(plansRes.data);
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar feedback', variant: 'destructive' });
      navigate('/feedbacks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAcknowledge = async () => {
    setAcknowledging(true);
    try {
      await acknowledgeFeedback(id);
      toast({ title: 'Ciência confirmada!' });
      fetchData();
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao confirmar ciência', variant: 'destructive' });
    } finally {
      setAcknowledging(false);
    }
  };

  const handleCreatePlan = async () => {
    if (!newPlan.objetivo || !newPlan.prazo_final) {
      toast({ title: 'Erro', description: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }

    try {
      await createActionPlan({
        feedback_id: id,
        objetivo: newPlan.objetivo,
        prazo_final: newPlan.prazo_final.toISOString(),
        responsavel: newPlan.responsavel
      });
      toast({ title: 'Plano de ação criado!' });
      setPlanDialogOpen(false);
      setNewPlan({ objetivo: '', prazo_final: null, responsavel: 'Colaborador' });
      fetchData();
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao criar plano de ação', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Em dia':
        return <Badge className="status-em-dia">Em dia</Badge>;
      case 'Aguardando ciência':
        return <Badge className="status-aguardando">Aguardando ciência</Badge>;
      case 'Atrasado':
        return <Badge className="status-atrasado">Atrasado</Badge>;
      default:
        return <Badge className="bg-slate-700 text-slate-300">{status}</Badge>;
    }
  };

  const getPlanStatusBadge = (status) => {
    switch (status) {
      case 'Concluído':
        return <Badge className="status-em-dia text-xs">Concluído</Badge>;
      case 'Em andamento':
        return <Badge className="status-aguardando text-xs">Em andamento</Badge>;
      case 'Atrasado':
        return <Badge className="status-atrasado text-xs">Atrasado</Badge>;
      default:
        return <Badge className="bg-slate-700 text-slate-300 text-xs">{status}</Badge>;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return format(parseISO(dateStr), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <Hexagon className="h-12 w-12 text-[#F59E0B] animate-pulse" />
          <p className="text-slate-400">Carregando feedback...</p>
        </div>
      </div>
    );
  }

  if (!feedback) {
    return null;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto" data-testid="feedback-detail-page">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-white hover:bg-slate-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">
                Feedback - {feedback.tipo_feedback}
              </h1>
              {feedback.confidencial && (
                <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30 gap-1">
                  <Lock className="h-3 w-3" />
                  Confidencial
                </Badge>
              )}
            </div>
            <p className="text-slate-400">
              {formatDate(feedback.data_feedback)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isColaborador() && !feedback.ciencia_colaborador && (
            <Button
              onClick={handleAcknowledge}
              disabled={acknowledging}
              className="bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold shadow-lg shadow-orange-500/20"
              data-testid="acknowledge-btn"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {acknowledging ? 'Confirmando...' : 'Confirmar Ciência'}
            </Button>
          )}
          {isGestorOrAdmin() && (
            <Button
              variant="outline"
              onClick={() => navigate(`/feedbacks/${id}/editar`)}
              className="bg-slate-800/50 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="metric-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-lg">
              <User className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Colaborador</p>
              <p className="font-medium text-white">{feedback.colaborador_nome}</p>
            </div>
          </div>
        </div>
        <div className="metric-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-lg">
              <MessageSquare className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Gestor</p>
              <p className="font-medium text-white">{feedback.gestor_nome}</p>
            </div>
          </div>
        </div>
        <div className="metric-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-lg">
              <Target className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Status</p>
              {getStatusBadge(feedback.status_feedback)}
            </div>
          </div>
        </div>
      </div>

      {feedback.ciencia_colaborador && (
        <div className="glass-card rounded-xl p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="font-medium text-emerald-400">Ciência Confirmada</p>
              <p className="text-sm text-slate-500">
                em {formatDate(feedback.data_ciencia)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white">Conteúdo do Feedback</h2>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <h4 className="font-medium text-slate-300 mb-2">Contexto</h4>
            <p className="text-slate-400 whitespace-pre-wrap">{feedback.contexto}</p>
          </div>
          
          {feedback.impacto && (
            <div>
              <h4 className="font-medium text-slate-300 mb-2">Impacto</h4>
              <p className="text-slate-400 whitespace-pre-wrap">{feedback.impacto}</p>
            </div>
          )}
          
          {feedback.expectativa && (
            <div>
              <h4 className="font-medium text-slate-300 mb-2">Expectativa</h4>
              <p className="text-slate-400 whitespace-pre-wrap">{feedback.expectativa}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-6 border-b border-emerald-500/30">
            <h3 className="text-lg font-semibold text-emerald-400 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Pontos Fortes
            </h3>
          </div>
          <div className="p-6">
            {feedback.pontos_fortes?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {feedback.pontos_fortes.map((ponto, index) => (
                  <Badge key={index} className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {ponto}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Nenhum ponto forte registrado</p>
            )}
          </div>
        </div>

        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-6 border-b border-amber-500/30">
            <h3 className="text-lg font-semibold text-amber-400 flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Pontos de Melhoria
            </h3>
          </div>
          <div className="p-6">
            {feedback.pontos_melhoria?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {feedback.pontos_melhoria.map((ponto, index) => (
                  <Badge key={index} className="bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {ponto}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Nenhum ponto de melhoria registrado</p>
            )}
          </div>
        </div>
      </div>

      {feedback.data_proximo_feedback && (
        <div className="metric-card-highlight rounded-xl p-6 border-l-4 border-l-[#F59E0B]">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#F59E0B]/20">
              <CalendarIcon className="h-6 w-6 text-[#F59E0B]" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Próximo Feedback</p>
              <p className="font-semibold text-white text-lg">
                {formatDate(feedback.data_proximo_feedback)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-[#F59E0B]" />
            Planos de Ação
          </h3>
          {isGestorOrAdmin() && (
            <Button
              size="sm"
              onClick={() => setPlanDialogOpen(true)}
              className="bg-[#F59E0B] hover:bg-[#D97706] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Plano
            </Button>
          )}
        </div>
        <div className="p-6">
          {actionPlans.length > 0 ? (
            <div className="space-y-4">
              {actionPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:bg-slate-800 transition-colors cursor-pointer"
                  onClick={() => navigate(`/planos-acao/${plan.id}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-white">{plan.objetivo}</p>
                      <p className="text-sm text-slate-500">
                        Prazo: {formatDate(plan.prazo_final)} • Responsável: {plan.responsavel}
                      </p>
                    </div>
                    {getPlanStatusBadge(plan.status)}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] rounded-full"
                        style={{ width: `${plan.progresso_percentual}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-white">{plan.progresso_percentual}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum plano de ação vinculado</p>
              {isGestorOrAdmin() && (
                <Button
                  variant="link"
                  onClick={() => setPlanDialogOpen(true)}
                  className="text-[#F59E0B]"
                >
                  Criar plano de ação
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Novo Plano de Ação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Objetivo</Label>
              <Textarea
                placeholder="Descreva o objetivo do plano..."
                value={newPlan.objetivo}
                onChange={(e) => setNewPlan(prev => ({ ...prev, objetivo: e.target.value }))}
                rows={3}
                className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Prazo Final</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-left font-normal bg-slate-950 border-slate-700 text-white hover:bg-slate-800"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newPlan.prazo_final 
                        ? format(newPlan.prazo_final, "dd/MM/yyyy")
                        : 'Selecione'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-700" align="start">
                    <Calendar
                      mode="single"
                      selected={newPlan.prazo_final}
                      onSelect={(date) => setNewPlan(prev => ({ ...prev, prazo_final: date }))}
                      disabled={(date) => date < new Date()}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Responsável</Label>
                <Select
                  value={newPlan.responsavel}
                  onValueChange={(v) => setNewPlan(prev => ({ ...prev, responsavel: v }))}
                >
                  <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem key="colaborador" value="Colaborador">Colaborador</SelectItem>
                    <SelectItem key="gestor" value="Gestor">Gestor</SelectItem>
                    <SelectItem key="ambos" value="Ambos">Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setPlanDialogOpen(false)}
              className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreatePlan}
              className="bg-[#F59E0B] hover:bg-[#D97706] text-white"
            >
              Criar Plano
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeedbackDetail;
