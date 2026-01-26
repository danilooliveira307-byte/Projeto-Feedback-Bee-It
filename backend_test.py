#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Bee It Feedback System
Tests all endpoints with proper authentication and role-based access
"""

import requests
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class BeeItFeedbackTester:
    def __init__(self, base_url="https://perftracker-9.preview.emergentagent.com"):
        self.base_url = base_url
        self.tokens = {}
        self.users = {}
        self.teams = []
        self.feedbacks = []
        self.action_plans = []
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
            self.failed_tests.append(f"{name}: {details}")

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    token: Optional[str] = None, expected_status: int = 200) -> tuple:
        """Make HTTP request with proper error handling"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            try:
                response_data = response.json() if response.content else {}
            except:
                response_data = {"text": response.text}
            
            return success, response_data

        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}

    def test_health_check(self):
        """Test health endpoint"""
        success, data = self.make_request('GET', 'health')
        self.log_test("Health Check", success, 
                     "" if success else f"Health endpoint failed: {data}")
        return success

    def test_seed_data(self):
        """Test seeding demo data"""
        success, data = self.make_request('POST', 'seed')
        # Accept both 200 (created) and error if already exists
        if not success and "já existem" in str(data):
            success = True
        self.log_test("Seed Demo Data", success,
                     "" if success else f"Seed failed: {data}")
        return success

    def test_authentication(self):
        """Test login for all user roles"""
        credentials = [
            ("admin", "admin@beeit.com.br", "admin123"),
            ("gestor", "gestor@beeit.com.br", "gestor123"),
            ("colaborador", "colaborador@beeit.com.br", "colab123")
        ]

        all_success = True
        for role, email, password in credentials:
            success, data = self.make_request('POST', 'auth/login', {
                "email": email,
                "password": password
            })
            
            if success and 'access_token' in data:
                self.tokens[role] = data['access_token']
                self.users[role] = data['user']
                self.log_test(f"Login as {role.upper()}", True)
            else:
                self.log_test(f"Login as {role.upper()}", False, 
                             f"Login failed: {data}")
                all_success = False

        return all_success

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        success, data = self.make_request('POST', 'auth/login', {
            "email": "invalid@test.com",
            "password": "wrongpassword"
        }, expected_status=401)
        
        self.log_test("Invalid Login Rejection", success,
                     "" if success else f"Should reject invalid login: {data}")
        return success

    def test_me_endpoint(self):
        """Test /auth/me endpoint for all roles"""
        all_success = True
        for role in ['admin', 'gestor', 'colaborador']:
            if role not in self.tokens:
                continue
                
            success, data = self.make_request('GET', 'auth/me', 
                                            token=self.tokens[role])
            
            if success and 'email' in data:
                self.log_test(f"Get Profile ({role})", True)
            else:
                self.log_test(f"Get Profile ({role})", False, 
                             f"Profile fetch failed: {data}")
                all_success = False

        return all_success

    def test_teams_crud(self):
        """Test teams CRUD operations"""
        if 'admin' not in self.tokens:
            return False

        admin_token = self.tokens['admin']
        
        # List teams
        success, data = self.make_request('GET', 'teams', token=admin_token)
        if success:
            self.teams = data
            self.log_test("List Teams", True)
        else:
            self.log_test("List Teams", False, f"Failed to list teams: {data}")
            return False

        # Create team
        team_data = {
            "nome": "Test Team",
            "empresa": "Bee It Test",
            "frequencia_padrao_feedback_dias": 15,
            "descricao": "Team created by automated test"
        }
        
        success, data = self.make_request('POST', 'teams', team_data, 
                                        admin_token, 201)
        if success and 'id' in data:
            test_team_id = data['id']
            self.log_test("Create Team", True)
            
            # Update team
            update_data = {"nome": "Updated Test Team"}
            success, data = self.make_request('PUT', f'teams/{test_team_id}', 
                                            update_data, admin_token)
            self.log_test("Update Team", success,
                         "" if success else f"Update failed: {data}")
            
            # Delete team
            success, data = self.make_request('DELETE', f'teams/{test_team_id}', 
                                            token=admin_token)
            self.log_test("Delete Team", success,
                         "" if success else f"Delete failed: {data}")
        else:
            self.log_test("Create Team", False, f"Create failed: {data}")
            return False

        return True

    def test_users_crud(self):
        """Test users CRUD operations"""
        if 'admin' not in self.tokens:
            return False

        admin_token = self.tokens['admin']
        
        # List users
        success, data = self.make_request('GET', 'users', token=admin_token)
        if success:
            self.log_test("List Users", True)
        else:
            self.log_test("List Users", False, f"Failed to list users: {data}")
            return False

        # Create user
        user_data = {
            "nome": "Test User",
            "email": "testuser@beeit.com.br",
            "password": "testpass123",
            "papel": "COLABORADOR",
            "ativo": True
        }
        
        success, data = self.make_request('POST', 'users', user_data, 
                                        admin_token, 201)
        if success and 'id' in data:
            test_user_id = data['id']
            self.log_test("Create User", True)
            
            # Update user
            update_data = {"nome": "Updated Test User"}
            success, data = self.make_request('PUT', f'users/{test_user_id}', 
                                            update_data, admin_token)
            self.log_test("Update User", success,
                         "" if success else f"Update failed: {data}")
            
            # Delete user
            success, data = self.make_request('DELETE', f'users/{test_user_id}', 
                                            token=admin_token)
            self.log_test("Delete User", success,
                         "" if success else f"Delete failed: {data}")
        else:
            self.log_test("Create User", False, f"Create failed: {data}")
            return False

        return True

    def test_feedbacks_crud(self):
        """Test feedbacks CRUD operations"""
        if 'gestor' not in self.tokens or 'colaborador' not in self.users:
            return False

        gestor_token = self.tokens['gestor']
        colaborador_id = self.users['colaborador']['id']
        
        # List feedbacks
        success, data = self.make_request('GET', 'feedbacks', token=gestor_token)
        if success:
            self.feedbacks = data
            self.log_test("List Feedbacks", True)
        else:
            self.log_test("List Feedbacks", False, f"Failed to list feedbacks: {data}")
            return False

        # Create feedback
        feedback_data = {
            "colaborador_id": colaborador_id,
            "tipo_feedback": "1:1",
            "contexto": "Test feedback context",
            "impacto": "Test impact description",
            "expectativa": "Test expectations",
            "pontos_fortes": ["Communication", "Teamwork"],
            "pontos_melhoria": ["Time management"],
            "confidencial": False
        }
        
        success, data = self.make_request('POST', 'feedbacks', feedback_data, 
                                        gestor_token, 201)
        if success and 'id' in data:
            test_feedback_id = data['id']
            self.log_test("Create Feedback", True)
            
            # Get feedback details
            success, data = self.make_request('GET', f'feedbacks/{test_feedback_id}', 
                                            token=gestor_token)
            self.log_test("Get Feedback Details", success,
                         "" if success else f"Get failed: {data}")
            
            # Update feedback
            update_data = {"contexto": "Updated test context"}
            success, data = self.make_request('PUT', f'feedbacks/{test_feedback_id}', 
                                            update_data, gestor_token)
            self.log_test("Update Feedback", success,
                         "" if success else f"Update failed: {data}")
            
            # Test collaborator acknowledgment
            if 'colaborador' in self.tokens:
                success, data = self.make_request('POST', 
                                                f'feedbacks/{test_feedback_id}/acknowledge', 
                                                token=self.tokens['colaborador'])
                self.log_test("Acknowledge Feedback", success,
                             "" if success else f"Acknowledge failed: {data}")
            
            return test_feedback_id
        else:
            self.log_test("Create Feedback", False, f"Create failed: {data}")
            return False

    def test_action_plans_crud(self):
        """Test action plans CRUD operations"""
        # First create a feedback to attach action plan to
        feedback_id = self.test_feedbacks_crud()
        if not feedback_id:
            return False

        if 'gestor' not in self.tokens:
            return False

        gestor_token = self.tokens['gestor']
        
        # Create action plan
        plan_data = {
            "feedback_id": feedback_id,
            "objetivo": "Test action plan objective",
            "prazo_final": (datetime.now() + timedelta(days=30)).isoformat(),
            "responsavel": "Colaborador"
        }
        
        success, data = self.make_request('POST', 'action-plans', plan_data, 
                                        gestor_token, 201)
        if success and 'id' in data:
            test_plan_id = data['id']
            self.log_test("Create Action Plan", True)
            
            # List action plans
            success, data = self.make_request('GET', 'action-plans', token=gestor_token)
            self.log_test("List Action Plans", success,
                         "" if success else f"List failed: {data}")
            
            # Get action plan details
            success, data = self.make_request('GET', f'action-plans/{test_plan_id}', 
                                            token=gestor_token)
            self.log_test("Get Action Plan Details", success,
                         "" if success else f"Get failed: {data}")
            
            # Create action plan item
            item_data = {
                "plano_de_acao_id": test_plan_id,
                "descricao": "Test action item",
                "prazo_item": (datetime.now() + timedelta(days=15)).isoformat()
            }
            
            success, data = self.make_request('POST', 'action-plan-items', item_data, 
                                            gestor_token, 201)
            if success and 'id' in data:
                test_item_id = data['id']
                self.log_test("Create Action Plan Item", True)
                
                # List action plan items
                success, data = self.make_request('GET', 
                                                f'action-plan-items?plano_de_acao_id={test_plan_id}', 
                                                token=gestor_token)
                self.log_test("List Action Plan Items", success,
                             "" if success else f"List items failed: {data}")
                
                # Update item (mark as completed)
                update_data = {"concluido": True}
                success, data = self.make_request('PUT', f'action-plan-items/{test_item_id}', 
                                                update_data, gestor_token)
                self.log_test("Update Action Plan Item", success,
                             "" if success else f"Update item failed: {data}")
            else:
                self.log_test("Create Action Plan Item", False, f"Create item failed: {data}")
            
            # Create check-in
            checkin_data = {
                "plano_de_acao_id": test_plan_id,
                "progresso": "Bom",
                "comentario": "Test check-in comment"
            }
            
            success, data = self.make_request('POST', 'checkins', checkin_data, 
                                            gestor_token, 201)
            if success:
                self.log_test("Create Check-in", True)
                
                # List check-ins
                success, data = self.make_request('GET', 
                                                f'checkins?plano_de_acao_id={test_plan_id}', 
                                                token=gestor_token)
                self.log_test("List Check-ins", success,
                             "" if success else f"List check-ins failed: {data}")
            else:
                self.log_test("Create Check-in", False, f"Create check-in failed: {data}")
            
            return test_plan_id
        else:
            self.log_test("Create Action Plan", False, f"Create failed: {data}")
            return False

    def test_dashboards(self):
        """Test dashboard endpoints for all roles"""
        dashboards = [
            ('admin', 'dashboard/admin'),
            ('gestor', 'dashboard/gestor'),
            ('colaborador', 'dashboard/colaborador')
        ]
        
        all_success = True
        for role, endpoint in dashboards:
            if role not in self.tokens:
                continue
                
            success, data = self.make_request('GET', endpoint, token=self.tokens[role])
            
            if success and isinstance(data, dict):
                self.log_test(f"Dashboard {role.upper()}", True)
            else:
                self.log_test(f"Dashboard {role.upper()}", False, 
                             f"Dashboard failed: {data}")
                all_success = False

        return all_success

    def test_notifications(self):
        """Test notifications endpoints"""
        if 'colaborador' not in self.tokens:
            return False

        colaborador_token = self.tokens['colaborador']
        
        # List notifications
        success, data = self.make_request('GET', 'notifications', token=colaborador_token)
        if success:
            self.log_test("List Notifications", True)
            
            # Mark all as read
            success, data = self.make_request('PUT', 'notifications/read-all', 
                                            token=colaborador_token)
            self.log_test("Mark All Notifications Read", success,
                         "" if success else f"Mark read failed: {data}")
        else:
            self.log_test("List Notifications", False, f"List failed: {data}")
            return False

        return True

    def test_collaborator_profile(self):
        """Test collaborator profile endpoint"""
        if 'colaborador' not in self.tokens or 'colaborador' not in self.users:
            return False

        colaborador_token = self.tokens['colaborador']
        colaborador_id = self.users['colaborador']['id']
        
        success, data = self.make_request('GET', f'collaborator-profile/{colaborador_id}', 
                                        token=colaborador_token)
        
        if success and 'colaborador' in data:
            self.log_test("Collaborator Profile", True)
        else:
            self.log_test("Collaborator Profile", False, 
                         f"Profile failed: {data}")
            return False

        return True

    def test_role_based_access(self):
        """Test role-based access control"""
        if 'colaborador' not in self.tokens:
            return False

        colaborador_token = self.tokens['colaborador']
        
        # Collaborator should NOT be able to create users (admin only)
        user_data = {
            "nome": "Unauthorized User",
            "email": "unauthorized@test.com",
            "password": "test123",
            "papel": "COLABORADOR"
        }
        
        success, data = self.make_request('POST', 'users', user_data, 
                                        colaborador_token, 403)
        self.log_test("Role Access Control (Users)", success,
                     "" if success else f"Should deny access: {data}")
        
        # Collaborator should NOT be able to create teams (admin only)
        team_data = {
            "nome": "Unauthorized Team",
            "empresa": "Test"
        }
        
        success, data = self.make_request('POST', 'teams', team_data, 
                                        colaborador_token, 403)
        self.log_test("Role Access Control (Teams)", success,
                     "" if success else f"Should deny access: {data}")

        return True

    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🐝 Starting Bee It Feedback System API Tests")
        print("=" * 50)
        
        # Basic connectivity
        if not self.test_health_check():
            print("❌ Health check failed - stopping tests")
            return False
        
        # Seed data
        self.test_seed_data()
        
        # Authentication tests
        if not self.test_authentication():
            print("❌ Authentication failed - stopping tests")
            return False
        
        self.test_invalid_login()
        self.test_me_endpoint()
        
        # CRUD operations
        self.test_teams_crud()
        self.test_users_crud()
        self.test_feedbacks_crud()
        self.test_action_plans_crud()
        
        # Dashboard tests
        self.test_dashboards()
        
        # Additional features
        self.test_notifications()
        self.test_collaborator_profile()
        
        # Security tests
        self.test_role_based_access()
        
        # Print results
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for failure in self.failed_tests:
                print(f"  - {failure}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"\n✨ Success Rate: {success_rate:.1f}%")
        
        return success_rate >= 80  # Consider 80%+ as passing

def main():
    """Main test execution"""
    tester = BeeItFeedbackTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())