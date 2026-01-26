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
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  CalendarIcon,
  X
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
        return <Badge className="status-em-dia">Em dia</Badge>;
      case 'Aguardando ciência':
        return <Badge className="status-aguardando">Aguardando ciência</Badge>;
      case 'Atrasado':
        return <Badge className="status-atrasado">Atrasado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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
          <h1 className="text-2xl font-bold text-[hsl(210,54%,23%)]">
            {isColaborador() ? 'Meus Feedbacks' : 'Feedbacks'}
          </h1>
          <p className="text-gray-500">
            {feedbacks.length} feedback{feedbacks.length !== 1 ? 's' : ''} encontrado{feedbacks.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-gray-100' : ''}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          {isGestorOrAdmin() && (
            <Button
              onClick={() => navigate('/feedbacks/novo')}
              className="bg-[hsl(30,94%,54%)] hover:bg-[hsl(30,94%,45%)]"
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
        <Card className="animate-fade-in">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {isGestorOrAdmin() && (
                <div className="space-y-2">
                  <Label>Colaborador</Label>
                  <Select
                    value={filters.colaborador_id}
                    onValueChange={(v) => handleFilterChange('colaborador_id', v)}
                  >
                    <SelectTrigger data-testid="filter-colaborador">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {users.filter(u => u.papel === 'COLABORADOR').map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Time</Label>
                <Select
                  value={filters.time_id}
                  onValueChange={(v) => handleFilterChange('time_id', v)}
                >
                  <SelectTrigger data-testid="filter-time">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {teams.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={filters.tipo_feedback}
                  onValueChange={(v) => handleFilterChange('tipo_feedback', v)}
                >
                  <SelectTrigger data-testid="filter-tipo">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {FEEDBACK_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status_feedback}
                  onValueChange={(v) => handleFilterChange('status_feedback', v)}
                >
                  <SelectTrigger data-testid="filter-status">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {FEEDBACK_STATUS.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
              <Button variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Limpar
              </Button>
              <Button onClick={applyFilters} className="bg-[hsl(30,94%,54%)] hover:bg-[hsl(30,94%,45%)]">
                <Search className="h-4 w-4 mr-2" />
                Aplicar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedbacks Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(30,94%,54%)]"></div>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <p>Nenhum feedback encontrado</p>
              {isGestorOrAdmin() && (
                <Button
                  variant="link"
                  onClick={() => navigate('/feedbacks/novo')}
                  className="text-[hsl(30,94%,54%)]"
                >
                  Criar primeiro feedback
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Próximo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedbacks.map((feedback) => (
                  <TableRow key={feedback.id} data-testid={`feedback-row-${feedback.id}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{feedback.colaborador_nome}</p>
                        <p className="text-sm text-gray-500">por {feedback.gestor_nome}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{feedback.tipo_feedback}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(feedback.data_feedback)}</TableCell>
                    <TableCell>{formatDate(feedback.data_proximo_feedback)}</TableCell>
                    <TableCell>{getStatusBadge(feedback.status_feedback)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/feedbacks/${feedback.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </DropdownMenuItem>
                          {isColaborador() && !feedback.ciencia_colaborador && (
                            <DropdownMenuItem onClick={() => handleAcknowledge(feedback.id)}>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Confirmar Ciência
                            </DropdownMenuItem>
                          )}
                          {isGestorOrAdmin() && (
                            <>
                              <DropdownMenuItem onClick={() => navigate(`/feedbacks/${feedback.id}/editar`)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              {isAdmin() && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setFeedbackToDelete(feedback.id);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O feedback e seus planos de ação relacionados serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
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
