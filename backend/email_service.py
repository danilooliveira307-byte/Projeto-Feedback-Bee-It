"""
Email service for Bee It Feedback notifications using SendGrid
"""
import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
from datetime import datetime, timedelta
from typing import Optional
import asyncio

SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'noreply@beeit.com.br')
SENDER_NAME = 'Bee It Feedback'


def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """
    Send email via SendGrid
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        html_content: HTML content of the email
    
    Returns:
        bool: True if sent successfully, False otherwise
    """
    if not SENDGRID_API_KEY:
        print("Warning: SENDGRID_API_KEY not configured. Email not sent.")
        return False
    
    try:
        message = Mail(
            from_email=Email(SENDER_EMAIL, SENDER_NAME),
            to_emails=To(to_email),
            subject=subject,
            html_content=Content("text/html", html_content)
        )
        
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        
        print(f"Email sent to {to_email}: {response.status_code}")
        return response.status_code in [200, 201, 202]
    except Exception as e:
        print(f"Error sending email to {to_email}: {str(e)}")
        return False


def get_email_header():
    """Returns the common email header with Bee It branding"""
    return """
    <div style="background-color: #0F172A; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #F59E0B; margin: 0; font-family: Arial, sans-serif;">
            🐝 Bee It Feedback
        </h1>
    </div>
    """


def get_email_footer():
    """Returns the common email footer"""
    return """
    <div style="background-color: #1E293B; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; margin-top: 20px;">
        <p style="color: #94A3B8; font-size: 12px; margin: 0; font-family: Arial, sans-serif;">
            Este e-mail foi enviado automaticamente pelo sistema Bee It Feedback.<br>
            Por favor, não responda a este e-mail.
        </p>
    </div>
    """


def send_new_feedback_notification(
    colaborador_email: str,
    colaborador_nome: str,
    gestor_nome: str,
    tipo_feedback: str,
    data_feedback: str
) -> bool:
    """
    Send notification when a new feedback is created
    
    Args:
        colaborador_email: Employee email
        colaborador_nome: Employee name
        gestor_nome: Manager name
        tipo_feedback: Type of feedback
        data_feedback: Feedback date
    """
    subject = f"🆕 Novo Feedback Registrado - {tipo_feedback}"
    
    html_content = f"""
    <html>
    <body style="margin: 0; padding: 20px; background-color: #020617; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #0F172A; border-radius: 8px; overflow: hidden;">
            {get_email_header()}
            
            <div style="padding: 30px; color: #E2E8F0;">
                <h2 style="color: #F59E0B; margin-top: 0;">Olá, {colaborador_nome}!</h2>
                
                <p>Um novo feedback foi registrado para você:</p>
                
                <div style="background-color: #1E293B; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
                    <p style="margin: 5px 0;"><strong style="color: #F59E0B;">Tipo:</strong> {tipo_feedback}</p>
                    <p style="margin: 5px 0;"><strong style="color: #F59E0B;">Gestor:</strong> {gestor_nome}</p>
                    <p style="margin: 5px 0;"><strong style="color: #F59E0B;">Data:</strong> {data_feedback}</p>
                </div>
                
                <p>Acesse o sistema para visualizar os detalhes completos e dar ciência do feedback.</p>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="#" style="background-color: #F59E0B; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                        Acessar Sistema
                    </a>
                </div>
            </div>
            
            {get_email_footer()}
        </div>
    </body>
    </html>
    """
    
    return send_email(colaborador_email, subject, html_content)


