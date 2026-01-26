import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUsers } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  Search,
  Users as UsersIcon,
  Eye,
  MessageSquare,
  Mail
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const Collaborators = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCollaborators();
  }, []);

  const fetchCollaborators = async () => {
    setLoading(true);
    try {
      const response = await getUsers({ papel: 'COLABORADOR' });
      // Filter to show only collaborators managed by current user
      const filtered = response.data.filter(u => u.gestor_direto_id === user?.id);
      setCollaborators(filtered);
    } catch (error) {
      console.error('Failed to fetch collaborators:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar colaboradores', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filteredCollaborators = collaborators.filter(c =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in" data-testid="collaborators-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(210,54%,23%)]">Meus Colaboradores</h1>
          <p className="text-gray-500">{collaborators.length} colaboradores</p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Collaborators Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(30,94%,54%)]"></div>
        </div>
      ) : filteredCollaborators.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 text-gray-500">
            <UsersIcon className="h-12 w-12 mb-2 opacity-50" />
            <p>Nenhum colaborador encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCollaborators.map((collaborator) => (
            <Card
              key={collaborator.id}
              className="card-hover cursor-pointer"
              onClick={() => navigate(`/perfil/${collaborator.id}`)}
              data-testid={`collaborator-card-${collaborator.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-[hsl(210,54%,23%)] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {collaborator.nome?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[hsl(210,54%,23%)] truncate">
                      {collaborator.nome}
                    </h3>
                    <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {collaborator.email}
                    </p>
                    <Badge
                      variant={collaborator.ativo ? 'default' : 'secondary'}
                      className="mt-2"
                    >
                      {collaborator.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/perfil/${collaborator.id}`);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver Perfil
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-[hsl(30,94%,54%)] hover:bg-[hsl(30,94%,45%)]"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/feedbacks/novo?colaborador=${collaborator.id}`);
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Feedback
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Collaborators;
