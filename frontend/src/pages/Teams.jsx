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
  Calendar
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
          <h1 className="text-2xl font-bold text-[hsl(210,54%,23%)]">Times</h1>
          <p className="text-gray-500">{teams.length} times cadastrados</p>
        </div>
        {isAdmin() && (
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-[hsl(30,94%,54%)] hover:bg-[hsl(30,94%,45%)]"
            data-testid="new-team-btn"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Time
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(30,94%,54%)]"></div>
            </div>
          ) : teams.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Building2 className="h-12 w-12 mb-2 opacity-50" />
              <p>Nenhum time cadastrado</p>
              {isAdmin() && (
                <Button
                  variant="link"
                  onClick={() => handleOpenDialog()}
                  className="text-[hsl(30,94%,54%)]"
                >
                  Criar primeiro time
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Frequência de Feedback</TableHead>
                  <TableHead>Descrição</TableHead>
                  {isAdmin() && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.id} data-testid={`team-row-${team.id}`}>
                    <TableCell className="font-medium">{team.nome}</TableCell>
                    <TableCell>{team.empresa}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                        <Calendar className="h-3 w-3" />
                        A cada {team.frequencia_padrao_feedback_dias} dias
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {team.descricao || '-'}
                    </TableCell>
                    {isAdmin() && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDialog(team)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setTeamToDelete(team.id);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-600"
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
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTeam ? 'Editar Time' : 'Novo Time'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome do time"
                data-testid="team-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Input
                value={formData.empresa}
                onChange={(e) => setFormData(prev => ({ ...prev, empresa: e.target.value }))}
                placeholder="Bee It"
              />
            </div>
            <div className="space-y-2">
              <Label>Frequência de Feedback (dias)</Label>
              <Input
                type="number"
                min={1}
                value={formData.frequencia_padrao_feedback_dias}
                onChange={(e) => setFormData(prev => ({ ...prev, frequencia_padrao_feedback_dias: parseInt(e.target.value) || 30 }))}
                data-testid="team-frequency-input"
              />
              <p className="text-xs text-gray-500">
                Intervalo padrão entre feedbacks para colaboradores deste time
              </p>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descrição do time..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="bg-[hsl(30,94%,54%)] hover:bg-[hsl(30,94%,45%)]"
              data-testid="save-team-btn"
            >
              {editingTeam ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O time será removido permanentemente.
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

export default Teams;
