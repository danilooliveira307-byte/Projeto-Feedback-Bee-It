"""
Bee It Feedback API Tests
Tests all CRUD operations for users, teams, feedbacks, action plans, and dashboards
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://beeitfeedback.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@beeit.com.br"
ADMIN_PASSWORD = "admin123"
GESTOR_EMAIL = "gestor@beeit.com.br"
GESTOR_PASSWORD = "gestor123"
COLABORADOR_EMAIL = "colaborador@beeit.com.br"
COLABORADOR_PASSWORD = "colab123"


class TestHealthAndSeed:
    """Health check and seed data tests"""
    
    def test_health_check(self):
        """Test health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health check passed")
    
    def test_seed_data(self):
        """Test seed data endpoint"""
        response = requests.post(f"{BASE_URL}/api/seed")
        assert response.status_code == 200
        data = response.json()
        assert "usuarios" in data
        assert "admin" in data["usuarios"]
        print("✓ Seed data endpoint working")


class TestAuthentication:
    """Authentication tests for all user roles"""
    
    def test_admin_login(self):
        """Test admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["papel"] == "ADMIN"
        print(f"✓ Admin login successful - User: {data['user']['nome']}")
        return data["access_token"]
    
    def test_gestor_login(self):
        """Test gestor login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": GESTOR_EMAIL,
            "password": GESTOR_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["papel"] == "GESTOR"
        print(f"✓ Gestor login successful - User: {data['user']['nome']}")
        return data["access_token"]
    
    def test_colaborador_login(self):
        """Test colaborador login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COLABORADOR_EMAIL,
            "password": COLABORADOR_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["papel"] == "COLABORADOR"
        print(f"✓ Colaborador login successful - User: {data['user']['nome']}")
        return data["access_token"]
    
    def test_invalid_login(self):
        """Test invalid login credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@email.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid login correctly rejected")
    
    def test_get_me(self):
        """Test get current user endpoint"""
        token = self.test_admin_login()
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        print(f"✓ Get me endpoint working - User: {data['nome']}")


