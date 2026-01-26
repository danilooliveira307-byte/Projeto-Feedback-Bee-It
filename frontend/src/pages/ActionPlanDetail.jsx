import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getActionPlan,
  getActionPlanItems,
  createActionPlanItem,
  updateActionPlanItem,
  deleteActionPlanItem,
  getCheckins,
  createCheckin
} from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  ArrowLeft,
  Plus,
  Trash2,
  MessageSquare,
  Calendar,
  User,
  Target,
  ClipboardCheck,
  Hexagon
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PROGRESS_OPTIONS = ['Ruim', 'Regular', 'Bom'];

const ActionPlanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [plan, setPlan] = useState(null);
  const [items, setItems] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [newItemText, setNewItemText] = useState('');
  const [checkinDialogOpen, setCheckinDialogOpen] = useState(false);
  const [newCheckin, setNewCheckin] = useState({
    progresso: 'Regular',
    comentario: ''
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [planRes, itemsRes, checkinsRes] = await Promise.all([
        getActionPlan(id),
        getActionPlanItems(id),
        getCheckins(id)
      ]);
      setPlan(planRes.data);
      setItems(itemsRes.data);
      setCheckins(checkinsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar plano de ação', variant: 'destructive' });
      navigate('/planos-acao');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItemText.trim()) return;
    
    try {
      await createActionPlanItem({
        plano_de_acao_id: id,
        descricao: newItemText.trim()
      });
      setNewItemText('');
      fetchData();
      toast({ title: 'Item adicionado!' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao adicionar item', variant: 'destructive' });
    }
  };

  const handleToggleItem = async (item) => {
    try {
      await updateActionPlanItem(item.id, { concluido: !item.concluido });
      fetchData();
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao atualizar item', variant: 'destructive' });
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await deleteActionPlanItem(itemId);
      fetchData();
      toast({ title: 'Item removido!' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao remover item', variant: 'destructive' });
    }
  };

  const handleCreateCheckin = async () => {
    if (!newCheckin.comentario.trim()) {
      toast({ title: 'Erro', description: 'Adicione um comentário', variant: 'destructive' });
      return;
    }

    try {
      await createCheckin({
        plano_de_acao_id: id,
        progresso: newCheckin.progresso,
        comentario: newCheckin.comentario
      });
      setCheckinDialogOpen(false);
      setNewCheckin({ progresso: 'Regular', comentario: '' });
      fetchData();
      toast({ title: 'Check-in registrado!' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao registrar check-in', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Concluído':
        return <Badge className="status-em-dia">Concluído</Badge>;
      case 'Em andamento':
        return <Badge className="status-aguardando">Em andamento</Badge>;
      case 'Atrasado':
        return <Badge className="status-atrasado">Atrasado</Badge>;
      default:
        return <Badge className="bg-slate-700 text-slate-300">{status}</Badge>;
    }
  };

  const getProgressBadge = (progresso) => {
    switch (progresso) {
      case 'Bom':
        return <Badge className="status-em-dia">Bom</Badge>;
      case 'Regular':
        return <Badge className="status-pending">Regular</Badge>;
      case 'Ruim':
        return <Badge className="status-atrasado">Ruim</Badge>;
      default:
        return <Badge className="bg-slate-700 text-slate-300">{progresso}</Badge>;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return format(parseISO(dateStr), "dd 'de' MMMM, yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return format(parseISO(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <Hexagon className="h-12 w-12 text-[#F59E0B] animate-pulse" />
          <p className="text-slate-400">Carregando plano...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto" data-testid="action-plan-detail">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)}
          className="text-slate-400 hover:text-white hover:bg-slate-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-white">Plano de Ação</h1>
            {getStatusBadge(plan.status)}
          </div>
          <p className="text-slate-400">Prazo: {formatDate(plan.prazo_final)}</p>
        </div>
        <Button
          onClick={() => setCheckinDialogOpen(true)}
          className="bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold shadow-lg shadow-orange-500/20"
          data-testid="new-checkin-btn"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Novo Check-in
        </Button>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Target className="h-5 w-5 text-[#F59E0B]" />
            Objetivo
          </h2>
        </div>
        <div className="p-6">
          <p className="text-slate-300">{plan.objetivo}</p>
          <div className="flex items-center gap-4 mt-4 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              Responsável: {plan.responsavel}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Prazo: {formatDate(plan.prazo_final)}
            </span>
          </div>
        </div>
      </div>

      <div className="metric-card-highlight rounded-xl p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-slate-300">Progresso Geral</span>
          <span className="text-2xl font-bold text-[#F59E0B]">
            {plan.progresso_percentual}%
          </span>
        </div>
        <div className="bg-slate-800 rounded-full h-3 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] rounded-full transition-all"
            style={{ width: `${plan.progresso_percentual}%` }}
          />
        </div>
        <p className="text-sm text-slate-500 mt-2">
          {items.filter(i => i.concluido).length} de {items.length} itens concluídos
        </p>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-[#F59E0B]" />
            Itens do Plano
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Adicionar novo item..."
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              data-testid="new-item-input"
            />
            <Button 
              onClick={handleAddItem} 
              className="bg-[#F59E0B] hover:bg-[#D97706] text-white"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {items.length === 0 ? (
              <p className="text-center text-slate-500 py-4">Nenhum item cadastrado</p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    item.concluido 
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : 'bg-slate-800/50 border-slate-700/50'
                  }`}
                  data-testid={`item-${item.id}`}
                >
                  <Checkbox
                    checked={item.concluido}
                    onCheckedChange={() => handleToggleItem(item)}
                  />
                  <span className={`flex-1 ${item.concluido ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                    {item.descricao}
                  </span>
                  {item.prazo_item && (
                    <span className="text-xs text-slate-500">
                      {formatDate(item.prazo_item)}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteItem(item.id)}
                    className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#F59E0B]" />
            Histórico de Check-ins
          </h2>
        </div>
        <div className="p-6">
          {checkins.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum check-in registrado</p>
              <Button
                variant="link"
                onClick={() => setCheckinDialogOpen(true)}
                className="text-[#F59E0B]"
              >
                Registrar primeiro check-in
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {checkins.map((checkin) => (
                <div key={checkin.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{checkin.registrado_por_nome}</span>
                      {getProgressBadge(checkin.progresso)}
                    </div>
                    <span className="text-xs text-slate-500">
                      {formatDateTime(checkin.data_checkin)}
                    </span>
                  </div>
                  <p className="text-slate-300">{checkin.comentario}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={checkinDialogOpen} onOpenChange={setCheckinDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Novo Check-in</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Avaliação do Progresso</Label>
              <Select
                value={newCheckin.progresso}
                onValueChange={(v) => setNewCheckin(prev => ({ ...prev, progresso: v }))}
              >
                <SelectTrigger className="bg-slate-950 border-slate-700 text-white" data-testid="checkin-progress-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {PROGRESS_OPTIONS.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Comentário</Label>
              <Textarea
                placeholder="Descreva o progresso e observações..."
                value={newCheckin.comentario}
                onChange={(e) => setNewCheckin(prev => ({ ...prev, comentario: e.target.value }))}
                rows={4}
                className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
                data-testid="checkin-comment-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCheckinDialogOpen(false)}
              className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateCheckin}
              className="bg-[#F59E0B] hover:bg-[#D97706] text-white"
              data-testid="save-checkin-btn"
            >
              Registrar Check-in
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActionPlanDetail;
