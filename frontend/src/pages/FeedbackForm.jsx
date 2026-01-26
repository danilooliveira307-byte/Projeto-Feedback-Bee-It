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
  ClipboardList
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { format, addDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const FEEDBACK_TYPES = ['1:1', 'Avaliação de Desempenho', 'Coaching', 'Correção de Rota', 'Elogio'];

const FeedbackForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const { toast } = useToast();
  const [teams, setTeams] = useState([]);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
  const { toast } = useToast();
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
  const { toast } = useToast();
  const [newPontoMelhoria, setNewPontoMelhoria] = useState('');
  const { toast } = useToast();
  const [createPlan, setCreatePlan] = useState(false);
  const { toast } = useToast();
  const [planData, setPlanData] = useState({
  const { toast } = useToast();
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
    
    // Suggest next feedback date based on team frequency
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

      // Create action plan if requested
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
      toast.error(error.response?.data?.detail || 'Erro ao salvar feedback');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(30,94%,54%)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[hsl(210,54%,23%)]">
            {isEditing ? 'Editar Feedback' : 'Novo Feedback'}
          </h1>
          <p className="text-gray-500">
            {isEditing ? 'Atualize as informações do feedback' : 'Registre um novo feedback para o colaborador'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="colaborador">Colaborador *</Label>
                <Select
                  value={formData.colaborador_id}
                  onValueChange={handleColaboradorChange}
                  disabled={isEditing}
                >
                  <SelectTrigger data-testid="select-colaborador">
                    <SelectValue placeholder="Selecione o colaborador" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Feedback *</Label>
                <Select
                  value={formData.tipo_feedback}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, tipo_feedback: v }))}
                >
                  <SelectTrigger data-testid="select-tipo">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {FEEDBACK_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proximo">Próximo Feedback</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    data-testid="select-proximo-feedback"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.data_proximo_feedback 
                      ? format(formData.data_proximo_feedback, "dd 'de' MMMM, yyyy", { locale: ptBR })
                      : 'Selecione a data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
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
              <Label htmlFor="confidencial" className="text-sm font-normal">
                Feedback confidencial (apenas gestor e colaborador podem ver)
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Conteúdo do Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contexto">Contexto *</Label>
              <Textarea
                id="contexto"
                placeholder="Descreva o contexto e situação do feedback..."
                value={formData.contexto}
                onChange={(e) => setFormData(prev => ({ ...prev, contexto: e.target.value }))}
                rows={4}
                data-testid="input-contexto"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="impacto">Impacto</Label>
              <Textarea
                id="impacto"
                placeholder="Descreva o impacto das ações do colaborador..."
                value={formData.impacto}
                onChange={(e) => setFormData(prev => ({ ...prev, impacto: e.target.value }))}
                rows={3}
                data-testid="input-impacto"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectativa">Expectativa</Label>
              <Textarea
                id="expectativa"
                placeholder="Descreva as expectativas para o futuro..."
                value={formData.expectativa}
                onChange={(e) => setFormData(prev => ({ ...prev, expectativa: e.target.value }))}
                rows={3}
                data-testid="input-expectativa"
              />
            </div>
          </CardContent>
        </Card>

        {/* Points */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pontos Fortes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-green-700">Pontos Fortes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar ponto forte..."
                  value={newPontoForte}
                  onChange={(e) => setNewPontoForte(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPontoForte())}
                  data-testid="input-ponto-forte"
                />
                <Button type="button" size="icon" onClick={addPontoForte} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.pontos_fortes.map((ponto, index) => (
                  <Badge
                    key={index}
                    className="bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer"
                    onClick={() => removePontoForte(index)}
                  >
                    {ponto}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pontos de Melhoria */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-amber-700">Pontos de Melhoria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar ponto de melhoria..."
                  value={newPontoMelhoria}
                  onChange={(e) => setNewPontoMelhoria(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPontoMelhoria())}
                  data-testid="input-ponto-melhoria"
                />
                <Button type="button" size="icon" onClick={addPontoMelhoria} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.pontos_melhoria.map((ponto, index) => (
                  <Badge
                    key={index}
                    className="bg-amber-100 text-amber-700 hover:bg-amber-200 cursor-pointer"
                    onClick={() => removePontoMelhoria(index)}
                  >
                    {ponto}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Plan */}
        {!isEditing && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Plano de Ação
                </CardTitle>
                <Checkbox
                  id="createPlan"
                  checked={createPlan}
                  onCheckedChange={setCreatePlan}
                />
              </div>
            </CardHeader>
            {createPlan && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Objetivo do Plano</Label>
                  <Textarea
                    placeholder="Descreva o objetivo do plano de ação..."
                    value={planData.objetivo}
                    onChange={(e) => setPlanData(prev => ({ ...prev, objetivo: e.target.value }))}
                    rows={3}
                    data-testid="input-plan-objetivo"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Prazo Final</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {planData.prazo_final 
                            ? format(planData.prazo_final, "dd/MM/yyyy")
                            : 'Selecione a data'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
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
                    <Label>Responsável</Label>
                    <Select
                      value={planData.responsavel}
                      onValueChange={(v) => setPlanData(prev => ({ ...prev, responsavel: v }))}
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
              </CardContent>
            )}
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-[hsl(30,94%,54%)] hover:bg-[hsl(30,94%,45%)]"
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
