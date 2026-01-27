import React, { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Loader2, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_beeitfeedback/artifacts/g76gq8ss_Usar_em_Fundo_Azul.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated } = useAuth();
  const { toast } = useToast();
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
      toast({ title: 'Login realizado com sucesso!' });
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      const message = err.response?.data?.detail || 'Erro ao fazer login. Verifique suas credenciais.';
      // Use flushSync to force immediate re-render with error state
      flushSync(() => {
        setLoading(false);
        setError(message);
      });
      toast({ title: 'Erro', description: message, variant: 'destructive' });
      return;
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 hex-pattern relative overflow-hidden">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#020617]/90 via-[#0F172A]/80 to-[#020617]/90" />
        
        {/* Orange glow effect */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#F59E0B]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-[#F59E0B]/10 rounded-full blur-3xl" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-12 lg:p-16">
          <div className="mb-8">
            <img 
              src={LOGO_URL} 
              alt="Bee It" 
              className="h-20 object-contain mb-4"
              data-testid="login-logo"
            />
            <p className="text-[#F59E0B] font-medium text-lg">Feedback</p>
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
            Gestão de <br />
            <span className="text-[#F59E0B]">Feedbacks</span> <br />
            Corporativos
          </h2>
          
          <p className="text-slate-400 text-lg max-w-md mb-8">
            Centralize feedbacks, acompanhe o desenvolvimento da sua equipe e impulsione resultados com nossa plataforma integrada.
          </p>

          {/* Features list */}
          <div className="space-y-4">
            {[
              'Acompanhamento de desempenho em tempo real',
              'Planos de ação personalizados',
              'Dashboards por papel de usuário',
              'Notificações e alertas automáticos'
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-[#F59E0B]" />
                <span className="text-slate-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center justify-center mb-10 lg:hidden">
            <img 
              src={LOGO_URL} 
              alt="Bee It" 
              className="h-14 object-contain"
            />
          </div>

          <div className="glass-card rounded-2xl p-8 animate-fade-in">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">Bem-vindo de volta</h3>
              <p className="text-slate-400">Entre com suas credenciais para continuar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div 
                  className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm animate-fade-in"
                  data-testid="login-error-message"
                >
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-12 bg-[#0F172A] border-slate-700 text-white placeholder:text-slate-500 focus:border-[#F59E0B] focus:ring-[#F59E0B]/20 rounded-xl"
                    required
                    data-testid="login-email-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 h-12 bg-[#0F172A] border-slate-700 text-white placeholder:text-slate-500 focus:border-[#F59E0B] focus:ring-[#F59E0B]/20 rounded-xl"
                    required
                    data-testid="login-password-input"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition-all duration-200 hover:-translate-y-0.5"
                data-testid="login-submit-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    Entrar
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
