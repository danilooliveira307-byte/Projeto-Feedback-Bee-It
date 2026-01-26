import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { seedData } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Loader2, Mail, Lock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_perftracker-9/artifacts/tf78nmcp_image.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [seeding, setSeeding] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.detail || 'Erro ao fazer login. Verifique suas credenciais.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const response = await seedData();
      const data = response.data;
      
      if (data.already_exists) {
        toast.info('Dados de demonstração já existem!');
      } else {
        toast.success('Dados de demonstração criados!');
      }
      
      setError('');
      // Show demo credentials as separate toasts
      toast.info('Admin: admin@beeit.com.br / admin123', { duration: 10000 });
      toast.info('Gestor: gestor@beeit.com.br / gestor123', { duration: 10000 });
      toast.info('Colaborador: colaborador@beeit.com.br / colab123', { duration: 10000 });
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.detail || 'Erro ao criar dados de demonstração';
      toast.error(message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen hex-pattern flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl animate-fade-in">
        <CardContent className="p-8">
          <div className="flex flex-col items-center mb-8">
            <img
              src={LOGO_URL}
              alt="Bee It"
              className="h-16 object-contain mb-4"
              data-testid="login-logo"
            />
            <h1 className="text-2xl font-bold text-[hsl(210,54%,23%)]">Bee It Feedback</h1>
            <p className="text-sm text-gray-500 mt-1">Integração única. De ponta a ponta.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div 
                className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-fade-in"
                data-testid="login-error-message"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-[hsl(210,25%,97%)] border-[hsl(210,20%,90%)] focus:border-[hsl(30,94%,54%)] focus:ring-[hsl(30,94%,54%,0.2)]"
                  required
                  data-testid="login-email-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-[hsl(210,25%,97%)] border-[hsl(210,20%,90%)] focus:border-[hsl(30,94%,54%)] focus:ring-[hsl(30,94%,54%,0.2)]"
                  required
                  data-testid="login-password-input"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[hsl(30,94%,54%)] hover:bg-[hsl(30,94%,45%)] text-white font-medium py-2.5"
              data-testid="login-submit-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-500 text-center mb-3">
              Primeiro acesso? Crie dados de demonstração:
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleSeedData}
              disabled={seeding}
              className="w-full"
              data-testid="seed-data-btn"
            >
              {seeding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Dados de Demonstração'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
