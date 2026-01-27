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
  X,
  Hexagon
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
  const { toast } = useToast();
  
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);
  
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    responsavel: ''
  });
  const [showFilters, setShowFilters] = useState(false);

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

  useEffect(() => {
    fetchPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="action-plans-page">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Planos de Ação</h1>
          <p className="text-slate-400 mt-1">
            {plans.length} plano{plans.length !== 1 ? 's' : ''} encontrado{plans.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={`bg-slate-800/50 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 ${showFilters ? 'bg-slate-700' : ''}`}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      {showFilters && (
        <div className="glass-card rounded-xl p-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Status</label>
              <Select
                value={filters.status}
                onValueChange={(v) => setFilters(prev => ({ ...prev, status: v }))}
              >
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <span className="truncate">
                    {filters.status && filters.status !== "all" ? filters.status : "Todos"}
                  </span>
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="all">Todos</SelectItem>
                  {ACTION_PLAN_STATUS.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Responsável</label>
              <Select
                value={filters.responsavel}
                onValueChange={(v) => setFilters(prev => ({ ...prev, responsavel: v }))}
              >
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <span className="truncate">
                    {filters.responsavel && filters.responsavel !== "all" ? filters.responsavel : "Todos"}
                  </span>
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="all">Todos</SelectItem>
                  {RESPONSIBLE_TYPES.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-700/50">
            <Button
              variant="outline"
              onClick={() => {
                setFilters({ status: '', responsavel: '' });
                setTimeout(fetchPlans, 0);
              }}
              className="bg-slate-800/50 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700"
            >
              <X className="h-4 w-4 mr-2" />
              Limpar
            </Button>
            <Button
              onClick={fetchPlans}
              className="bg-[#F59E0B] hover:bg-[#D97706] text-white"
            >
              Aplicar Filtros
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <Hexagon className="h-12 w-12 text-[#F59E0B] animate-pulse" />
            <p className="text-slate-400">Carregando planos...</p>
          </div>
        </div>
      ) : plans.length === 0 ? (
        <div className="glass-card rounded-xl">
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <ClipboardList className="h-12 w-12 mb-2 opacity-50" />
            <p>Nenhum plano de ação encontrado</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="glass-card rounded-xl card-hover cursor-pointer overflow-hidden"
              onClick={() => navigate(`/planos-acao/${plan.id}`)}
              data-testid={`plan-card-${plan.id}`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-base font-semibold text-white line-clamp-2">{plan.objetivo}</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                      <DropdownMenuItem 
                        key={`view-plan-${plan.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/planos-acao/${plan.id}`);
                        }}
                        className="text-slate-300 hover:text-white hover:bg-slate-700"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </DropdownMenuItem>
                      {isGestorOrAdmin() && (
                        <DropdownMenuItem
                          key={`delete-plan-${plan.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPlanToDelete(plan.id);
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
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Prazo: {formatDate(plan.prazo_final)}</span>
                    {getStatusBadge(plan.status)}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] rounded-full transition-all"
                        style={{ width: `${plan.progresso_percentual}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-white w-10 text-right">
                      {plan.progresso_percentual}%
                    </span>
                  </div>

                  <div className="text-xs text-slate-500">
                    Responsável: {plan.responsavel}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Esta ação não pode ser desfeita. O plano de ação e todos os itens relacionados serão removidos.
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

export default ActionPlans;