class TestUsers:
    """User CRUD tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    @pytest.fixture
    def gestor_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": GESTOR_EMAIL,
            "password": GESTOR_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_list_users(self, admin_token):
        """Test list users endpoint"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/users", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"✓ List users - Found {len(data)} users")
    
    def test_create_user(self, admin_token):
        """Test create user endpoint"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        user_data = {
            "nome": "TEST_Usuario Teste",
            "email": f"TEST_user_{datetime.now().timestamp()}@beeit.com.br",
            "password": "test123",
            "papel": "COLABORADOR",
            "ativo": True
        }
        response = requests.post(f"{BASE_URL}/api/users", json=user_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["nome"] == user_data["nome"]
        assert "id" in data
        print(f"✓ Create user - ID: {data['id']}")
        return data["id"]
    
    def test_get_user(self, admin_token):
        """Test get single user endpoint"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        # First get list to find a user
        response = requests.get(f"{BASE_URL}/api/users", headers=headers)
        users = response.json()
        user_id = users[0]["id"]
        
        response = requests.get(f"{BASE_URL}/api/users/{user_id}", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == user_id
        print(f"✓ Get user - {data['nome']}")
    
    def test_update_user(self, admin_token):
        """Test update user endpoint"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        # Create a user first
        user_id = self.test_create_user(admin_token)
        
        update_data = {"nome": "TEST_Usuario Atualizado"}
        response = requests.put(f"{BASE_URL}/api/users/{user_id}", json=update_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["nome"] == update_data["nome"]
        print(f"✓ Update user - {data['nome']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/users/{user_id}", headers=headers)
    
    def test_delete_user(self, admin_token):
        """Test delete user endpoint"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        # Create a user first
        user_id = self.test_create_user(admin_token)
        
        response = requests.delete(f"{BASE_URL}/api/users/{user_id}", headers=headers)
        assert response.status_code == 200
        print(f"✓ Delete user - ID: {user_id}")
        
        # Verify deletion
        response = requests.get(f"{BASE_URL}/api/users/{user_id}", headers=headers)
        assert response.status_code == 404
    
    def test_non_admin_cannot_create_user(self, gestor_token):
        """Test that non-admin cannot create users"""
        headers = {"Authorization": f"Bearer {gestor_token}"}
        user_data = {
            "nome": "TEST_Unauthorized User",
            "email": "unauthorized@beeit.com.br",
            "password": "test123",
            "papel": "COLABORADOR"
        }
        response = requests.post(f"{BASE_URL}/api/users", json=user_data, headers=headers)
        assert response.status_code == 403
        print("✓ Non-admin correctly denied user creation")


class TestTeams:
    """Team CRUD tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_list_teams(self, admin_token):
        """Test list teams endpoint"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/teams", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ List teams - Found {len(data)} teams")
    
    def test_create_team(self, admin_token):
        """Test create team endpoint"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        team_data = {
            "nome": f"TEST_Time {datetime.now().timestamp()}",
            "empresa": "Bee It",
            "frequencia_padrao_feedback_dias": 30,
            "descricao": "Time de teste"
        }
        response = requests.post(f"{BASE_URL}/api/teams", json=team_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["nome"] == team_data["nome"]
        assert "id" in data
        print(f"✓ Create team - ID: {data['id']}")
        return data["id"]
    
    def test_get_team(self, admin_token):
        """Test get single team endpoint"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/teams", headers=headers)
        teams = response.json()
        if len(teams) > 0:
            team_id = teams[0]["id"]
            response = requests.get(f"{BASE_URL}/api/teams/{team_id}", headers=headers)
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == team_id
            print(f"✓ Get team - {data['nome']}")
    
    def test_update_team(self, admin_token):
        """Test update team endpoint"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        team_id = self.test_create_team(admin_token)
        
        update_data = {"nome": "TEST_Time Atualizado"}
        response = requests.put(f"{BASE_URL}/api/teams/{team_id}", json=update_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["nome"] == update_data["nome"]
        print(f"✓ Update team - {data['nome']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/teams/{team_id}", headers=headers)
    
    def test_delete_team(self, admin_token):
        """Test delete team endpoint"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        team_id = self.test_create_team(admin_token)
        
        response = requests.delete(f"{BASE_URL}/api/teams/{team_id}", headers=headers)
        assert response.status_code == 200
        print(f"✓ Delete team - ID: {team_id}")


