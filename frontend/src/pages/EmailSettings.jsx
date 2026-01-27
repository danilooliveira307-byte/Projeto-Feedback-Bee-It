import React, { useState } from 'react';
import { useToast } from '../hooks/use-toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Mail, Send, Bell, Clock, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import api from '../lib/api';

const EmailSettings = () => {
  const { toast } = useToast();
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingNotifications, setCheckingNotifications] = useState(false);
  const [lastCheckResult, setLastCheckResult] = useState(null);

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      toast({ title: 'Erro', description: 'Digite um e-mail para teste', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      await api.post(`/notifications/send-test-email?email=${encodeURIComponent(testEmail)}`);
      toast({ title: 'Sucesso', description: `E-mail de teste enviado para ${testEmail}` });
    } catch (error) {
      const message = error.response?.data?.detail || 'Erro ao enviar e-mail';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOverdue = async () => {
    setCheckingNotifications(true);
    try {
      const response = await api.post('/notifications/check-overdue');
      setLastCheckResult(response.data.notifications_sent);
      toast({ 
        title: 'Verificação concluída', 
        description: `Feedbacks atrasados: ${response.data.notifications_sent.overdue_feedbacks}, Prazos próximos: ${response.data.notifications_sent.approaching_deadlines}`
      });
    } catch (error) {
      const message = error.response?.data?.detail || 'Erro ao verificar notificações';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
    } finally {
      setCheckingNotifications(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações de E-mail</h1>
        <p className="text-slate-400">Gerencie as notificações por e-mail do sistema</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Test Email Card */}
        <Card className="glass-card border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Mail className="h-5 w-5 text-[#F59E0B]" />
              Teste de E-mail
            </CardTitle>
            <CardDescription className="text-slate-400">
              Envie um e-mail de teste para verificar a configuração do SendGrid
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">E-mail de destino</Label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <Button 
              onClick={handleSendTestEmail} 
              disabled={loading}
              className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-black"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar E-mail de Teste
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Notifications Check Card */}
        <Card className="glass-card border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#F59E0B]" />
              Verificar Pendências
            </CardTitle>
            <CardDescription className="text-slate-400">
              Verifica feedbacks atrasados e planos com prazo próximo e envia notificações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-slate-300">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                Feedbacks com data de próximo feedback ultrapassada
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="h-4 w-4 text-yellow-400" />
                Planos de ação com prazo nos próximos 7 dias
              </div>
            </div>

            {lastCheckResult && (
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                <p className="text-sm text-slate-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  Última verificação:
                </p>
                <ul className="mt-2 text-sm space-y-1 text-slate-400">
                  <li>• Feedbacks atrasados: <span className="text-white">{lastCheckResult.overdue_feedbacks}</span></li>
                  <li>• Prazos próximos: <span className="text-white">{lastCheckResult.approaching_deadlines}</span></li>
                </ul>
              </div>
            )}

            <Button 
              onClick={handleCheckOverdue} 
              disabled={checkingNotifications}
              variant="outline"
              className="w-full border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800"
            >
              {checkingNotifications ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Verificar e Notificar
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="glass-card border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Tipos de Notificações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
              <h4 className="font-medium text-white mb-2">📬 Novo Feedback</h4>
              <p className="text-sm text-slate-400">
                Enviado automaticamente ao colaborador quando um novo feedback é criado pelo gestor.
              </p>
            </div>
            <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
              <h4 className="font-medium text-white mb-2">⚠️ Feedback Atrasado</h4>
              <p className="text-sm text-slate-400">
                Enviado ao gestor quando a data do próximo feedback já passou e ainda não foi realizado.
              </p>
            </div>
            <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
              <h4 className="font-medium text-white mb-2">📅 Prazo Próximo</h4>
              <p className="text-sm text-slate-400">
                Enviado ao responsável quando um plano de ação tem prazo nos próximos 7 dias.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailSettings;
