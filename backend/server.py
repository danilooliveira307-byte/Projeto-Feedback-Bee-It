from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'bee-it-feedback-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="Bee It Feedback API")

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer()

# ==================== ENUMS & CONSTANTS ====================
ROLES = ["ADMIN", "GESTOR", "COLABORADOR"]
FEEDBACK_TYPES = ["1:1", "Avaliação de Desempenho", "Coaching", "Correção de Rota", "Elogio"]
FEEDBACK_STATUS = ["Em dia", "Aguardando ciência", "Atrasado"]
ACTION_PLAN_STATUS = ["Não iniciado", "Em andamento", "Concluído", "Atrasado"]
RESPONSIBLE_TYPES = ["Colaborador", "Gestor", "Ambos"]
PROGRESS_TYPES = ["Ruim", "Regular", "Bom"]

# ==================== MODELS ====================

# Auth Models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

# User Models
class UserCreate(BaseModel):
    nome: str
    email: EmailStr
    password: str
    papel: str = "COLABORADOR"
    time_id: Optional[str] = None
    gestor_direto_id: Optional[str] = None
    ativo: bool = True

class UserUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[EmailStr] = None
    papel: Optional[str] = None
    time_id: Optional[str] = None
    gestor_direto_id: Optional[str] = None
    ativo: Optional[bool] = None

class UserResponse(BaseModel):
    id: str
    nome: str
    email: str
    papel: str
    time_id: Optional[str] = None
    gestor_direto_id: Optional[str] = None
    ativo: bool
    criado_em: str

# Team Models
class TeamCreate(BaseModel):
    nome: str
    empresa: str = "Bee It"
    frequencia_padrao_feedback_dias: int = 30
    descricao: Optional[str] = None

class TeamUpdate(BaseModel):
    nome: Optional[str] = None
    empresa: Optional[str] = None
    frequencia_padrao_feedback_dias: Optional[int] = None
    descricao: Optional[str] = None

class TeamResponse(BaseModel):
    id: str
    nome: str
    empresa: str
    frequencia_padrao_feedback_dias: int
    descricao: Optional[str] = None
    criado_em: str

# Feedback Models
class FeedbackCreate(BaseModel):
    colaborador_id: str
    tipo_feedback: str
    contexto: str
    impacto: str
    expectativa: str
    pontos_fortes: List[str] = []
    pontos_melhoria: List[str] = []
    data_proximo_feedback: Optional[str] = None
    confidencial: bool = False

class FeedbackUpdate(BaseModel):
    tipo_feedback: Optional[str] = None
    contexto: Optional[str] = None
    impacto: Optional[str] = None
    expectativa: Optional[str] = None
    pontos_fortes: Optional[List[str]] = None
    pontos_melhoria: Optional[List[str]] = None
    data_proximo_feedback: Optional[str] = None
    status_feedback: Optional[str] = None
    confidencial: Optional[bool] = None

class FeedbackResponse(BaseModel):
    id: str
    colaborador_id: str
    colaborador_nome: Optional[str] = None
    gestor_id: str
    gestor_nome: Optional[str] = None
    data_feedback: str
    tipo_feedback: str
    contexto: str
    impacto: str
    expectativa: str
    pontos_fortes: List[str]
    pontos_melhoria: List[str]
    data_proximo_feedback: Optional[str] = None
    status_feedback: str
    ciencia_colaborador: bool
    data_ciencia: Optional[str] = None
    confidencial: bool
    criado_em: str

# Action Plan Models
class ActionPlanCreate(BaseModel):
    feedback_id: str
    objetivo: str
    prazo_final: str
    responsavel: str = "Colaborador"

class ActionPlanUpdate(BaseModel):
    objetivo: Optional[str] = None
    prazo_final: Optional[str] = None
    responsavel: Optional[str] = None
    status: Optional[str] = None

class ActionPlanResponse(BaseModel):
    id: str
    feedback_id: str
    objetivo: str
    prazo_final: str
    responsavel: str
    status: str
    progresso_percentual: int
    criado_em: str

# Action Plan Item Models
class ActionPlanItemCreate(BaseModel):
    plano_de_acao_id: str
    descricao: str
    prazo_item: Optional[str] = None

class ActionPlanItemUpdate(BaseModel):
    descricao: Optional[str] = None
    prazo_item: Optional[str] = None
    concluido: Optional[bool] = None

class ActionPlanItemResponse(BaseModel):
    id: str
    plano_de_acao_id: str
    descricao: str
    prazo_item: Optional[str] = None
    concluido: bool

# Check-in Models
class CheckInCreate(BaseModel):
    plano_de_acao_id: str
    progresso: str
    comentario: str

class CheckInResponse(BaseModel):
    id: str
    plano_de_acao_id: str
    data_checkin: str
    progresso: str
    comentario: str
    registrado_por_id: str
    registrado_por_nome: Optional[str] = None

