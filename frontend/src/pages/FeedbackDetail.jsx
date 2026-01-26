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
  Eye,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const FeedbackDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isColaborador, isGestorOrAdmin } = useAuth();
  
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

  useEffect(() => {
    fetchData();
  }, [id]);

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
      toast.error('Erro ao carregar feedback');
      navigate('/feedbacks');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async () => {
    setAcknowledging(true);
    try {
      await acknowledgeFeedback(id);
      toast.success('Ciência confirmada!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao confirmar ciência');
    } finally {
      setAcknowledging(false);
    }
  };

  const handleCreatePlan = async () => {
    if (!newPlan.objetivo || !newPlan.prazo_final) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      await createActionPlan({
        feedback_id: id,
        objetivo: newPlan.objetivo,
        prazo_final: newPlan.prazo_final.toISOString(),
        responsavel: newPlan.responsavel
      });
      toast.success('Plano de ação criado!');
      setPlanDialogOpen(false);
      setNewPlan({ objetivo: '', prazo_final: null, responsavel: 'Colaborador' });
      fetchData();
    } catch (error) {
      toast.error('Erro ao criar plano de ação');
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
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPlanStatusBadge = (status) => {
    switch (status) {
      case 'Concluído':
        return <Badge className="bg-green-100 text-green-700">Concluído</Badge>;
      case 'Em andamento':
        return <Badge className="bg-blue-100 text-blue-700">Em andamento</Badge>;
      case 'Atrasado':
        return <Badge className="bg-red-100 text-red-700">Atrasado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(30,94%,54%)]"></div>
      </div>
    );
  }

  if (!feedback) {
    return null;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto" data-testid="feedback-detail-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[hsl(210,54%,23%)]">
                Feedback - {feedback.tipo_feedback}
              </h1>
              {feedback.confidencial && (
                <Badge variant="outline" className="gap-1">
                  <Lock className="h-3 w-3" />
                  Confidencial
                </Badge>
              )}
            </div>
            <p className="text-gray-500">
              {formatDate(feedback.data_feedback)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isColaborador() && !feedback.ciencia_colaborador && (
            <Button
              onClick={handleAcknowledge}
              disabled={acknowledging}
              className="bg-[hsl(30,94%,54%)] hover:bg-[hsl(30,94%,45%)]"
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
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
        </div>
      </div>

      {/* Status and Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <User className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Colaborador</p>
              <p className="font-medium">{feedback.colaborador_nome}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <MessageSquare className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Gestor</p>
              <p className="font-medium">{feedback.gestor_nome}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Target className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              {getStatusBadge(feedback.status_feedback)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acknowledgment Info */}
      {feedback.ciencia_colaborador && (
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-700">Ciência Confirmada</p>
              <p className="text-sm text-gray-500">
                em {formatDate(feedback.data_ciencia)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Conteúdo do Feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Contexto</h4>
            <p className="text-gray-600 whitespace-pre-wrap">{feedback.contexto}</p>
          </div>
          
          {feedback.impacto && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Impacto</h4>
              <p className="text-gray-600 whitespace-pre-wrap">{feedback.impacto}</p>
            </div>
          )}
          
          {feedback.expectativa && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Expectativa</h4>
              <p className="text-gray-600 whitespace-pre-wrap">{feedback.expectativa}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Points */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pontos Fortes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-green-700">
              <TrendingUp className="h-5 w-5" />
              Pontos Fortes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {feedback.pontos_fortes?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {feedback.pontos_fortes.map((ponto, index) => (
                  <Badge key={index} className="bg-green-100 text-green-700">
                    {ponto}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Nenhum ponto forte registrado</p>
            )}
          </CardContent>
        </Card>

        {/* Pontos de Melhoria */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-amber-700">
              <TrendingDown className="h-5 w-5" />
              Pontos de Melhoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {feedback.pontos_melhoria?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {feedback.pontos_melhoria.map((ponto, index) => (
                  <Badge key={index} className="bg-amber-100 text-amber-700">
                    {ponto}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Nenhum ponto de melhoria registrado</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Next Feedback */}
      {feedback.data_proximo_feedback && (
        <Card className="border-l-4 border-l-[hsl(30,94%,54%)]">
          <CardContent className="p-4 flex items-center gap-3">
            <CalendarIcon className="h-5 w-5 text-[hsl(30,94%,54%)]" />
            <div>
              <p className="text-sm text-gray-500">Próximo Feedback</p>
              <p className="font-medium text-[hsl(210,54%,23%)]">
                {formatDate(feedback.data_proximo_feedback)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Plans */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Planos de Ação
          </CardTitle>
          {isGestorOrAdmin() && (
            <Button
              size="sm"
              onClick={() => setPlanDialogOpen(true)}
              className="bg-[hsl(30,94%,54%)] hover:bg-[hsl(30,94%,45%)]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Plano
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {actionPlans.length > 0 ? (
            <div className="space-y-4">
              {actionPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => navigate(`/planos-acao/${plan.id}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-[hsl(210,54%,23%)]">{plan.objetivo}</p>
                      <p className="text-sm text-gray-500">
                        Prazo: {formatDate(plan.prazo_final)} • Responsável: {plan.responsavel}
                      </p>
                    </div>
                    {getPlanStatusBadge(plan.status)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={plan.progresso_percentual} className="flex-1 h-2" />
                    <span className="text-sm font-medium">{plan.progresso_percentual}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum plano de ação vinculado</p>
              {isGestorOrAdmin() && (
                <Button
                  variant="link"
                  onClick={() => setPlanDialogOpen(true)}
                  className="text-[hsl(30,94%,54%)]"
                >
                  Criar plano de ação
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Plan Dialog */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Plano de Ação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Objetivo</Label>
              <Textarea
                placeholder="Descreva o objetivo do plano..."
                value={newPlan.objetivo}
                onChange={(e) => setNewPlan(prev => ({ ...prev, objetivo: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prazo Final</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newPlan.prazo_final 
                        ? format(newPlan.prazo_final, "dd/MM/yyyy")
                        : 'Selecione'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
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
                <Label>Responsável</Label>
                <Select
                  value={newPlan.responsavel}
                  onValueChange={(v) => setNewPlan(prev => ({ ...prev, responsavel: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Colaborador">Colaborador</SelectItem>
                    <SelectItem value="Gestor">Gestor</SelectItem>
                    <SelectItem value="Ambos">Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreatePlan}
              className="bg-[hsl(30,94%,54%)] hover:bg-[hsl(30,94%,45%)]"
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
