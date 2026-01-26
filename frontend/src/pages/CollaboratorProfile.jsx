import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getCollaboratorProfile } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import {
  ArrowLeft,
  User,
  Building2,
  Mail,
  Calendar,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  ClipboardList,
  Eye
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CollaboratorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await getCollaboratorProfile(id);
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast.error('Erro ao carregar perfil');
      navigate(-1);
    } finally {
      setLoading(false);
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
      return format(parseISO(dateStr), "dd 'de' MMMM, yyyy", { locale: ptBR });
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

  if (!profile) {
    return null;
  }

  const { colaborador, time, gestor, feedbacks, pontos_fortes_recorrentes, pontos_melhoria_recorrentes, planos_acao, proximo_feedback, total_feedbacks } = profile;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="collaborator-profile">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[hsl(210,54%,23%)]">Perfil do Colaborador</h1>
          <p className="text-gray-500">Histórico e desenvolvimento</p>
        </div>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="h-20 w-20 rounded-full bg-[hsl(210,54%,23%)] flex items-center justify-center text-white text-3xl font-bold">
              {colaborador.nome?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-[hsl(210,54%,23%)]">{colaborador.nome}</h2>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {colaborador.email}
                </span>
                {time && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {time.nome}
                  </span>
                )}
                {gestor && (
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Gestor: {gestor.nome}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-[hsl(30,94%,54%)]">{total_feedbacks}</p>
              <p className="text-sm text-gray-500">feedbacks recebidos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Feedback */}
      {proximo_feedback && (
        <Card className="border-l-4 border-l-[hsl(30,94%,54%)]">
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="h-5 w-5 text-[hsl(30,94%,54%)]" />
            <div>
              <p className="text-sm text-gray-500">Próximo Feedback</p>
              <p className="font-semibold text-[hsl(210,54%,23%)]">{formatDate(proximo_feedback)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recurring Points */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pontos Fortes Recorrentes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-green-700">
              <TrendingUp className="h-5 w-5" />
              Pontos Fortes Recorrentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pontos_fortes_recorrentes?.length > 0 ? (
              <div className="space-y-3">
                {pontos_fortes_recorrentes.map(([ponto, count], index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-700">{ponto}</span>
                    <Badge className="bg-green-100 text-green-700">{count}x</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Nenhum ponto forte identificado</p>
            )}
          </CardContent>
        </Card>

        {/* Pontos de Melhoria Recorrentes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-amber-700">
              <TrendingDown className="h-5 w-5" />
              Pontos de Melhoria Recorrentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pontos_melhoria_recorrentes?.length > 0 ? (
              <div className="space-y-3">
                {pontos_melhoria_recorrentes.map(([ponto, count], index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-700">{ponto}</span>
                    <Badge className="bg-amber-100 text-amber-700">{count}x</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Nenhum ponto de melhoria identificado</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feedbacks Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Timeline de Feedbacks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {feedbacks?.length > 0 ? (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[hsl(30,94%,54%)] to-[hsl(210,54%,30%)]"></div>
              
              <div className="space-y-6">
                {feedbacks.map((feedback, index) => (
                  <div
                    key={feedback.id}
                    className="relative pl-12 animate-slide-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Timeline dot */}
                    <div className="absolute left-0 w-8 h-8 rounded-full bg-[hsl(30,94%,54%)] flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-white" />
                    </div>
                    
                    <Card
                      className="card-hover cursor-pointer"
                      onClick={() => navigate(`/feedbacks/${feedback.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-[hsl(210,54%,23%)]">
                                {feedback.tipo_feedback}
                              </span>
                              {getStatusBadge(feedback.status_feedback)}
                            </div>
                            <p className="text-sm text-gray-500">
                              por {feedback.gestor_nome} • {formatDate(feedback.data_feedback)}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{feedback.contexto}</p>
                        {(feedback.pontos_fortes?.length > 0 || feedback.pontos_melhoria?.length > 0) && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {feedback.pontos_fortes?.slice(0, 2).map((p, i) => (
                              <Badge key={i} className="bg-green-100 text-green-700 text-xs">{p}</Badge>
                            ))}
                            {feedback.pontos_melhoria?.slice(0, 2).map((p, i) => (
                              <Badge key={i} className="bg-amber-100 text-amber-700 text-xs">{p}</Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum feedback registrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Plans */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Planos de Ação
          </CardTitle>
        </CardHeader>
        <CardContent>
          {planos_acao?.length > 0 ? (
            <div className="space-y-4">
              {planos_acao.map((plan) => (
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CollaboratorProfile;
