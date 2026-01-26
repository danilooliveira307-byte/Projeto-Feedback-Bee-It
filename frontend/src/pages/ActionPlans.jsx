import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getActionPlans, deleteActionPlan } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
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
  Filter,
  MoreVertical,
  Eye,
  Trash2,
  ClipboardList,
  X
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ACTION_PLAN_STATUS = ['Não iniciado', 'Em andamento', 'Concluído', 'Atrasado'];
const RESPONSIBLE_TYPES = ['Colaborador', 'Gestor', 'Ambos'];

const ActionPlans = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isGestorOrAdmin } = useAuth();
  
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);
  
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    responsavel: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status && filters.status !== 'all') params.status = filters.status;
      if (filters.responsavel && filters.responsavel !== 'all') params.responsavel = filters.responsavel;
      
      const response = await getActionPlans(params);
      setPlans(response.data);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar planos de ação', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!planToDelete) return;
    try {
      await deleteActionPlan(planToDelete);
      toast({ title: 'Plano removido com sucesso' });
      fetchPlans();
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao remover plano', variant: 'destructive' });
    } finally {
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
    }
  };

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
    <div className="space-y-6 animate-fade-in" data-testid="action-plans-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(210,54%,23%)]">Planos de Ação</h1>
          <p className="text-gray-500">
            {plans.length} plano{plans.length !== 1 ? 's' : ''} encontrado{plans.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? 'bg-gray-100' : ''}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="animate-fade-in">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={filters.status}
                  onValueChange={(v) => setFilters(prev => ({ ...prev, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {ACTION_PLAN_STATUS.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Responsável</label>
                <Select
                  value={filters.responsavel}
                  onValueChange={(v) => setFilters(prev => ({ ...prev, responsavel: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {RESPONSIBLE_TYPES.map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({ status: '', responsavel: '' });
                  setTimeout(fetchPlans, 0);
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Limpar
              </Button>
              <Button
                onClick={fetchPlans}
                className="bg-[hsl(30,94%,54%)] hover:bg-[hsl(30,94%,45%)]"
              >
                Aplicar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(30,94%,54%)]"></div>
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 text-gray-500">
            <ClipboardList className="h-12 w-12 mb-2 opacity-50" />
            <p>Nenhum plano de ação encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className="card-hover cursor-pointer"
              onClick={() => navigate(`/planos-acao/${plan.id}`)}
              data-testid={`plan-card-${plan.id}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base line-clamp-2">{plan.objetivo}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/planos-acao/${plan.id}`);
                      }}>
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </DropdownMenuItem>
                      {isGestorOrAdmin() && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setPlanToDelete(plan.id);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Prazo: {formatDate(plan.prazo_final)}</span>
                    {getStatusBadge(plan.status)}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Progress value={plan.progresso_percentual} className="flex-1 h-2" />
                    <span className="text-sm font-medium w-10 text-right">
                      {plan.progresso_percentual}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Responsável: {plan.responsavel}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O plano de ação e todos os itens relacionados serão removidos.
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

export default ActionPlans;
