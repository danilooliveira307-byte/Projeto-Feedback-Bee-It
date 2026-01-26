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
  Eye,
  Hexagon
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CollaboratorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await getCollaboratorProfile(id);
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar perfil', variant: 'destructive' });
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
      return format(parseISO(dateStr), "dd 'de' MMMM, yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <Hexagon className="h-12 w-12 text-[#F59E0B] animate-pulse" />
          <p className="text-slate-400">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const { colaborador, time, gestor, feedbacks, pontos_fortes_recorrentes, pontos_melhoria_recorrentes, planos_acao, proximo_feedback, total_feedbacks } = profile;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="collaborator-profile">
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
          <h1 className="text-2xl font-bold text-white">Perfil do Colaborador</h1>
          <p className="text-slate-400">Histórico e desenvolvimento</p>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6">
        <div className="flex items-start gap-6">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-orange-500/20">
            {colaborador.nome?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">{colaborador.nome}</h2>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-400">
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
            <p className="text-3xl font-bold text-[#F59E0B]">{total_feedbacks}</p>
            <p className="text-sm text-slate-500">feedbacks recebidos</p>
          </div>
        </div>
      </div>

      {proximo_feedback && (
        <div className="metric-card-highlight rounded-xl p-6 border-l-4 border-l-[#F59E0B]">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#F59E0B]/20">
              <Calendar className="h-6 w-6 text-[#F59E0B]" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Próximo Feedback</p>
              <p className="font-semibold text-white text-lg">{formatDate(proximo_feedback)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-6 border-b border-emerald-500/30">
            <h3 className="text-lg font-semibold text-emerald-400 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Pontos Fortes Recorrentes
            </h3>
          </div>
          <div className="p-6">
            {pontos_fortes_recorrentes?.length > 0 ? (
              <div className="space-y-3">
                {pontos_fortes_recorrentes.map(([ponto, count], index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-slate-300">{ponto}</span>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">{count}x</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Nenhum ponto forte identificado</p>
            )}
          </div>
        </div>

        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-6 border-b border-amber-500/30">
            <h3 className="text-lg font-semibold text-amber-400 flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Pontos de Melhoria Recorrentes
            </h3>
          </div>
          <div className="p-6">
            {pontos_melhoria_recorrentes?.length > 0 ? (
              <div className="space-y-3">
                {pontos_melhoria_recorrentes.map(([ponto, count], index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-slate-300">{ponto}</span>
                    <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30">{count}x</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Nenhum ponto de melhoria identificado</p>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700/50">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#F59E0B]" />
            Timeline de Feedbacks
          </h3>
        </div>
        <div className="p-6">
          {feedbacks?.length > 0 ? (
            <div className="relative">
              <div className="timeline-line"></div>
              
              <div className="space-y-6">
                {feedbacks.map((feedback, index) => (
                  <div
                    key={feedback.id}
                    className="relative pl-12 animate-slide-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="timeline-dot"></div>
                    
                    <div
                      className="glass-card rounded-xl p-4 card-hover cursor-pointer"
                      onClick={() => navigate(`/feedbacks/${feedback.id}`)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">
                              {feedback.tipo_feedback}
                            </span>
                            {getStatusBadge(feedback.status_feedback)}
                          </div>
                          <p className="text-sm text-slate-500">
                            por {feedback.gestor_nome} • {formatDate(feedback.data_feedback)}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-slate-400 line-clamp-2">{feedback.contexto}</p>
                      {(feedback.pontos_fortes?.length > 0 || feedback.pontos_melhoria?.length > 0) && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {feedback.pontos_fortes?.slice(0, 2).map((p, i) => (
                            <Badge key={i} className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs">{p}</Badge>
                          ))}
                          {feedback.pontos_melhoria?.slice(0, 2).map((p, i) => (
                            <Badge key={i} className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs">{p}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum feedback registrado</p>
            </div>
          )}
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700/50">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-[#F59E0B]" />
            Planos de Ação
          </h3>
        </div>
        <div className="p-6">
          {planos_acao?.length > 0 ? (
            <div className="space-y-4">
              {planos_acao.map((plan) => (
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollaboratorProfile;
