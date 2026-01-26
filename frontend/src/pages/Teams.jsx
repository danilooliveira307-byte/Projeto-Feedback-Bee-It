import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTeams, createTeam, updateTeam, deleteTeam } from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
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
  MoreVertical,
  Edit,
  Trash2,
  Building2,
  Calendar,
  Hexagon
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const Teams = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [teamToDelete, setTeamToDelete] = useState(null);
  
  const [formData, setFormData] = useState({
    nome: '',
    empresa: 'Bee It',
    frequencia_padrao_feedback_dias: 30,
    descricao: ''
  });

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const response = await getTeams();
      setTeams(response.data);
    } catch (error) {
      console.error('Failed to fetch teams:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar times', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (team = null) => {
    if (team) {
      setEditingTeam(team);
      setFormData({
        nome: team.nome,
        empresa: team.empresa,
        frequencia_padrao_feedback_dias: team.frequencia_padrao_feedback_dias,
        descricao: team.descricao || ''
      });
    } else {
      setEditingTeam(null);
      setFormData({
        nome: '',
        empresa: 'Bee It',
        frequencia_padrao_feedback_dias: 30,
        descricao: ''
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome) {
      toast({ title: 'Erro', description: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }

    try {
      if (editingTeam) {
        await updateTeam(editingTeam.id, formData);
        toast({ title: 'Time atualizado!' });
      } else {
        await createTeam(formData);
        toast({ title: 'Time criado!' });
      }
      setDialogOpen(false);
      fetchTeams();
    } catch (error) {
      toast({ title: 'Erro', description: error.response?.data?.detail || 'Erro ao salvar time', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!teamToDelete) return;
    try {
      await deleteTeam(teamToDelete);
      toast({ title: 'Time removido!' });
      fetchTeams();
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao remover time', variant: 'destructive' });
    } finally {
      setDeleteDialogOpen(false);
      setTeamToDelete(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="teams-page">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Times</h1>
          <p className="text-slate-400 mt-1">{teams.length} times cadastrados</p>
        </div>
        {isAdmin() && (
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold shadow-lg shadow-orange-500/20"
            data-testid="new-team-btn"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Time
          </Button>
        )}
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
              <Hexagon className="h-12 w-12 text-[#F59E0B] animate-pulse" />
              <p className="text-slate-400">Carregando times...</p>
            </div>
          </div>
        ) : teams.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Building2 className="h-12 w-12 mb-2 opacity-50" />
            <p>Nenhum time cadastrado</p>
            {isAdmin() && (
              <Button
                variant="link"
                onClick={() => handleOpenDialog()}
                className="text-[#F59E0B]"
              >
                Criar primeiro time
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700/50 hover:bg-transparent">
                <TableHead className="text-slate-400">Nome</TableHead>
                <TableHead className="text-slate-400">Empresa</TableHead>
                <TableHead className="text-slate-400">Frequência de Feedback</TableHead>
                <TableHead className="text-slate-400">Descrição</TableHead>
                {isAdmin() && <TableHead className="text-slate-400 text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TableRow 
                  key={team.id} 
                  className="border-slate-700/50 hover:bg-slate-800/50"
                  data-testid={`team-row-${team.id}`}
                >
                  <TableCell className="font-medium text-white">{team.nome}</TableCell>
                  <TableCell className="text-slate-300">{team.empresa}</TableCell>
                  <TableCell>
                    <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1 w-fit">
                      <Calendar className="h-3 w-3" />
                      A cada {team.frequencia_padrao_feedback_dias} dias
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-slate-400">
                    {team.descricao || '-'}
                  </TableCell>
                  {isAdmin() && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-700">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                          <DropdownMenuItem 
                            onClick={() => handleOpenDialog(team)}
                            className="text-slate-300 hover:text-white hover:bg-slate-700"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setTeamToDelete(team.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingTeam ? 'Editar Time' : 'Novo Time'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Nome *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome do time"
                className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 focus:border-[#F59E0B]"
                data-testid="team-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Empresa</Label>
              <Input
                value={formData.empresa}
                onChange={(e) => setFormData(prev => ({ ...prev, empresa: e.target.value }))}
                placeholder="Bee It"
                className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 focus:border-[#F59E0B]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Frequência de Feedback (dias)</Label>
              <Input
                type="number"
                min={1}
                value={formData.frequencia_padrao_feedback_dias}
                onChange={(e) => setFormData(prev => ({ ...prev, frequencia_padrao_feedback_dias: parseInt(e.target.value) || 30 }))}
                className="bg-slate-950 border-slate-700 text-white focus:border-[#F59E0B]"
                data-testid="team-frequency-input"
              />
              <p className="text-xs text-slate-500">
                Intervalo padrão entre feedbacks para colaboradores deste time
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descrição do time..."
                rows={3}
                className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 focus:border-[#F59E0B]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
              className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="bg-[#F59E0B] hover:bg-[#D97706] text-white"
              data-testid="save-team-btn"
            >
              {editingTeam ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Esta ação não pode ser desfeita. O time será removido permanentemente.
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

export default Teams;
