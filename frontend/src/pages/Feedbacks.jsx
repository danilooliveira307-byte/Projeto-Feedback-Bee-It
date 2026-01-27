import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getFeedbacks, getTeams, getUsers, deleteFeedback, acknowledgeFeedback } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  X,
  Hexagon
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const FEEDBACK_TYPES = ['1:1', 'Avaliação de Desempenho', 'Coaching', 'Correção de Rota', 'Elogio'];
const FEEDBACK_STATUS = ['Em dia', 'Aguardando ciência', 'Atrasado'];

const Feedbacks = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAdmin, isGestor, isColaborador, isGestorOrAdmin } = useAuth();
  const { toast } = useToast();
  
  const [feedbacks, setFeedbacks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    colaborador_id: '',
    gestor_id: '',
    time_id: '',
    tipo_feedback: searchParams.get('tipo') || '',
    status_feedback: searchParams.get('status') || '',
    data_inicio: '',
    data_fim: '',
    com_plano: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [feedbacksRes, teamsRes, usersRes] = await Promise.all([
        getFeedbacks(cleanFilters(filters)),
        getTeams(),
        isGestorOrAdmin() ? getUsers() : Promise.resolve({ data: [] })
      ]);
      setFeedbacks(feedbacksRes.data);
      setTeams(teamsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar feedbacks', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const cleanFilters = (filters) => {
    const cleaned = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '' && value !== 'all') {
        cleaned[key] = value;
      }
    });
    return cleaned;
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchData();
  };

  const clearFilters = () => {
    setFilters({
      colaborador_id: '',
      gestor_id: '',
      time_id: '',
      tipo_feedback: '',
      status_feedback: '',
      data_inicio: '',
      data_fim: '',
      com_plano: ''
    });
    setTimeout(fetchData, 0);
  };

  const handleDelete = async () => {
    if (!feedbackToDelete) return;
    try {
      await deleteFeedback(feedbackToDelete);
      toast({ title: 'Feedback removido com sucesso' });
      fetchData();
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao remover feedback', variant: 'destructive' });
    } finally {
      setDeleteDialogOpen(false);
      setFeedbackToDelete(null);
    }
  };

  const handleAcknowledge = async (feedbackId) => {
    try {
      await acknowledgeFeedback(feedbackId);
      toast({ title: 'Ciência confirmada!' });
      fetchData();
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao confirmar ciência', variant: 'destructive' });
    }
  };

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
    if (!dateStr) return '-';
    try {
      return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="feedbacks-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {isColaborador() ? 'Meus Feedbacks' : 'Feedbacks'}
          </h1>
          <p className="text-slate-400 mt-1">
            {feedbacks.length} feedback{feedbacks.length !== 1 ? 's' : ''} encontrado{feedbacks.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={`bg-slate-800/50 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 ${showFilters ? 'bg-slate-700' : ''}`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          {isGestorOrAdmin() && (
            <Button
              onClick={() => navigate('/feedbacks/novo')}
              className="bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold shadow-lg shadow-orange-500/20"
              data-testid="new-feedback-btn"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Feedback
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="glass-card rounded-xl p-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {isGestorOrAdmin() && (
              <div className="space-y-2">
                <Label className="text-slate-300">Colaborador</Label>
                <Select
                  value={filters.colaborador_id}
                  onValueChange={(v) => handleFilterChange('colaborador_id', v)}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white" data-testid="filter-colaborador">
                    <span className="truncate">
                      {filters.colaborador_id && filters.colaborador_id !== "all" 
                        ? users.find(u => u.id === filters.colaborador_id)?.nome || "Todos"
                        : "Todos"}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="all">Todos</SelectItem>
                    {users.filter(u => u.papel === 'COLABORADOR').map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-slate-300">Time</Label>
              <Select
                value={filters.time_id}
                onValueChange={(v) => handleFilterChange('time_id', v)}
              >
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white" data-testid="filter-time">
                  <span className="truncate">
                    {filters.time_id && filters.time_id !== "all" 
                      ? teams.find(t => t.id === filters.time_id)?.nome || "Todos"
                      : "Todos"}
                  </span>
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="all">Todos</SelectItem>
                  {teams.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Tipo</Label>
              <Select
                value={filters.tipo_feedback}
                onValueChange={(v) => handleFilterChange('tipo_feedback', v)}
              >
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white" data-testid="filter-tipo">
                  <span className="truncate">
                    {filters.tipo_feedback && filters.tipo_feedback !== "all" ? filters.tipo_feedback : "Todos"}
                  </span>
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="all">Todos</SelectItem>
                  {FEEDBACK_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Status</Label>
              <Select
                value={filters.status_feedback}
                onValueChange={(v) => handleFilterChange('status_feedback', v)}
              >
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white" data-testid="filter-status">
                  <span className="truncate">
                    {filters.status_feedback && filters.status_feedback !== "all" ? filters.status_feedback : "Todos"}
                  </span>
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="all">Todos</SelectItem>
                  {FEEDBACK_STATUS.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-700/50">
            <Button 
              variant="outline" 
              onClick={clearFilters}
              className="bg-slate-800/50 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700"
            >
              <X className="h-4 w-4 mr-2" />
              Limpar
            </Button>
            <Button 
              onClick={applyFilters} 
              className="bg-[#F59E0B] hover:bg-[#D97706] text-white"
            >
              <Search className="h-4 w-4 mr-2" />
              Aplicar Filtros
            </Button>
          </div>
        </div>
      )}

      {/* Feedbacks Table */}
      <div className="glass-card rounded-xl">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
              <Hexagon className="h-12 w-12 text-[#F59E0B] animate-pulse" />
              <p className="text-slate-400">Carregando feedbacks...</p>
            </div>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <p>Nenhum feedback encontrado</p>
            {isGestorOrAdmin() && (
              <Button
                variant="link"
                onClick={() => navigate('/feedbacks/novo')}
                className="text-[#F59E0B]"
              >
                Criar primeiro feedback
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-visible">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700/50 hover:bg-transparent">
                  <TableHead className="text-slate-400">Colaborador</TableHead>
                  <TableHead className="text-slate-400">Tipo</TableHead>
                  <TableHead className="text-slate-400">Data</TableHead>
                  <TableHead className="text-slate-400">Próximo</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedbacks.map((feedback) => (
                  <TableRow 
                    key={feedback.id} 
                    className="border-slate-700/50 hover:bg-slate-800/50"
                    data-testid={`feedback-row-${feedback.id}`}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-white">{feedback.colaborador_nome}</p>
                        <p className="text-sm text-slate-500">por {feedback.gestor_nome}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-slate-700 text-slate-300">{feedback.tipo_feedback}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-300">{formatDate(feedback.data_feedback)}</TableCell>
                    <TableCell className="text-slate-300">{formatDate(feedback.data_proximo_feedback)}</TableCell>
                    <TableCell>{getStatusBadge(feedback.status_feedback)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-700">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                          <DropdownMenuItem 
                            key={`view-${feedback.id}`}
                            onClick={() => navigate(`/feedbacks/${feedback.id}`)}
                            className="text-slate-300 hover:text-white hover:bg-slate-700"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </DropdownMenuItem>
                          {isColaborador() && !feedback.ciencia_colaborador && (
                            <DropdownMenuItem 
                              key={`ack-${feedback.id}`}
                              onClick={() => handleAcknowledge(feedback.id)}
                              className="text-slate-300 hover:text-white hover:bg-slate-700"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Confirmar Ciência
                            </DropdownMenuItem>
                          )}
                          {isGestorOrAdmin() && (
                            <DropdownMenuItem 
                              key={`edit-${feedback.id}`}
                              onClick={() => navigate(`/feedbacks/${feedback.id}/editar`)}
                              className="text-slate-300 hover:text-white hover:bg-slate-700"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                          )}
                          {isAdmin() && (
                            <DropdownMenuItem
                              key={`delete-${feedback.id}`}
                              onClick={() => {
                                setFeedbackToDelete(feedback.id);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Esta ação não pode ser desfeita. O feedback e seus planos de ação relacionados serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Feedbacks;
