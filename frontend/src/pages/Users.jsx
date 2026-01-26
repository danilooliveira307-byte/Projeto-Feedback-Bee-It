import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUsers, getTeams, createUser, updateUser, deleteUser } from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
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
import { Switch } from '../components/ui/switch';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Users as UsersIcon,
  Eye,
  Hexagon
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const ROLES = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'GESTOR', label: 'Gestor' },
  { value: 'COLABORADOR', label: 'Colaborador' }
];

const Users = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [gestores, setGestores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    papel: 'COLABORADOR',
    time_id: '',
    gestor_direto_id: '',
    ativo: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, teamsRes] = await Promise.all([
        getUsers(),
        getTeams()
      ]);
      setUsers(usersRes.data);
      setTeams(teamsRes.data);
      setGestores(usersRes.data.filter(u => u.papel === 'GESTOR' || u.papel === 'ADMIN'));
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar usuários', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        nome: user.nome,
        email: user.email,
        password: '',
        papel: user.papel,
        time_id: user.time_id || '',
        gestor_direto_id: user.gestor_direto_id || '',
        ativo: user.ativo
      });
    } else {
      setEditingUser(null);
      setFormData({
        nome: '',
        email: '',
        password: '',
        papel: 'COLABORADOR',
        time_id: '',
        gestor_direto_id: '',
        ativo: true
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.email) {
      toast({ title: 'Erro', description: 'Preencha os campos obrigatórios', variant: 'destructive' });
      return;
    }

    if (!editingUser && !formData.password) {
      toast({ title: 'Erro', description: 'Senha é obrigatória para novos usuários', variant: 'destructive' });
      return;
    }

    try {
      if (editingUser) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        if (!updateData.time_id) updateData.time_id = null;
        if (!updateData.gestor_direto_id) updateData.gestor_direto_id = null;
        
        await updateUser(editingUser.id, updateData);
        toast({ title: 'Usuário atualizado!' });
      } else {
        const createData = { ...formData };
        if (!createData.time_id) delete createData.time_id;
        if (!createData.gestor_direto_id) delete createData.gestor_direto_id;
        
        await createUser(createData);
        toast({ title: 'Usuário criado!' });
      }
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      toast({ title: 'Erro', description: error.response?.data?.detail || 'Erro ao salvar usuário', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser(userToDelete);
      toast({ title: 'Usuário removido!' });
      fetchData();
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao remover usuário', variant: 'destructive' });
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const getRoleBadge = (papel) => {
    switch (papel) {
      case 'ADMIN':
        return <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30">Admin</Badge>;
      case 'GESTOR':
        return <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30">Gestor</Badge>;
      default:
        return <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Colaborador</Badge>;
    }
  };

  const getTeamName = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    return team?.nome || '-';
  };

  const filteredUsers = users.filter(u =>
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in" data-testid="users-page">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Usuários</h1>
          <p className="text-slate-400 mt-1">{users.length} usuários cadastrados</p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold shadow-lg shadow-orange-500/20"
          data-testid="new-user-btn"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <div className="glass-card rounded-xl p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-[#F59E0B]"
            data-testid="search-users-input"
          />
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
              <Hexagon className="h-12 w-12 text-[#F59E0B] animate-pulse" />
              <p className="text-slate-400">Carregando usuários...</p>
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <UsersIcon className="h-12 w-12 mb-2 opacity-50" />
            <p>Nenhum usuário encontrado</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700/50 hover:bg-transparent">
                <TableHead className="text-slate-400">Nome</TableHead>
                <TableHead className="text-slate-400">Email</TableHead>
                <TableHead className="text-slate-400">Papel</TableHead>
                <TableHead className="text-slate-400">Time</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow 
                  key={user.id} 
                  className="border-slate-700/50 hover:bg-slate-800/50"
                  data-testid={`user-row-${user.id}`}
                >
                  <TableCell className="font-medium text-white">{user.nome}</TableCell>
                  <TableCell className="text-slate-300">{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.papel)}</TableCell>
                  <TableCell className="text-slate-300">{getTeamName(user.time_id)}</TableCell>
                  <TableCell>
                    <Badge className={user.ativo 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-slate-700 text-slate-400'
                    }>
                      {user.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-700">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                        {user.papel === 'COLABORADOR' && (
                          <DropdownMenuItem 
                            onClick={() => navigate(`/perfil/${user.id}`)}
                            className="text-slate-300 hover:text-white hover:bg-slate-700"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Perfil
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleOpenDialog(user)}
                          className="text-slate-300 hover:text-white hover:bg-slate-700"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        {user.id !== currentUser?.id && (
                          <DropdownMenuItem
                            onClick={() => {
                              setUserToDelete(user.id);
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
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Nome *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome completo"
                className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 focus:border-[#F59E0B]"
                data-testid="user-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@beeit.com.br"
                className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 focus:border-[#F59E0B]"
                data-testid="user-email-input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">{editingUser ? 'Nova Senha (opcional)' : 'Senha *'}</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
                className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 focus:border-[#F59E0B]"
                data-testid="user-password-input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Papel</Label>
              <Select
                value={formData.papel}
                onValueChange={(v) => setFormData(prev => ({ ...prev, papel: v }))}
              >
                <SelectTrigger className="bg-slate-950 border-slate-700 text-white" data-testid="user-role-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {ROLES.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Time</Label>
              <Select
                value={formData.time_id}
                onValueChange={(v) => setFormData(prev => ({ ...prev, time_id: v }))}
              >
                <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                  <SelectValue placeholder="Selecione um time" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="">Nenhum</SelectItem>
                  {teams.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.papel === 'COLABORADOR' && (
              <div className="space-y-2">
                <Label className="text-slate-300">Gestor Direto</Label>
                <Select
                  value={formData.gestor_direto_id}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, gestor_direto_id: v }))}
                >
                  <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                    <SelectValue placeholder="Selecione o gestor" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="">Nenhum</SelectItem>
                    {gestores.map(g => (
                      <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center justify-between">
              <Label className="text-slate-300">Usuário Ativo</Label>
              <Switch
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
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
              data-testid="save-user-btn"
            >
              {editingUser ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Esta ação não pode ser desfeita. O usuário será removido permanentemente do sistema.
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

export default Users;