def send_overdue_feedback_notification(
    gestor_email: str,
    gestor_nome: str,
    colaborador_nome: str,
    data_prevista: str,
    dias_atraso: int
) -> bool:
    """
    Send notification when a feedback is overdue
    
    Args:
        gestor_email: Manager email
        gestor_nome: Manager name
        colaborador_nome: Employee name
        data_prevista: Expected date
        dias_atraso: Days overdue
    """
    subject = f"⚠️ Feedback Atrasado - {colaborador_nome}"
    
    html_content = f"""
    <html>
    <body style="margin: 0; padding: 20px; background-color: #020617; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #0F172A; border-radius: 8px; overflow: hidden;">
            {get_email_header()}
            
            <div style="padding: 30px; color: #E2E8F0;">
                <h2 style="color: #EF4444; margin-top: 0;">⚠️ Atenção, {gestor_nome}!</h2>
                
                <p>Existe um feedback pendente que está atrasado:</p>
                
                <div style="background-color: #1E293B; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #EF4444;">
                    <p style="margin: 5px 0;"><strong style="color: #F59E0B;">Colaborador:</strong> {colaborador_nome}</p>
                    <p style="margin: 5px 0;"><strong style="color: #F59E0B;">Data Prevista:</strong> {data_prevista}</p>
                    <p style="margin: 5px 0;"><strong style="color: #EF4444;">Dias de Atraso:</strong> {dias_atraso} dia(s)</p>
                </div>
                
                <p>Por favor, realize o feedback o mais breve possível para manter o acompanhamento adequado do colaborador.</p>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="#" style="background-color: #F59E0B; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                        Registrar Feedback
                    </a>
                </div>
            </div>
            
            {get_email_footer()}
        </div>
    </body>
    </html>
    """
    
    return send_email(gestor_email, subject, html_content)


def send_action_plan_deadline_notification(
    responsavel_email: str,
    responsavel_nome: str,
    objetivo: str,
    prazo_final: str,
    dias_restantes: int
) -> bool:
    """
    Send notification when an action plan deadline is approaching
    
    Args:
        responsavel_email: Responsible person's email
        responsavel_nome: Responsible person's name
        objetivo: Plan objective
        prazo_final: Deadline date
        dias_restantes: Days remaining
    """
    if dias_restantes <= 0:
        subject = f"🔴 Prazo Vencido - Plano de Ação"
        urgency_color = "#EF4444"
        urgency_text = f"O prazo venceu há {abs(dias_restantes)} dia(s)!"
    elif dias_restantes <= 3:
        subject = f"🟠 Prazo Próximo - Plano de Ação ({dias_restantes} dias)"
        urgency_color = "#F59E0B"
        urgency_text = f"Faltam apenas {dias_restantes} dia(s)!"
    else:
        subject = f"📅 Lembrete de Prazo - Plano de Ação ({dias_restantes} dias)"
        urgency_color = "#3B82F6"
        urgency_text = f"Faltam {dias_restantes} dia(s) para o prazo."
    
    html_content = f"""
    <html>
    <body style="margin: 0; padding: 20px; background-color: #020617; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #0F172A; border-radius: 8px; overflow: hidden;">
            {get_email_header()}
            
            <div style="padding: 30px; color: #E2E8F0;">
                <h2 style="color: {urgency_color}; margin-top: 0;">Olá, {responsavel_nome}!</h2>
                
                <p>{urgency_text}</p>
                
                <div style="background-color: #1E293B; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid {urgency_color};">
                    <p style="margin: 5px 0;"><strong style="color: #F59E0B;">Objetivo:</strong></p>
                    <p style="margin: 5px 0; color: #94A3B8;">{objetivo}</p>
                    <p style="margin: 15px 0 5px 0;"><strong style="color: #F59E0B;">Prazo Final:</strong> {prazo_final}</p>
                </div>
                
                <p>Acesse o sistema para verificar o progresso e atualizar os itens do plano.</p>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="#" style="background-color: #F59E0B; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                        Ver Plano de Ação
                    </a>
                </div>
            </div>
            
            {get_email_footer()}
        </div>
    </body>
    </html>
    """
    
    return send_email(responsavel_email, subject, html_content)


async def send_email_async(to_email: str, subject: str, html_content: str) -> bool:
    """
    Async wrapper for sending email to not block API requests
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, send_email, to_email, subject, html_content)
