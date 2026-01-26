import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getFeedback,
  createFeedback,
  updateFeedback,
  getUsers,
  getTeams,
  createActionPlan
} from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Badge } from '../components/ui/badge';
import {
  ArrowLeft,
  CalendarIcon,
  Plus,
  X,
  Save,
  Loader2,
  ClipboardList,
  Hexagon
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { format, addDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const FEEDBACK_TYPES = ['1:1', 'Avaliação de Desempenho', 'Coaching', 'Correção de Rota', 'Elogio'];

const FeedbackForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  
  const [formData, setFormData] = useState({
    colaborador_id: '',
    tipo_feedback: '',
    contexto: '',
    impacto: '',
    expectativa: '',
    pontos_fortes: [],
    pontos_melhoria: [],
    data_proximo_feedback: null,
    confidencial: false
  });

  const [newPontoForte, setNewPontoForte] = useState('');
  const [newPontoMelhoria, setNewPontoMelhoria] = useState('');
  const [createPlan, setCreatePlan] = useState(false);
  const [planData, setPlanData] = useState({
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
      const [usersRes, teamsRes] = await Promise.all([
        getUsers(),
        getTeams()
      ]);
      setUsers(usersRes.data.filter(u => u.papel === 'COLABORADOR'));
      setTeams(teamsRes.data);

      if (isEditing) {
        const feedbackRes = await getFeedback(id);
        const feedback = feedbackRes.data;
        setFormData({
          colaborador_id: feedback.colaborador_id,
          tipo_feedback: feedback.tipo_feedback,
          contexto: feedback.contexto,
          impacto: feedback.impacto,
          expectativa: feedback.expectativa,
          pontos_fortes: feedback.pontos_fortes || [],
          pontos_melhoria: feedback.pontos_melhoria || [],
          data_proximo_feedback: feedback.data_proximo_feedback ? parseISO(feedback.data_proximo_feedback) : null,
          confidencial: feedback.confidencial
        });
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar dados', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleColaboradorChange = (colaboradorId) => {
    setFormData(prev => ({ ...prev, colaborador_id: colaboradorId }));
    
    const colaborador = users.find(u => u.id === colaboradorId);
    if (colaborador?.time_id) {
      const team = teams.find(t => t.id === colaborador.time_id);
      if (team?.frequencia_padrao_feedback_dias) {
        const suggestedDate = addDays(new Date(), team.frequencia_padrao_feedback_dias);
        setFormData(prev => ({ ...prev, data_proximo_feedback: suggestedDate }));
      }
    }
  };

  const addPontoForte = () => {
    if (newPontoForte.trim()) {
      setFormData(prev => ({
        ...prev,
        pontos_fortes: [...prev.pontos_fortes, newPontoForte.trim()]
      }));
      setNewPontoForte('');
    }
  };

  const removePontoForte = (index) => {
    setFormData(prev => ({
      ...prev,
      pontos_fortes: prev.pontos_fortes.filter((_, i) => i !== index)
    }));
  };

  const addPontoMelhoria = () => {
    if (newPontoMelhoria.trim()) {
      setFormData(prev => ({
        ...prev,
        pontos_melhoria: [...prev.pontos_melhoria, newPontoMelhoria.trim()]
      }));
      setNewPontoMelhoria('');
    }
  };

  const removePontoMelhoria = (index) => {
    setFormData(prev => ({
      ...prev,
      pontos_melhoria: prev.pontos_melhoria.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.colaborador_id || !formData.tipo_feedback || !formData.contexto) {
      toast({ title: 'Erro', description: 'Preencha os campos obrigatórios', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        data_proximo_feedback: formData.data_proximo_feedback 
          ? formData.data_proximo_feedback.toISOString() 
          : null
      };

      let feedbackId = id;
      
      if (isEditing) {
        await updateFeedback(id, payload);
        toast({ title: 'Feedback atualizado com sucesso!' });
      } else {
        const response = await createFeedback(payload);
        feedbackId = response.data.id;
        toast({ title: 'Feedback criado com sucesso!' });
      }

      if (createPlan && planData.objetivo && planData.prazo_final) {
        await createActionPlan({
          feedback_id: feedbackId,
          objetivo: planData.objetivo,
          prazo_final: planData.prazo_final.toISOString(),
          responsavel: planData.responsavel
        });
        toast({ title: 'Plano de ação criado!' });
      }

      navigate('/feedbacks');
    } catch (error) {
      console.error('Failed to save feedback:', error);
      toast({ title: 'Erro', description: error.response?.data?.detail || 'Erro ao salvar feedback', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <Hexagon className="h-12 w-12 text-[#F59E0B] animate-pulse" />
          <p className="text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
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
          <h1 className="text-3xl font-bold text-white">
            {isEditing ? 'Editar Feedback' : 'Novo Feedback'}
          </h1>
          <p className="text-slate-400 mt-1">
            {isEditing ? 'Atualize as informações do feedback' : 'Registre um novo feedback para o colaborador'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-700/50">
            <h2 className="text-lg font-semibold text-white">Informações Básicas</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300" htmlFor="colaborador">Colaborador *</Label>
                <Select
                  value={formData.colaborador_id}
                  onValueChange={handleColaboradorChange}
                  disabled={isEditing}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white" data-testid="select-colaborador">
                    <SelectValue placeholder="Selecione o colaborador" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300" htmlFor="tipo">Tipo de Feedback *</Label>
                <Select
                  value={formData.tipo_feedback}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, tipo_feedback: v }))}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white" data-testid="select-tipo">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {FEEDBACK_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300" htmlFor="proximo">Próximo Feedback</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-slate-900 border-slate-700 text-white hover:bg-slate-800"
                    data-testid="select-proximo-feedback"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.data_proximo_feedback 
                      ? format(formData.data_proximo_feedback, "dd 'de' MMMM, yyyy", { locale: ptBR })
                      : 'Selecione a data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-700" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.data_proximo_feedback}
                    onSelect={(date) => setFormData(prev => ({ ...prev, data_proximo_feedback: date }))}
                    disabled={(date) => date < new Date()}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="confidencial"
                checked={formData.confidencial}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, confidencial: checked }))}
              />
              <Label htmlFor="confidencial" className="text-sm font-normal text-slate-300">
                Feedback confidencial (apenas gestor e colaborador podem ver)
              </Label>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-700/50">
            <h2 className="text-lg font-semibold text-white">Conteúdo do Feedback</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300" htmlFor="contexto">Contexto *</Label>
              <Textarea
                id="contexto"
                placeholder="Descreva o contexto e situação do feedback..."
                value={formData.contexto}
                onChange={(e) => setFormData(prev => ({ ...prev, contexto: e.target.value }))}
                rows={4}
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-[#F59E0B]"
                data-testid="input-contexto"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300" htmlFor="impacto">Impacto</Label>
              <Textarea
                id="impacto"
                placeholder="Descreva o impacto das ações do colaborador..."
                value={formData.impacto}
                onChange={(e) => setFormData(prev => ({ ...prev, impacto: e.target.value }))}
                rows={3}
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-[#F59E0B]"
                data-testid="input-impacto"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300" htmlFor="expectativa">Expectativa</Label>
              <Textarea
                id="expectativa"
                placeholder="Descreva as expectativas para o futuro..."
                value={formData.expectativa}
                onChange={(e) => setFormData(prev => ({ ...prev, expectativa: e.target.value }))}
                rows={3}
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-[#F59E0B]"
                data-testid="input-expectativa"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="p-6 border-b border-emerald-500/30">
              <h2 className="text-lg font-semibold text-emerald-400">Pontos Fortes</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar ponto forte..."
                  value={newPontoForte}
                  onChange={(e) => setNewPontoForte(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPontoForte())}
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                  data-testid="input-ponto-forte"
                />
                <Button 
                  type="button" 
                  size="icon" 
                  onClick={addPontoForte} 
                  className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.pontos_fortes.map((ponto, index) => (
                  <Badge
                    key={index}
                    className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 cursor-pointer"
                    onClick={() => removePontoForte(index)}
                  >
                    {ponto}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl overflow-hidden">
            <div className="p-6 border-b border-amber-500/30">
              <h2 className="text-lg font-semibold text-amber-400">Pontos de Melhoria</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar ponto de melhoria..."
                  value={newPontoMelhoria}
                  onChange={(e) => setNewPontoMelhoria(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPontoMelhoria())}
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                  data-testid="input-ponto-melhoria"
                />
                <Button 
                  type="button" 
                  size="icon" 
                  onClick={addPontoMelhoria} 
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.pontos_melhoria.map((ponto, index) => (
                  <Badge
                    key={index}
                    className="bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 cursor-pointer"
                    onClick={() => removePontoMelhoria(index)}
                  >
                    {ponto}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {!isEditing && (
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-[#F59E0B]" />
                <h2 className="text-lg font-semibold text-white">Plano de Ação</h2>
              </div>
              <Checkbox
                id="createPlan"
                checked={createPlan}
                onCheckedChange={setCreatePlan}
              />
            </div>
            {createPlan && (
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Objetivo do Plano</Label>
                  <Textarea
                    placeholder="Descreva o objetivo do plano de ação..."
                    value={planData.objetivo}
                    onChange={(e) => setPlanData(prev => ({ ...prev, objetivo: e.target.value }))}
                    rows={3}
                    className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                    data-testid="input-plan-objetivo"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Prazo Final</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start text-left font-normal bg-slate-900 border-slate-700 text-white hover:bg-slate-800"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {planData.prazo_final 
                            ? format(planData.prazo_final, "dd/MM/yyyy")
                            : 'Selecione a data'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-700" align="start">
                        <Calendar
                          mode="single"
                          selected={planData.prazo_final}
                          onSelect={(date) => setPlanData(prev => ({ ...prev, prazo_final: date }))}
                          disabled={(date) => date < new Date()}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Responsável</Label>
                    <Select
                      value={planData.responsavel}
                      onValueChange={(v) => setPlanData(prev => ({ ...prev, responsavel: v }))}
                    >
                      <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700">
                        <SelectItem value="Colaborador">Colaborador</SelectItem>
                        <SelectItem value="Gestor">Gestor</SelectItem>
                        <SelectItem value="Ambos">Ambos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold shadow-lg shadow-orange-500/20"
            data-testid="save-feedback-btn"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? 'Atualizar' : 'Criar'} Feedback
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FeedbackForm;