class TestFeedbacks:
    """Feedback CRUD tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    @pytest.fixture
    def gestor_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": GESTOR_EMAIL,
            "password": GESTOR_PASSWORD
        })
        return response.json()["access_token"]
    
    @pytest.fixture
    def colaborador_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COLABORADOR_EMAIL,
            "password": COLABORADOR_PASSWORD
        })
        return response.json()["access_token"]
    
    def get_colaborador_id(self, token):
        """Get a colaborador ID for testing"""
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/users?papel=COLABORADOR", headers=headers)
        users = response.json()
        return users[0]["id"] if users else None
    
    def test_list_feedbacks(self, admin_token):
        """Test list feedbacks endpoint"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/feedbacks", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ List feedbacks - Found {len(data)} feedbacks")
    
    def test_create_feedback(self, gestor_token):
        """Test create feedback endpoint"""
        headers = {"Authorization": f"Bearer {gestor_token}"}
        colaborador_id = self.get_colaborador_id(gestor_token)
        
        feedback_data = {
            "colaborador_id": colaborador_id,
            "tipo_feedback": "1:1",
            "contexto": "TEST_Contexto do feedback de teste",
            "impacto": "Impacto positivo no projeto",
            "expectativa": "Continuar com o bom trabalho",
            "pontos_fortes": ["Comunicação", "Proatividade"],
            "pontos_melhoria": ["Documentação"],
            "confidencial": False
        }
        response = requests.post(f"{BASE_URL}/api/feedbacks", json=feedback_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["contexto"] == feedback_data["contexto"]
        assert "id" in data
        print(f"✓ Create feedback - ID: {data['id']}")
        return data["id"]
    
    def test_get_feedback(self, gestor_token):
        """Test get single feedback endpoint"""
        headers = {"Authorization": f"Bearer {gestor_token}"}
        feedback_id = self.test_create_feedback(gestor_token)
        
        response = requests.get(f"{BASE_URL}/api/feedbacks/{feedback_id}", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == feedback_id
        print(f"✓ Get feedback - Type: {data['tipo_feedback']}")
    
    def test_update_feedback(self, gestor_token):
        """Test update feedback endpoint"""
        headers = {"Authorization": f"Bearer {gestor_token}"}
        feedback_id = self.test_create_feedback(gestor_token)
        
        update_data = {"contexto": "TEST_Contexto atualizado"}
        response = requests.put(f"{BASE_URL}/api/feedbacks/{feedback_id}", json=update_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["contexto"] == update_data["contexto"]
        print(f"✓ Update feedback - ID: {feedback_id}")
    
    def test_acknowledge_feedback(self, colaborador_token, gestor_token):
        """Test acknowledge feedback endpoint"""
        # Create feedback as gestor
        headers_gestor = {"Authorization": f"Bearer {gestor_token}"}
        headers_colab = {"Authorization": f"Bearer {colaborador_token}"}
        
        # Get colaborador info
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers_colab)
        colaborador_id = response.json()["id"]
        
        # Create feedback for this colaborador
        feedback_data = {
            "colaborador_id": colaborador_id,
            "tipo_feedback": "Coaching",
            "contexto": "TEST_Feedback para ciência",
            "impacto": "Impacto",
            "expectativa": "Expectativa",
            "pontos_fortes": [],
            "pontos_melhoria": [],
            "confidencial": False
        }
        response = requests.post(f"{BASE_URL}/api/feedbacks", json=feedback_data, headers=headers_gestor)
        feedback_id = response.json()["id"]
        
        # Acknowledge as colaborador
        response = requests.post(f"{BASE_URL}/api/feedbacks/{feedback_id}/acknowledge", headers=headers_colab)
        assert response.status_code == 200
        print(f"✓ Acknowledge feedback - ID: {feedback_id}")
    
    def test_delete_feedback(self, admin_token, gestor_token):
        """Test delete feedback endpoint (admin only)"""
        headers_admin = {"Authorization": f"Bearer {admin_token}"}
        headers_gestor = {"Authorization": f"Bearer {gestor_token}"}
        
        # Create feedback as gestor
        colaborador_id = self.get_colaborador_id(gestor_token)
        feedback_data = {
            "colaborador_id": colaborador_id,
            "tipo_feedback": "Elogio",
            "contexto": "TEST_Feedback para deletar",
            "impacto": "Impacto",
            "expectativa": "Expectativa",
            "pontos_fortes": [],
            "pontos_melhoria": [],
            "confidencial": False
        }
        response = requests.post(f"{BASE_URL}/api/feedbacks", json=feedback_data, headers=headers_gestor)
        feedback_id = response.json()["id"]
        
        # Delete as admin
        response = requests.delete(f"{BASE_URL}/api/feedbacks/{feedback_id}", headers=headers_admin)
        assert response.status_code == 200
        print(f"✓ Delete feedback - ID: {feedback_id}")
    
    def test_feedback_filters(self, admin_token):
        """Test feedback filtering"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Test filter by type
        response = requests.get(f"{BASE_URL}/api/feedbacks?tipo_feedback=1:1", headers=headers)
        assert response.status_code == 200
        print("✓ Feedback filter by type working")
        
        # Test filter by status
        response = requests.get(f"{BASE_URL}/api/feedbacks?status_feedback=Em dia", headers=headers)
        assert response.status_code == 200
        print("✓ Feedback filter by status working")


class TestActionPlans:
    """Action Plan CRUD tests"""
    
    @pytest.fixture
    def gestor_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": GESTOR_EMAIL,
            "password": GESTOR_PASSWORD
        })
        return response.json()["access_token"]
    
    def get_feedback_id(self, token):
        """Get a feedback ID for testing"""
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/feedbacks", headers=headers)
        feedbacks = response.json()
        return feedbacks[0]["id"] if feedbacks else None
    
    def test_list_action_plans(self, gestor_token):
        """Test list action plans endpoint"""
        headers = {"Authorization": f"Bearer {gestor_token}"}
        response = requests.get(f"{BASE_URL}/api/action-plans", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ List action plans - Found {len(data)} plans")
    
    def test_create_action_plan(self, gestor_token):
        """Test create action plan endpoint"""
        headers = {"Authorization": f"Bearer {gestor_token}"}
        feedback_id = self.get_feedback_id(gestor_token)
        
        plan_data = {
            "feedback_id": feedback_id,
            "objetivo": "TEST_Objetivo do plano de ação",
            "prazo_final": (datetime.now() + timedelta(days=30)).isoformat(),
            "responsavel": "Colaborador"
        }
        response = requests.post(f"{BASE_URL}/api/action-plans", json=plan_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["objetivo"] == plan_data["objetivo"]
        assert "id" in data
        print(f"✓ Create action plan - ID: {data['id']}")
        return data["id"]
    
    def test_get_action_plan(self, gestor_token):
        """Test get single action plan endpoint"""
        headers = {"Authorization": f"Bearer {gestor_token}"}
        plan_id = self.test_create_action_plan(gestor_token)
        
        response = requests.get(f"{BASE_URL}/api/action-plans/{plan_id}", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == plan_id
        print(f"✓ Get action plan - {data['objetivo'][:30]}...")
    
    def test_update_action_plan(self, gestor_token):
        """Test update action plan endpoint"""
        headers = {"Authorization": f"Bearer {gestor_token}"}
        plan_id = self.test_create_action_plan(gestor_token)
        
        update_data = {"objetivo": "TEST_Objetivo atualizado"}
        response = requests.put(f"{BASE_URL}/api/action-plans/{plan_id}", json=update_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["objetivo"] == update_data["objetivo"]
        print(f"✓ Update action plan - ID: {plan_id}")
    
    def test_delete_action_plan(self, gestor_token):
        """Test delete action plan endpoint"""
        headers = {"Authorization": f"Bearer {gestor_token}"}
        plan_id = self.test_create_action_plan(gestor_token)
        
        response = requests.delete(f"{BASE_URL}/api/action-plans/{plan_id}", headers=headers)
        assert response.status_code == 200
        print(f"✓ Delete action plan - ID: {plan_id}")


class TestActionPlanItems:
    """Action Plan Item tests"""
    
    @pytest.fixture
    def gestor_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": GESTOR_EMAIL,
            "password": GESTOR_PASSWORD
        })
        return response.json()["access_token"]
    
    def get_plan_id(self, token):
        """Get an action plan ID for testing"""
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/action-plans", headers=headers)
        plans = response.json()
        return plans[0]["id"] if plans else None
    
    def test_create_action_plan_item(self, gestor_token):
        """Test create action plan item endpoint"""
        headers = {"Authorization": f"Bearer {gestor_token}"}
        plan_id = self.get_plan_id(gestor_token)
        
        item_data = {
            "plano_de_acao_id": plan_id,
            "descricao": "TEST_Item do plano de ação",
            "prazo_item": (datetime.now() + timedelta(days=7)).isoformat()
        }
        response = requests.post(f"{BASE_URL}/api/action-plan-items", json=item_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["descricao"] == item_data["descricao"]
        print(f"✓ Create action plan item - ID: {data['id']}")
        return data["id"]
    
    def test_list_action_plan_items(self, gestor_token):
        """Test list action plan items endpoint"""
        headers = {"Authorization": f"Bearer {gestor_token}"}
        plan_id = self.get_plan_id(gestor_token)
        
        response = requests.get(f"{BASE_URL}/api/action-plan-items?plano_de_acao_id={plan_id}", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ List action plan items - Found {len(data)} items")
    
    def test_update_action_plan_item(self, gestor_token):
        """Test update action plan item endpoint"""
        headers = {"Authorization": f"Bearer {gestor_token}"}
        item_id = self.test_create_action_plan_item(gestor_token)
        
        update_data = {"concluido": True}
        response = requests.put(f"{BASE_URL}/api/action-plan-items/{item_id}", json=update_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["concluido"] == True
        print(f"✓ Update action plan item - ID: {item_id}")


class TestCheckins:
    """Check-in tests"""
    
    @pytest.fixture
    def gestor_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": GESTOR_EMAIL,
            "password": GESTOR_PASSWORD
        })
        return response.json()["access_token"]
    
    def get_plan_id(self, token):
        """Get an action plan ID for testing"""
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/action-plans", headers=headers)
        plans = response.json()
        return plans[0]["id"] if plans else None
    
    def test_create_checkin(self, gestor_token):
        """Test create check-in endpoint"""
        headers = {"Authorization": f"Bearer {gestor_token}"}
        plan_id = self.get_plan_id(gestor_token)
        
        checkin_data = {
            "plano_de_acao_id": plan_id,
            "progresso": "Bom",
            "comentario": "TEST_Check-in de teste"
        }
        response = requests.post(f"{BASE_URL}/api/checkins", json=checkin_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["comentario"] == checkin_data["comentario"]
        print(f"✓ Create check-in - ID: {data['id']}")
    
    def test_list_checkins(self, gestor_token):
        """Test list check-ins endpoint"""
        headers = {"Authorization": f"Bearer {gestor_token}"}
        plan_id = self.get_plan_id(gestor_token)
        
        response = requests.get(f"{BASE_URL}/api/checkins?plano_de_acao_id={plan_id}", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ List check-ins - Found {len(data)} check-ins")


class TestDashboards:
    """Dashboard tests for all user roles"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    @pytest.fixture
    def gestor_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": GESTOR_EMAIL,
            "password": GESTOR_PASSWORD
        })
        return response.json()["access_token"]
    
    @pytest.fixture
    def colaborador_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COLABORADOR_EMAIL,
            "password": COLABORADOR_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_admin_dashboard(self, admin_token):
        """Test admin dashboard endpoint"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/dashboard/admin", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_usuarios" in data
        assert "total_feedbacks" in data
        assert "total_times" in data
        print(f"✓ Admin dashboard - {data['total_usuarios']} users, {data['total_feedbacks']} feedbacks")
    
    def test_gestor_dashboard(self, gestor_token):
        """Test gestor dashboard endpoint"""
        headers = {"Authorization": f"Bearer {gestor_token}"}
        response = requests.get(f"{BASE_URL}/api/dashboard/gestor", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "feedbacks_atrasados" in data
        assert "total_colaboradores" in data
        print(f"✓ Gestor dashboard - {data['total_colaboradores']} colaboradores")
    
    def test_colaborador_dashboard(self, colaborador_token):
        """Test colaborador dashboard endpoint"""
        headers = {"Authorization": f"Bearer {colaborador_token}"}
        response = requests.get(f"{BASE_URL}/api/dashboard/colaborador", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_feedbacks" in data
        assert "pendente_ciencia" in data
        print(f"✓ Colaborador dashboard - {data['total_feedbacks']} feedbacks")


class TestNotifications:
    """Notification tests"""
    
    @pytest.fixture
    def colaborador_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COLABORADOR_EMAIL,
            "password": COLABORADOR_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_list_notifications(self, colaborador_token):
        """Test list notifications endpoint"""
        headers = {"Authorization": f"Bearer {colaborador_token}"}
        response = requests.get(f"{BASE_URL}/api/notifications", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ List notifications - Found {len(data)} notifications")
    
    def test_mark_all_read(self, colaborador_token):
        """Test mark all notifications as read endpoint"""
        headers = {"Authorization": f"Bearer {colaborador_token}"}
        response = requests.put(f"{BASE_URL}/api/notifications/read-all", headers=headers)
        assert response.status_code == 200
        print("✓ Mark all notifications as read")


class TestCollaboratorProfile:
    """Collaborator profile tests"""
    
    @pytest.fixture
    def gestor_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": GESTOR_EMAIL,
            "password": GESTOR_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_collaborator_profile(self, gestor_token):
        """Test get collaborator profile endpoint"""
        headers = {"Authorization": f"Bearer {gestor_token}"}
        
        # Get a colaborador ID
        response = requests.get(f"{BASE_URL}/api/users?papel=COLABORADOR", headers=headers)
        users = response.json()
        if users:
            colaborador_id = users[0]["id"]
            response = requests.get(f"{BASE_URL}/api/collaborator-profile/{colaborador_id}", headers=headers)
            assert response.status_code == 200
            data = response.json()
            assert "colaborador" in data
            assert "feedbacks" in data
            print(f"✓ Get collaborator profile - {data['colaborador']['nome']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