# Notification Models
class NotificationResponse(BaseModel):
    id: str
    usuario_id: str
    tipo: str
    titulo: str
    mensagem: str
    lida: bool
    criado_em: str

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, papel: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "user_id": user_id,
        "email": email,
        "papel": papel,
        "exp": expiration
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.usuarios.find_one({"id": payload["user_id"]}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Usuário não encontrado")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user["papel"] != "ADMIN":
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas administradores.")
    return user

async def require_gestor_or_admin(user: dict = Depends(get_current_user)) -> dict:
    if user["papel"] not in ["ADMIN", "GESTOR"]:
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas gestores ou administradores.")
    return user

async def create_notification(usuario_id: str, tipo: str, titulo: str, mensagem: str):
    notification = {
        "id": str(uuid.uuid4()),
        "usuario_id": usuario_id,
        "tipo": tipo,
        "titulo": titulo,
        "mensagem": mensagem,
        "lida": False,
        "criado_em": datetime.now(timezone.utc).isoformat()
    }
    await db.notificacoes.insert_one(notification)

async def update_feedback_status(feedback_id: str):
    """Update feedback status based on acknowledgment and dates"""
    feedback = await db.feedbacks.find_one({"id": feedback_id}, {"_id": 0})
    if not feedback:
        return
    
    new_status = feedback.get("status_feedback", "Em dia")
    
    if feedback.get("ciencia_colaborador"):
        new_status = "Em dia"
    elif feedback.get("data_proximo_feedback"):
        try:
            proximo = datetime.fromisoformat(feedback["data_proximo_feedback"].replace("Z", "+00:00"))
            if proximo.replace(tzinfo=None) < datetime.now():
                new_status = "Atrasado"
            else:
                new_status = "Aguardando ciência"
        except:
            new_status = "Aguardando ciência"
    else:
        new_status = "Aguardando ciência"
    
    await db.feedbacks.update_one({"id": feedback_id}, {"$set": {"status_feedback": new_status}})

async def update_action_plan_progress(plano_id: str):
    """Calculate and update action plan progress based on items"""
    items = await db.itens_plano.find({"plano_de_acao_id": plano_id}, {"_id": 0}).to_list(100)
    if not items:
        return
    
    total = len(items)
    concluidos = sum(1 for item in items if item.get("concluido"))
    progresso = int((concluidos / total) * 100) if total > 0 else 0
    
    # Update status
    plano = await db.planos_acao.find_one({"id": plano_id}, {"_id": 0})
    if not plano:
        return
    
    new_status = plano.get("status", "Não iniciado")
    
    if progresso == 100:
        new_status = "Concluído"
    elif progresso > 0:
        new_status = "Em andamento"
    
    # Check if deadline passed
    if plano.get("prazo_final"):
        try:
            prazo = datetime.fromisoformat(plano["prazo_final"].replace("Z", "+00:00"))
            if prazo.replace(tzinfo=None) < datetime.now() and new_status != "Concluído":
                new_status = "Atrasado"
        except:
            pass
    
    await db.planos_acao.update_one(
        {"id": plano_id}, 
        {"$set": {"progresso_percentual": progresso, "status": new_status}}
    )

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    user = await db.usuarios.find_one({"email": request.email}, {"_id": 0})
    if not user or not verify_password(request.password, user["password"]):
        raise HTTPException(status_code=401, detail="Email ou senha inválidos")
    
    if not user.get("ativo", True):
        raise HTTPException(status_code=401, detail="Usuário desativado")
    
    token = create_token(user["id"], user["email"], user["papel"])
    
    user_response = {k: v for k, v in user.items() if k != "password"}
    
    return TokenResponse(access_token=token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(**user)

# ==================== USER ENDPOINTS ====================

@api_router.post("/users", response_model=UserResponse)
async def create_user(user_data: UserCreate, admin: dict = Depends(require_admin)):
    # Check if email already exists
    existing = await db.usuarios.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    user = {
        "id": str(uuid.uuid4()),
        "nome": user_data.nome,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "papel": user_data.papel,
        "time_id": user_data.time_id,
        "gestor_direto_id": user_data.gestor_direto_id,
        "ativo": user_data.ativo,
        "criado_em": datetime.now(timezone.utc).isoformat()
    }
    
    await db.usuarios.insert_one(user)
    del user["password"]
    del user["_id"]
    
    return UserResponse(**user)

@api_router.get("/users", response_model=List[UserResponse])
async def list_users(
    papel: Optional[str] = None,
    time_id: Optional[str] = None,
    ativo: Optional[bool] = None,
    user: dict = Depends(get_current_user)
):
    query = {}
    if papel:
        query["papel"] = papel
    if time_id:
        query["time_id"] = time_id
    if ativo is not None:
        query["ativo"] = ativo
    
    users = await db.usuarios.find(query, {"_id": 0, "password": 0}).to_list(1000)
    return [UserResponse(**u) for u in users]

@api_router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, user: dict = Depends(get_current_user)):
    found = await db.usuarios.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not found:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return UserResponse(**found)

@api_router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, user_data: UserUpdate, admin: dict = Depends(require_admin)):
    update_dict = {k: v for k, v in user_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")
    
    result = await db.usuarios.update_one({"id": user_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    updated = await db.usuarios.find_one({"id": user_id}, {"_id": 0, "password": 0})
    return UserResponse(**updated)

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin: dict = Depends(require_admin)):
    result = await db.usuarios.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return {"message": "Usuário removido com sucesso"}

# ==================== TEAM ENDPOINTS ====================

@api_router.post("/teams", response_model=TeamResponse)
async def create_team(team_data: TeamCreate, admin: dict = Depends(require_admin)):
    team = {
        "id": str(uuid.uuid4()),
        "nome": team_data.nome,
        "empresa": team_data.empresa,
        "frequencia_padrao_feedback_dias": team_data.frequencia_padrao_feedback_dias,
        "descricao": team_data.descricao,
        "criado_em": datetime.now(timezone.utc).isoformat()
    }
    
    await db.times.insert_one(team)
    del team["_id"]
    
    return TeamResponse(**team)

@api_router.get("/teams", response_model=List[TeamResponse])
async def list_teams(user: dict = Depends(get_current_user)):
    teams = await db.times.find({}, {"_id": 0}).to_list(100)
    return [TeamResponse(**t) for t in teams]

@api_router.get("/teams/{team_id}", response_model=TeamResponse)
async def get_team(team_id: str, user: dict = Depends(get_current_user)):
    team = await db.times.find_one({"id": team_id}, {"_id": 0})
    if not team:
        raise HTTPException(status_code=404, detail="Time não encontrado")
    return TeamResponse(**team)

@api_router.put("/teams/{team_id}", response_model=TeamResponse)
async def update_team(team_id: str, team_data: TeamUpdate, admin: dict = Depends(require_admin)):
    update_dict = {k: v for k, v in team_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")
    
    result = await db.times.update_one({"id": team_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Time não encontrado")
    
    updated = await db.times.find_one({"id": team_id}, {"_id": 0})
    return TeamResponse(**updated)

@api_router.delete("/teams/{team_id}")
async def delete_team(team_id: str, admin: dict = Depends(require_admin)):
    result = await db.times.delete_one({"id": team_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Time não encontrado")
    return {"message": "Time removido com sucesso"}

# ==================== FEEDBACK ENDPOINTS ====================

@api_router.post("/feedbacks", response_model=FeedbackResponse)
async def create_feedback(feedback_data: FeedbackCreate, user: dict = Depends(require_gestor_or_admin)):
    # Get collaborator info
    colaborador = await db.usuarios.find_one({"id": feedback_data.colaborador_id}, {"_id": 0})
    if not colaborador:
        raise HTTPException(status_code=404, detail="Colaborador não encontrado")
    
    # Calculate next feedback date if not provided
    data_proximo = feedback_data.data_proximo_feedback
    if not data_proximo and colaborador.get("time_id"):
        time = await db.times.find_one({"id": colaborador["time_id"]}, {"_id": 0})
        if time:
            dias = time.get("frequencia_padrao_feedback_dias", 30)
            data_proximo = (datetime.now(timezone.utc) + timedelta(days=dias)).isoformat()
    
    feedback = {
        "id": str(uuid.uuid4()),
        "colaborador_id": feedback_data.colaborador_id,
        "gestor_id": user["id"],
        "data_feedback": datetime.now(timezone.utc).isoformat(),
        "tipo_feedback": feedback_data.tipo_feedback,
        "contexto": feedback_data.contexto,
        "impacto": feedback_data.impacto,
        "expectativa": feedback_data.expectativa,
        "pontos_fortes": feedback_data.pontos_fortes,
        "pontos_melhoria": feedback_data.pontos_melhoria,
        "data_proximo_feedback": data_proximo,
        "status_feedback": "Aguardando ciência",
        "ciencia_colaborador": False,
        "data_ciencia": None,
        "confidencial": feedback_data.confidencial,
        "criado_em": datetime.now(timezone.utc).isoformat()
    }
    
    await db.feedbacks.insert_one(feedback)
    del feedback["_id"]
    
    # Create notification
    await create_notification(
        feedback_data.colaborador_id,
        "novo_feedback",
        "Novo Feedback Recebido",
        f"Você recebeu um novo feedback do tipo {feedback_data.tipo_feedback}"
    )
    
    feedback["colaborador_nome"] = colaborador.get("nome")
    feedback["gestor_nome"] = user.get("nome")
    
    return FeedbackResponse(**feedback)

@api_router.get("/feedbacks", response_model=List[FeedbackResponse])
async def list_feedbacks(
    colaborador_id: Optional[str] = None,
    gestor_id: Optional[str] = None,
    time_id: Optional[str] = None,
    tipo_feedback: Optional[str] = None,
    status_feedback: Optional[str] = None,
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None,
    com_plano: Optional[bool] = None,
    user: dict = Depends(get_current_user)
):
    query = {}
    
    # Role-based filtering
    if user["papel"] == "COLABORADOR":
        query["colaborador_id"] = user["id"]
    elif user["papel"] == "GESTOR":
        # Gestors can see feedbacks they created or for their team
        if not colaborador_id and not gestor_id:
            team_members = await db.usuarios.find(
                {"gestor_direto_id": user["id"]}, {"_id": 0, "id": 1}
            ).to_list(100)
            member_ids = [m["id"] for m in team_members]
            member_ids.append(user["id"])
            query["$or"] = [
                {"gestor_id": user["id"]},
                {"colaborador_id": {"$in": member_ids}}
            ]
    
    if colaborador_id:
        query["colaborador_id"] = colaborador_id
    if gestor_id:
        query["gestor_id"] = gestor_id
    if tipo_feedback:
        query["tipo_feedback"] = tipo_feedback
    if status_feedback:
        query["status_feedback"] = status_feedback
    if data_inicio:
        query["data_feedback"] = {"$gte": data_inicio}
    if data_fim:
        if "data_feedback" in query:
            query["data_feedback"]["$lte"] = data_fim
        else:
            query["data_feedback"] = {"$lte": data_fim}
    
    # Filter by team
    if time_id:
        team_users = await db.usuarios.find({"time_id": time_id}, {"_id": 0, "id": 1}).to_list(100)
        user_ids = [u["id"] for u in team_users]
        query["colaborador_id"] = {"$in": user_ids}
    
    feedbacks = await db.feedbacks.find(query, {"_id": 0}).sort("data_feedback", -1).to_list(1000)
    
    # Filter by action plan existence
    if com_plano is not None:
        feedback_ids_with_plan = set()
        plans = await db.planos_acao.find({}, {"_id": 0, "feedback_id": 1}).to_list(1000)
        feedback_ids_with_plan = {p["feedback_id"] for p in plans}
        
        if com_plano:
            feedbacks = [f for f in feedbacks if f["id"] in feedback_ids_with_plan]
        else:
            feedbacks = [f for f in feedbacks if f["id"] not in feedback_ids_with_plan]
    
    # Batch fetch user names to avoid N+1 queries
    if feedbacks:
        user_ids = set()
        for f in feedbacks:
            user_ids.add(f["colaborador_id"])
            user_ids.add(f["gestor_id"])
        
        users = await db.usuarios.find({"id": {"$in": list(user_ids)}}, {"_id": 0, "id": 1, "nome": 1}).to_list(len(user_ids))
        user_map = {u["id"]: u.get("nome") for u in users}
        
        for feedback in feedbacks:
            feedback["colaborador_nome"] = user_map.get(feedback["colaborador_id"])
            feedback["gestor_nome"] = user_map.get(feedback["gestor_id"])
    
    return [FeedbackResponse(**f) for f in feedbacks]

@api_router.get("/feedbacks/{feedback_id}", response_model=FeedbackResponse)
async def get_feedback(feedback_id: str, user: dict = Depends(get_current_user)):
    feedback = await db.feedbacks.find_one({"id": feedback_id}, {"_id": 0})
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback não encontrado")
    
    # Check permissions
    if user["papel"] == "COLABORADOR" and feedback["colaborador_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    colab = await db.usuarios.find_one({"id": feedback["colaborador_id"]}, {"_id": 0, "nome": 1})
    gestor = await db.usuarios.find_one({"id": feedback["gestor_id"]}, {"_id": 0, "nome": 1})
    feedback["colaborador_nome"] = colab.get("nome") if colab else None
    feedback["gestor_nome"] = gestor.get("nome") if gestor else None
    
    return FeedbackResponse(**feedback)

@api_router.put("/feedbacks/{feedback_id}", response_model=FeedbackResponse)
async def update_feedback(feedback_id: str, feedback_data: FeedbackUpdate, user: dict = Depends(require_gestor_or_admin)):
    feedback = await db.feedbacks.find_one({"id": feedback_id}, {"_id": 0})
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback não encontrado")
    
    # Check if user is the creator or admin
    if user["papel"] != "ADMIN" and feedback["gestor_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    update_dict = {k: v for k, v in feedback_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")
    
    await db.feedbacks.update_one({"id": feedback_id}, {"$set": update_dict})
    await update_feedback_status(feedback_id)
    
    updated = await db.feedbacks.find_one({"id": feedback_id}, {"_id": 0})
    
    colab = await db.usuarios.find_one({"id": updated["colaborador_id"]}, {"_id": 0, "nome": 1})
    gestor = await db.usuarios.find_one({"id": updated["gestor_id"]}, {"_id": 0, "nome": 1})
    updated["colaborador_nome"] = colab.get("nome") if colab else None
    updated["gestor_nome"] = gestor.get("nome") if gestor else None
    
    return FeedbackResponse(**updated)

@api_router.post("/feedbacks/{feedback_id}/acknowledge")
async def acknowledge_feedback(feedback_id: str, user: dict = Depends(get_current_user)):
    feedback = await db.feedbacks.find_one({"id": feedback_id}, {"_id": 0})
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback não encontrado")
    
    if feedback["colaborador_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Apenas o colaborador pode confirmar ciência")
    
    await db.feedbacks.update_one(
        {"id": feedback_id},
        {"$set": {
            "ciencia_colaborador": True,
            "data_ciencia": datetime.now(timezone.utc).isoformat(),
            "status_feedback": "Em dia"
        }}
    )
    
    return {"message": "Ciência confirmada com sucesso"}

@api_router.delete("/feedbacks/{feedback_id}")
async def delete_feedback(feedback_id: str, user: dict = Depends(require_admin)):
    result = await db.feedbacks.delete_one({"id": feedback_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Feedback não encontrado")
    
    # Delete related action plans and items
    plans = await db.planos_acao.find({"feedback_id": feedback_id}, {"_id": 0, "id": 1}).to_list(100)
    for plan in plans:
        await db.itens_plano.delete_many({"plano_de_acao_id": plan["id"]})
        await db.checkins.delete_many({"plano_de_acao_id": plan["id"]})
    await db.planos_acao.delete_many({"feedback_id": feedback_id})
    
    return {"message": "Feedback removido com sucesso"}

# ==================== ACTION PLAN ENDPOINTS ====================

@api_router.post("/action-plans", response_model=ActionPlanResponse)
async def create_action_plan(plan_data: ActionPlanCreate, user: dict = Depends(require_gestor_or_admin)):
    # Verify feedback exists
    feedback = await db.feedbacks.find_one({"id": plan_data.feedback_id}, {"_id": 0})
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback não encontrado")
    
    plan = {
        "id": str(uuid.uuid4()),
        "feedback_id": plan_data.feedback_id,
        "objetivo": plan_data.objetivo,
        "prazo_final": plan_data.prazo_final,
        "responsavel": plan_data.responsavel,
        "status": "Não iniciado",
        "progresso_percentual": 0,
        "criado_em": datetime.now(timezone.utc).isoformat()
    }
    
    await db.planos_acao.insert_one(plan)
    del plan["_id"]
    
    # Notify collaborator
    await create_notification(
        feedback["colaborador_id"],
        "novo_plano",
        "Novo Plano de Ação",
        f"Um plano de ação foi criado para o seu feedback"
    )
    
    return ActionPlanResponse(**plan)

@api_router.get("/action-plans", response_model=List[ActionPlanResponse])
async def list_action_plans(
    feedback_id: Optional[str] = None,
    status: Optional[str] = None,
    responsavel: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    query = {}
    
    if feedback_id:
        query["feedback_id"] = feedback_id
    if status:
        query["status"] = status
    if responsavel:
        query["responsavel"] = responsavel
    
    # Filter based on role
    if user["papel"] == "COLABORADOR":
        user_feedbacks = await db.feedbacks.find(
            {"colaborador_id": user["id"]}, {"_id": 0, "id": 1}
        ).to_list(100)
        feedback_ids = [f["id"] for f in user_feedbacks]
        query["feedback_id"] = {"$in": feedback_ids}
    
    plans = await db.planos_acao.find(query, {"_id": 0}).sort("prazo_final", 1).to_list(1000)
    
    # Update statuses based on deadlines
    for plan in plans:
        await update_action_plan_progress(plan["id"])
    
    # Refresh data
    plans = await db.planos_acao.find(query, {"_id": 0}).sort("prazo_final", 1).to_list(1000)
    
    return [ActionPlanResponse(**p) for p in plans]

@api_router.get("/action-plans/{plan_id}", response_model=ActionPlanResponse)
async def get_action_plan(plan_id: str, user: dict = Depends(get_current_user)):
    plan = await db.planos_acao.find_one({"id": plan_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Plano de ação não encontrado")
    
    await update_action_plan_progress(plan_id)
    plan = await db.planos_acao.find_one({"id": plan_id}, {"_id": 0})
    
    return ActionPlanResponse(**plan)

@api_router.put("/action-plans/{plan_id}", response_model=ActionPlanResponse)
async def update_action_plan(plan_id: str, plan_data: ActionPlanUpdate, user: dict = Depends(require_gestor_or_admin)):
    update_dict = {k: v for k, v in plan_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")
    
    result = await db.planos_acao.update_one({"id": plan_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Plano de ação não encontrado")
    
    updated = await db.planos_acao.find_one({"id": plan_id}, {"_id": 0})
    return ActionPlanResponse(**updated)

@api_router.delete("/action-plans/{plan_id}")
async def delete_action_plan(plan_id: str, user: dict = Depends(require_gestor_or_admin)):
    result = await db.planos_acao.delete_one({"id": plan_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Plano de ação não encontrado")
    
    # Delete related items and check-ins
    await db.itens_plano.delete_many({"plano_de_acao_id": plan_id})
    await db.checkins.delete_many({"plano_de_acao_id": plan_id})
    
    return {"message": "Plano de ação removido com sucesso"}

# ==================== ACTION PLAN ITEM ENDPOINTS ====================

@api_router.post("/action-plan-items", response_model=ActionPlanItemResponse)
async def create_action_plan_item(item_data: ActionPlanItemCreate, user: dict = Depends(get_current_user)):
    # Verify plan exists
    plan = await db.planos_acao.find_one({"id": item_data.plano_de_acao_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Plano de ação não encontrado")
    
    item = {
        "id": str(uuid.uuid4()),
        "plano_de_acao_id": item_data.plano_de_acao_id,
        "descricao": item_data.descricao,
        "prazo_item": item_data.prazo_item,
        "concluido": False
    }
    
    await db.itens_plano.insert_one(item)
    del item["_id"]
    
    await update_action_plan_progress(item_data.plano_de_acao_id)
    
    return ActionPlanItemResponse(**item)

@api_router.get("/action-plan-items", response_model=List[ActionPlanItemResponse])
async def list_action_plan_items(
    plano_de_acao_id: str,
    user: dict = Depends(get_current_user)
):
    items = await db.itens_plano.find({"plano_de_acao_id": plano_de_acao_id}, {"_id": 0}).to_list(100)
    return [ActionPlanItemResponse(**i) for i in items]

@api_router.put("/action-plan-items/{item_id}", response_model=ActionPlanItemResponse)
async def update_action_plan_item(item_id: str, item_data: ActionPlanItemUpdate, user: dict = Depends(get_current_user)):
    item = await db.itens_plano.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    
    update_dict = {k: v for k, v in item_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")
    
    await db.itens_plano.update_one({"id": item_id}, {"$set": update_dict})
    
    # Update plan progress
    await update_action_plan_progress(item["plano_de_acao_id"])
    
    updated = await db.itens_plano.find_one({"id": item_id}, {"_id": 0})
    return ActionPlanItemResponse(**updated)

@api_router.delete("/action-plan-items/{item_id}")
async def delete_action_plan_item(item_id: str, user: dict = Depends(get_current_user)):
    item = await db.itens_plano.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    
    plan_id = item["plano_de_acao_id"]
    
    result = await db.itens_plano.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    
    await update_action_plan_progress(plan_id)
    
    return {"message": "Item removido com sucesso"}

# ==================== CHECK-IN ENDPOINTS ====================

@api_router.post("/checkins", response_model=CheckInResponse)
async def create_checkin(checkin_data: CheckInCreate, user: dict = Depends(get_current_user)):
    # Verify plan exists
    plan = await db.planos_acao.find_one({"id": checkin_data.plano_de_acao_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Plano de ação não encontrado")
    
    checkin = {
        "id": str(uuid.uuid4()),
        "plano_de_acao_id": checkin_data.plano_de_acao_id,
        "data_checkin": datetime.now(timezone.utc).isoformat(),
        "progresso": checkin_data.progresso,
        "comentario": checkin_data.comentario,
        "registrado_por_id": user["id"]
    }
    
    await db.checkins.insert_one(checkin)
    del checkin["_id"]
    
    checkin["registrado_por_nome"] = user.get("nome")
    
    return CheckInResponse(**checkin)

@api_router.get("/checkins", response_model=List[CheckInResponse])
async def list_checkins(
    plano_de_acao_id: str,
    user: dict = Depends(get_current_user)
):
    checkins = await db.checkins.find(
        {"plano_de_acao_id": plano_de_acao_id}, {"_id": 0}
    ).sort("data_checkin", -1).to_list(100)
    
    for checkin in checkins:
        registrador = await db.usuarios.find_one(
            {"id": checkin["registrado_por_id"]}, {"_id": 0, "nome": 1}
        )
        checkin["registrado_por_nome"] = registrador.get("nome") if registrador else None
    
    return [CheckInResponse(**c) for c in checkins]

# ==================== NOTIFICATION ENDPOINTS ====================

@api_router.get("/notifications", response_model=List[NotificationResponse])
async def list_notifications(user: dict = Depends(get_current_user)):
    notifications = await db.notificacoes.find(
        {"usuario_id": user["id"]}, {"_id": 0}
    ).sort("criado_em", -1).to_list(50)
    
    return [NotificationResponse(**n) for n in notifications]

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, user: dict = Depends(get_current_user)):
    result = await db.notificacoes.update_one(
        {"id": notification_id, "usuario_id": user["id"]},
        {"$set": {"lida": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notificação não encontrada")
    return {"message": "Notificação marcada como lida"}

@api_router.put("/notifications/read-all")
async def mark_all_notifications_read(user: dict = Depends(get_current_user)):
    await db.notificacoes.update_many(
        {"usuario_id": user["id"]},
        {"$set": {"lida": True}}
    )
    return {"message": "Todas as notificações marcadas como lidas"}

# ==================== DASHBOARD ENDPOINTS ====================

@api_router.get("/dashboard/gestor")
async def get_gestor_dashboard(user: dict = Depends(require_gestor_or_admin)):
    now = datetime.now(timezone.utc)
    seven_days = (now + timedelta(days=7)).isoformat()
    thirty_days = (now + timedelta(days=30)).isoformat()
    
    # Get team members
    if user["papel"] == "ADMIN":
        team_members = await db.usuarios.find({"papel": "COLABORADOR"}, {"_id": 0}).to_list(100)
    else:
        team_members = await db.usuarios.find(
            {"gestor_direto_id": user["id"]}, {"_id": 0}
        ).to_list(100)
    
    member_ids = [m["id"] for m in team_members]
    
    # Feedbacks atrasados
    feedbacks_atrasados = await db.feedbacks.count_documents({
        "colaborador_id": {"$in": member_ids},
        "status_feedback": "Atrasado"
    })
    
    # Feedbacks vencendo em 7 dias
    feedbacks_7_dias = await db.feedbacks.count_documents({
        "colaborador_id": {"$in": member_ids},
        "data_proximo_feedback": {"$lte": seven_days, "$gte": now.isoformat()}
    })
    
    # Feedbacks vencendo em 30 dias
    feedbacks_30_dias = await db.feedbacks.count_documents({
        "colaborador_id": {"$in": member_ids},
        "data_proximo_feedback": {"$lte": thirty_days, "$gte": now.isoformat()}
    })
    
    # Colaboradores sem feedback recente (90 dias)
    ninety_days_ago = (now - timedelta(days=90)).isoformat()
    colaboradores_sem_feedback = 0
    for member_id in member_ids:
        recent_feedback = await db.feedbacks.find_one({
            "colaborador_id": member_id,
            "data_feedback": {"$gte": ninety_days_ago}
        })
        if not recent_feedback:
            colaboradores_sem_feedback += 1
    
    # Planos de ação atrasados
    planos_atrasados = await db.planos_acao.count_documents({
        "status": "Atrasado"
    })
    
    # Aguardando ciência
    aguardando_ciencia = await db.feedbacks.count_documents({
        "colaborador_id": {"$in": member_ids},
        "status_feedback": "Aguardando ciência"
    })
    
    # Recent feedbacks
    recent_feedbacks = await db.feedbacks.find(
        {"colaborador_id": {"$in": member_ids}}, {"_id": 0}
    ).sort("data_feedback", -1).limit(5).to_list(5)
    
    # Batch fetch user names
    if recent_feedbacks:
        user_ids = list(set(f["colaborador_id"] for f in recent_feedbacks))
        users = await db.usuarios.find({"id": {"$in": user_ids}}, {"_id": 0, "id": 1, "nome": 1}).to_list(len(user_ids))
        user_map = {u["id"]: u.get("nome") for u in users}
        for feedback in recent_feedbacks:
            feedback["colaborador_nome"] = user_map.get(feedback["colaborador_id"])
    
    return {
        "feedbacks_atrasados": feedbacks_atrasados,
        "feedbacks_7_dias": feedbacks_7_dias,
        "feedbacks_30_dias": feedbacks_30_dias,
        "colaboradores_sem_feedback": colaboradores_sem_feedback,
        "planos_atrasados": planos_atrasados,
        "aguardando_ciencia": aguardando_ciencia,
        "total_colaboradores": len(member_ids),
        "recent_feedbacks": recent_feedbacks
    }

@api_router.get("/dashboard/colaborador")
async def get_colaborador_dashboard(user: dict = Depends(get_current_user)):
    # Total feedbacks received
    total_feedbacks = await db.feedbacks.count_documents({"colaborador_id": user["id"]})
    
    # Pending acknowledgment
    pendente_ciencia = await db.feedbacks.count_documents({
        "colaborador_id": user["id"],
        "ciencia_colaborador": False
    })
    
    # Active action plans
    user_feedbacks = await db.feedbacks.find(
        {"colaborador_id": user["id"]}, {"_id": 0, "id": 1}
    ).to_list(100)
    feedback_ids = [f["id"] for f in user_feedbacks]
    
    planos_ativos = await db.planos_acao.count_documents({
        "feedback_id": {"$in": feedback_ids},
        "status": {"$in": ["Não iniciado", "Em andamento"]}
    })
    
    planos_atrasados = await db.planos_acao.count_documents({
        "feedback_id": {"$in": feedback_ids},
        "status": "Atrasado"
    })
    
    # Last feedback
    ultimo_feedback = await db.feedbacks.find_one(
        {"colaborador_id": user["id"]}, {"_id": 0}
    , sort=[("data_feedback", -1)])
    
    # Next feedback date
    proximo_feedback = None
    if ultimo_feedback and ultimo_feedback.get("data_proximo_feedback"):
        proximo_feedback = ultimo_feedback["data_proximo_feedback"]
    
    # Recent feedbacks
    recent_feedbacks = await db.feedbacks.find(
        {"colaborador_id": user["id"]}, {"_id": 0}
    ).sort("data_feedback", -1).limit(5).to_list(5)
    
    # Batch fetch gestor names
    if recent_feedbacks:
        gestor_ids = list(set(f["gestor_id"] for f in recent_feedbacks))
        gestores = await db.usuarios.find({"id": {"$in": gestor_ids}}, {"_id": 0, "id": 1, "nome": 1}).to_list(len(gestor_ids))
        gestor_map = {g["id"]: g.get("nome") for g in gestores}
        for feedback in recent_feedbacks:
            feedback["gestor_nome"] = gestor_map.get(feedback["gestor_id"])
    
    return {
        "total_feedbacks": total_feedbacks,
        "pendente_ciencia": pendente_ciencia,
        "planos_ativos": planos_ativos,
        "planos_atrasados": planos_atrasados,
        "proximo_feedback": proximo_feedback,
        "recent_feedbacks": recent_feedbacks
    }

@api_router.get("/dashboard/admin")
async def get_admin_dashboard(user: dict = Depends(require_admin)):
    # Total users by role
    total_usuarios = await db.usuarios.count_documents({})
    total_admins = await db.usuarios.count_documents({"papel": "ADMIN"})
    total_gestores = await db.usuarios.count_documents({"papel": "GESTOR"})
    total_colaboradores = await db.usuarios.count_documents({"papel": "COLABORADOR"})
    
    # Total teams
    total_times = await db.times.count_documents({})
    
    # Total feedbacks
    total_feedbacks = await db.feedbacks.count_documents({})
    feedbacks_atrasados = await db.feedbacks.count_documents({"status_feedback": "Atrasado"})
    feedbacks_aguardando = await db.feedbacks.count_documents({"status_feedback": "Aguardando ciência"})
    
    # Total action plans
    total_planos = await db.planos_acao.count_documents({})
    planos_atrasados = await db.planos_acao.count_documents({"status": "Atrasado"})
    planos_concluidos = await db.planos_acao.count_documents({"status": "Concluído"})
    
    # Feedbacks by type
    feedbacks_por_tipo = {}
    for tipo in FEEDBACK_TYPES:
        count = await db.feedbacks.count_documents({"tipo_feedback": tipo})
        feedbacks_por_tipo[tipo] = count
    
    return {
        "total_usuarios": total_usuarios,
        "total_admins": total_admins,
        "total_gestores": total_gestores,
        "total_colaboradores": total_colaboradores,
        "total_times": total_times,
        "total_feedbacks": total_feedbacks,
        "feedbacks_atrasados": feedbacks_atrasados,
        "feedbacks_aguardando": feedbacks_aguardando,
        "total_planos": total_planos,
        "planos_atrasados": planos_atrasados,
        "planos_concluidos": planos_concluidos,
        "feedbacks_por_tipo": feedbacks_por_tipo
    }

# ==================== COLLABORATOR PROFILE ====================

@api_router.get("/collaborator-profile/{colaborador_id}")
async def get_collaborator_profile(colaborador_id: str, user: dict = Depends(get_current_user)):
    colaborador = await db.usuarios.find_one({"id": colaborador_id}, {"_id": 0, "password": 0})
    if not colaborador:
        raise HTTPException(status_code=404, detail="Colaborador não encontrado")
    
    # Check permissions
    if user["papel"] == "COLABORADOR" and user["id"] != colaborador_id:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Get team info
    team = None
    if colaborador.get("time_id"):
        team = await db.times.find_one({"id": colaborador["time_id"]}, {"_id": 0})
    
    # Get manager info
    gestor = None
    if colaborador.get("gestor_direto_id"):
        gestor = await db.usuarios.find_one(
            {"id": colaborador["gestor_direto_id"]}, {"_id": 0, "password": 0}
        )
    
    # Get all feedbacks
    feedbacks = await db.feedbacks.find(
        {"colaborador_id": colaborador_id}, {"_id": 0}
    ).sort("data_feedback", -1).to_list(100)
    
    # Batch fetch gestor names
    if feedbacks:
        gestor_ids = list(set(f["gestor_id"] for f in feedbacks))
        gestores = await db.usuarios.find({"id": {"$in": gestor_ids}}, {"_id": 0, "id": 1, "nome": 1}).to_list(len(gestor_ids))
        gestor_map = {g["id"]: g.get("nome") for g in gestores}
        for feedback in feedbacks:
            feedback["gestor_nome"] = gestor_map.get(feedback["gestor_id"])
    
    # Aggregate recurring strengths and improvements
    pontos_fortes = {}
    pontos_melhoria = {}
    
    for fb in feedbacks:
        for pf in fb.get("pontos_fortes", []):
            pontos_fortes[pf] = pontos_fortes.get(pf, 0) + 1
        for pm in fb.get("pontos_melhoria", []):
            pontos_melhoria[pm] = pontos_melhoria.get(pm, 0) + 1
    
    # Sort by frequency
    pontos_fortes_sorted = sorted(pontos_fortes.items(), key=lambda x: x[1], reverse=True)[:5]
    pontos_melhoria_sorted = sorted(pontos_melhoria.items(), key=lambda x: x[1], reverse=True)[:5]
    
    # Get active action plans
    feedback_ids = [f["id"] for f in feedbacks]
    planos = await db.planos_acao.find(
        {"feedback_id": {"$in": feedback_ids}}, {"_id": 0}
    ).to_list(100)
    
    # Last and next feedback
    ultimo_feedback = feedbacks[0] if feedbacks else None
    proximo_feedback = ultimo_feedback.get("data_proximo_feedback") if ultimo_feedback else None
    
    return {
        "colaborador": colaborador,
        "time": team,
        "gestor": gestor,
        "feedbacks": feedbacks,
        "pontos_fortes_recorrentes": pontos_fortes_sorted,
        "pontos_melhoria_recorrentes": pontos_melhoria_sorted,
        "planos_acao": planos,
        "ultimo_feedback": ultimo_feedback,
        "proximo_feedback": proximo_feedback,
        "total_feedbacks": len(feedbacks)
    }

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_data():
    """Seed initial demo data"""
    
    credentials = {
        "admin": {"email": "admin@beeit.com.br", "senha": "admin123"},
        "gestor": {"email": "gestor@beeit.com.br", "senha": "gestor123"},
        "colaborador": {"email": "colaborador@beeit.com.br", "senha": "colab123"}
    }
    
    # Check if already seeded
    existing_admin = await db.usuarios.find_one({"email": "admin@beeit.com.br"})
    if existing_admin:
        return {
            "message": "Dados de demonstração já existem",
            "usuarios": credentials,
            "already_exists": True
        }
    
    # Create teams
    times = [
        {
            "id": str(uuid.uuid4()),
            "nome": "Desenvolvimento",
            "empresa": "Bee It",
            "frequencia_padrao_feedback_dias": 30,
            "descricao": "Time de desenvolvimento de software",
            "criado_em": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "nome": "Comercial",
            "empresa": "Bee It",
            "frequencia_padrao_feedback_dias": 15,
            "descricao": "Time comercial e vendas",
            "criado_em": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "nome": "Suporte",
            "empresa": "Bee It",
            "frequencia_padrao_feedback_dias": 30,
            "descricao": "Time de suporte ao cliente",
            "criado_em": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.times.insert_many(times)
    
    # Create users
    admin_id = str(uuid.uuid4())
    gestor1_id = str(uuid.uuid4())
    gestor2_id = str(uuid.uuid4())
    colab1_id = str(uuid.uuid4())
    colab2_id = str(uuid.uuid4())
    colab3_id = str(uuid.uuid4())
    
    usuarios = [
        {
            "id": admin_id,
            "nome": "Ana Silva",
            "email": "admin@beeit.com.br",
            "password": hash_password("admin123"),
            "papel": "ADMIN",
            "time_id": None,
            "gestor_direto_id": None,
            "ativo": True,
            "criado_em": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": gestor1_id,
            "nome": "Carlos Santos",
            "email": "gestor@beeit.com.br",
            "password": hash_password("gestor123"),
            "papel": "GESTOR",
            "time_id": times[0]["id"],
            "gestor_direto_id": None,
            "ativo": True,
            "criado_em": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": gestor2_id,
            "nome": "Maria Oliveira",
            "email": "maria.gestor@beeit.com.br",
            "password": hash_password("gestor123"),
            "papel": "GESTOR",
            "time_id": times[1]["id"],
            "gestor_direto_id": None,
            "ativo": True,
            "criado_em": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": colab1_id,
            "nome": "João Pereira",
            "email": "colaborador@beeit.com.br",
            "password": hash_password("colab123"),
            "papel": "COLABORADOR",
            "time_id": times[0]["id"],
            "gestor_direto_id": gestor1_id,
            "ativo": True,
            "criado_em": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": colab2_id,
            "nome": "Fernanda Costa",
            "email": "fernanda@beeit.com.br",
            "password": hash_password("colab123"),
            "papel": "COLABORADOR",
            "time_id": times[0]["id"],
            "gestor_direto_id": gestor1_id,
            "ativo": True,
            "criado_em": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": colab3_id,
            "nome": "Pedro Almeida",
            "email": "pedro@beeit.com.br",
            "password": hash_password("colab123"),
            "papel": "COLABORADOR",
            "time_id": times[1]["id"],
            "gestor_direto_id": gestor2_id,
            "ativo": True,
            "criado_em": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.usuarios.insert_many(usuarios)
    
    # Create feedbacks
    feedback1_id = str(uuid.uuid4())
    feedback2_id = str(uuid.uuid4())
    
    feedbacks = [
        {
            "id": feedback1_id,
            "colaborador_id": colab1_id,
            "gestor_id": gestor1_id,
            "data_feedback": (datetime.now(timezone.utc) - timedelta(days=15)).isoformat(),
            "tipo_feedback": "1:1",
            "contexto": "Reunião de acompanhamento mensal para discutir progresso nos projetos e alinhamento de expectativas.",
            "impacto": "O colaborador demonstrou excelente progresso na entrega do módulo de relatórios, contribuindo para a satisfação do cliente.",
            "expectativa": "Continuar mantendo o ritmo de entregas e começar a participar mais ativamente das reuniões de planejamento.",
            "pontos_fortes": ["Comunicação", "Organização", "Proatividade"],
            "pontos_melhoria": ["Documentação técnica", "Participação em reuniões"],
            "data_proximo_feedback": (datetime.now(timezone.utc) + timedelta(days=15)).isoformat(),
            "status_feedback": "Em dia",
            "ciencia_colaborador": True,
            "data_ciencia": (datetime.now(timezone.utc) - timedelta(days=14)).isoformat(),
            "confidencial": False,
            "criado_em": (datetime.now(timezone.utc) - timedelta(days=15)).isoformat()
        },
        {
            "id": feedback2_id,
            "colaborador_id": colab2_id,
            "gestor_id": gestor1_id,
            "data_feedback": (datetime.now(timezone.utc) - timedelta(days=5)).isoformat(),
            "tipo_feedback": "Coaching",
            "contexto": "Sessão de coaching focada em desenvolvimento de habilidades de liderança técnica.",
            "impacto": "A colaboradora tem potencial para assumir papel de tech lead no próximo projeto.",
            "expectativa": "Desenvolver habilidades de mentoria e começar a auxiliar membros mais novos do time.",
            "pontos_fortes": ["Conhecimento técnico", "Resolução de problemas", "Trabalho em equipe"],
            "pontos_melhoria": ["Gestão de tempo", "Delegação de tarefas"],
            "data_proximo_feedback": (datetime.now(timezone.utc) + timedelta(days=25)).isoformat(),
            "status_feedback": "Aguardando ciência",
            "ciencia_colaborador": False,
            "data_ciencia": None,
            "confidencial": False,
            "criado_em": (datetime.now(timezone.utc) - timedelta(days=5)).isoformat()
        }
    ]
    
    await db.feedbacks.insert_many(feedbacks)
    
    # Create action plan
    plano_id = str(uuid.uuid4())
    plano = {
        "id": plano_id,
        "feedback_id": feedback1_id,
        "objetivo": "Melhorar documentação técnica dos projetos desenvolvidos",
        "prazo_final": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
        "responsavel": "Colaborador",
        "status": "Em andamento",
        "progresso_percentual": 33,
        "criado_em": (datetime.now(timezone.utc) - timedelta(days=14)).isoformat()
    }
    
    await db.planos_acao.insert_one(plano)
    
    # Create action plan items
    itens = [
        {
            "id": str(uuid.uuid4()),
            "plano_de_acao_id": plano_id,
            "descricao": "Estudar padrões de documentação técnica",
            "prazo_item": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
            "concluido": True
        },
        {
            "id": str(uuid.uuid4()),
            "plano_de_acao_id": plano_id,
            "descricao": "Documentar o módulo de relatórios",
            "prazo_item": (datetime.now(timezone.utc) + timedelta(days=20)).isoformat(),
            "concluido": False
        },
        {
            "id": str(uuid.uuid4()),
            "plano_de_acao_id": plano_id,
            "descricao": "Criar template de documentação para o time",
            "prazo_item": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
            "concluido": False
        }
    ]
    
    await db.itens_plano.insert_many(itens)
    
    # Create check-in
    checkin = {
        "id": str(uuid.uuid4()),
        "plano_de_acao_id": plano_id,
        "data_checkin": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat(),
        "progresso": "Bom",
        "comentario": "Colaborador está no caminho certo, já concluiu o estudo dos padrões.",
        "registrado_por_id": gestor1_id
    }
    
    await db.checkins.insert_one(checkin)
    
    return {
        "message": "Dados de demonstração criados com sucesso",
        "usuarios": {
            "admin": {"email": "admin@beeit.com.br", "senha": "admin123"},
            "gestor": {"email": "gestor@beeit.com.br", "senha": "gestor123"},
            "colaborador": {"email": "colaborador@beeit.com.br", "senha": "colab123"}
        }
    }

# ==================== HEALTH CHECK ====================

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
