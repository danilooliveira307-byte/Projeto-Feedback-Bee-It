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
  createCheckin,
  updateActionPlan
} from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
  ArrowLeft,
  Plus,
  Trash2,
  MessageSquare,
  CheckCircle2,
  Calendar,
  User,
  Target,
  ClipboardCheck
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PROGRESS_OPTIONS = ['Ruim', 'Regular', 'Bom'];
const ActionPlanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isGestorOrAdmin } = useAuth();
  
  const [plan, setPlan] = useState(null);
  const { toast } = useToast();
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
    
      await createActionPlanItem({
        plano_de_acao_id: id,
        descricao: newItemText.trim()
      });
      setNewItemText('');
      fetchData();
      toast({ title: 'Item adicionado!' });
      toast({ title: 'Erro', description: 'Erro ao adicionar item', variant: 'destructive' });
  const handleToggleItem = async (item) => {
      await updateActionPlanItem(item.id, { concluido: !item.concluido });
      toast({ title: 'Erro', description: 'Erro ao atualizar item', variant: 'destructive' });
  const handleDeleteItem = async (itemId) => {
      await deleteActionPlanItem(itemId);
      toast({ title: 'Item removido!' });
      toast({ title: 'Erro', description: 'Erro ao remover item', variant: 'destructive' });
  const handleCreateCheckin = async () => {
    if (!newCheckin.comentario.trim()) {
      toast({ title: 'Erro', description: 'Adicione um comentário', variant: 'destructive' });
      return;
      await createCheckin({
        progresso: newCheckin.progresso,
        comentario: newCheckin.comentario
      setCheckinDialogOpen(false);
      setNewCheckin({ progresso: 'Regular', comentario: '' });
      toast({ title: 'Check-in registrado!' });
      toast({ title: 'Erro', description: 'Erro ao registrar check-in', variant: 'destructive' });
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Concluído':
        return <Badge className="bg-green-100 text-green-700">Concluído</Badge>;
      case 'Em andamento':
        return <Badge className="bg-blue-100 text-blue-700">Em andamento</Badge>;
      case 'Atrasado':
        return <Badge className="bg-red-100 text-red-700">Atrasado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
  const getProgressBadge = (progresso) => {
    switch (progresso) {
      case 'Bom':
        return <Badge className="bg-green-100 text-green-700">Bom</Badge>;
      case 'Regular':
        return <Badge className="bg-yellow-100 text-yellow-700">Regular</Badge>;
      case 'Ruim':
        return <Badge className="bg-red-100 text-red-700">Ruim</Badge>;
        return <Badge variant="secondary">{progresso}</Badge>;
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
      return format(parseISO(dateStr), "dd 'de' MMMM, yyyy", { locale: ptBR });
    } catch {
      return dateStr;
  const formatDateTime = (dateStr) => {
      return format(parseISO(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(30,94%,54%)]"></div>
      </div>
    );
  }
  if (!plan) {
    return null;
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto" data-testid="action-plan-detail">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-[hsl(210,54%,23%)]">Plano de Ação</h1>
            {getStatusBadge(plan.status)}
          </div>
          <p className="text-gray-500">Prazo: {formatDate(plan.prazo_final)}</p>
        </div>
        <Button
          onClick={() => setCheckinDialogOpen(true)}
          className="bg-[hsl(30,94%,54%)] hover:bg-[hsl(30,94%,45%)]"
          data-testid="new-checkin-btn"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Novo Check-in
      {/* Objective */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Objetivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">{plan.objetivo}</p>
          <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              Responsável: {plan.responsavel}
            </span>
              <Calendar className="h-4 w-4" />
              Prazo: {formatDate(plan.prazo_final)}
        </CardContent>
      </Card>
      {/* Progress */}
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Progresso Geral</span>
            <span className="text-2xl font-bold text-[hsl(30,94%,54%)]">
              {plan.progresso_percentual}%
          <Progress value={plan.progresso_percentual} className="h-3" />
          <p className="text-sm text-gray-500 mt-2">
            {items.filter(i => i.concluido).length} de {items.length} itens concluídos
          </p>
      {/* Checklist */}
        <CardHeader className="flex flex-row items-center justify-between">
            <ClipboardCheck className="h-5 w-5" />
            Itens do Plano
        <CardContent className="space-y-4">
          {/* Add new item */}
          <div className="flex gap-2">
            <Input
              placeholder="Adicionar novo item..."
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
              data-testid="new-item-input"
            />
            <Button onClick={handleAddItem} className="bg-[hsl(30,94%,54%)] hover:bg-[hsl(30,94%,45%)]">
              <Plus className="h-4 w-4" />
            </Button>
          {/* Items list */}
          <div className="space-y-2">
            {items.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Nenhum item cadastrado</p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    item.concluido ? 'bg-green-50 border-green-200' : 'bg-white'
                  }`}
                  data-testid={`item-${item.id}`}
                >
                  <Checkbox
                    checked={item.concluido}
                    onCheckedChange={() => handleToggleItem(item)}
                  />
                  <span className={`flex-1 ${item.concluido ? 'line-through text-gray-500' : ''}`}>
                    {item.descricao}
                  </span>
                  {item.prazo_item && (
                    <span className="text-xs text-gray-400">
                      {formatDate(item.prazo_item)}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteItem(item.id)}
                    className="h-8 w-8 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
      {/* Check-ins */}
            <MessageSquare className="h-5 w-5" />
            Histórico de Check-ins
          {checkins.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum check-in registrado</p>
              <Button
                variant="link"
                onClick={() => setCheckinDialogOpen(true)}
                className="text-[hsl(30,94%,54%)]"
              >
                Registrar primeiro check-in
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {checkins.map((checkin) => (
                <div key={checkin.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{checkin.registrado_por_nome}</span>
                      {getProgressBadge(checkin.progresso)}
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDateTime(checkin.data_checkin)}
                  </div>
                  <p className="text-gray-600">{checkin.comentario}</p>
              ))}
          )}
      {/* Check-in Dialog */}
      <Dialog open={checkinDialogOpen} onOpenChange={setCheckinDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Check-in</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Avaliação do Progresso</Label>
              <Select
                value={newCheckin.progresso}
                onValueChange={(v) => setNewCheckin(prev => ({ ...prev, progresso: v }))}
                <SelectTrigger data-testid="checkin-progress-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROGRESS_OPTIONS.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label>Comentário</Label>
              <Textarea
                placeholder="Descreva o progresso e observações..."
                value={newCheckin.comentario}
                onChange={(e) => setNewCheckin(prev => ({ ...prev, comentario: e.target.value }))}
                rows={4}
                data-testid="checkin-comment-input"
              />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckinDialogOpen(false)}>
              Cancelar
            <Button
              onClick={handleCreateCheckin}
              className="bg-[hsl(30,94%,54%)] hover:bg-[hsl(30,94%,45%)]"
              data-testid="save-checkin-btn"
            >
              Registrar Check-in
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default ActionPlanDetail;
