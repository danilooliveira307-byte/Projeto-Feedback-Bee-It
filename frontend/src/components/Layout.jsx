import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getNotifications, markAllNotificationsRead } from '../lib/api';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  LayoutDashboard,
  MessageSquare,
  ClipboardList,
  Users,
  Building2,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  ChevronRight,
  User
} from 'lucide-react';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_perftracker-9/artifacts/tf78nmcp_image.png';

const Layout = ({ children }) => {
  const { user, logout, isAdmin, isGestor, isColaborador } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await getNotifications();
      setNotifications(response.data);
      setUnreadCount(response.data.filter(n => !n.lida).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({ ...n, lida: true })));
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavItems = () => {
    const items = [];
    
    if (isColaborador()) {
      items.push(
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/feedbacks', label: 'Meus Feedbacks', icon: MessageSquare },
        { path: '/planos-acao', label: 'Planos de Ação', icon: ClipboardList },
        { path: `/perfil/${user?.id}`, label: 'Meu Perfil', icon: User }
      );
    } else if (isGestor()) {
      items.push(
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/feedbacks', label: 'Feedbacks', icon: MessageSquare },
        { path: '/planos-acao', label: 'Planos de Ação', icon: ClipboardList },
        { path: '/colaboradores', label: 'Colaboradores', icon: Users }
      );
    } else if (isAdmin()) {
      items.push(
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/feedbacks', label: 'Feedbacks', icon: MessageSquare },
        { path: '/planos-acao', label: 'Planos de Ação', icon: ClipboardList },
        { path: '/usuarios', label: 'Usuários', icon: Users },
        { path: '/times', label: 'Times', icon: Building2 }
      );
    }
    
    return items;
  };

  const navItems = getNavItems();

  const getRoleBadgeColor = () => {
    switch (user?.papel) {
      case 'ADMIN': return 'bg-purple-100 text-purple-700';
      case 'GESTOR': return 'bg-blue-100 text-blue-700';
      default: return 'bg-green-100 text-green-700';
    }
  };

  const getRoleLabel = () => {
    switch (user?.papel) {
      case 'ADMIN': return 'Administrador';
      case 'GESTOR': return 'Gestor';
      default: return 'Colaborador';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b z-50 px-4">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (window.innerWidth < 768) {
                  setMobileMenuOpen(!mobileMenuOpen);
                } else {
                  setSidebarOpen(!sidebarOpen);
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              data-testid="toggle-sidebar-btn"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
            <Link to="/dashboard" className="flex items-center gap-2">
              <img src={LOGO_URL} alt="Bee It" className="h-8 object-contain" />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" data-testid="notifications-btn">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-[hsl(30,94%,54%)] text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-4 py-2 border-b">
                  <span className="font-semibold">Notificações</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-[hsl(30,94%,54%)] hover:underline"
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500 text-sm">
                      Nenhuma notificação
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((notification) => (
                      <DropdownMenuItem key={notification.id} className="flex flex-col items-start px-4 py-3">
                        <span className={`text-sm ${!notification.lida ? 'font-semibold' : ''}`}>
                          {notification.titulo}
                        </span>
                        <span className="text-xs text-gray-500">{notification.mensagem}</span>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2" data-testid="user-menu-btn">
                  <div className="h-8 w-8 rounded-full bg-[hsl(210,54%,23%)] flex items-center justify-center text-white text-sm font-medium">
                    {user?.nome?.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium">{user?.nome}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${getRoleBadgeColor()}`}>
                      {getRoleLabel()}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-4 py-2 border-b">
                  <p className="font-medium">{user?.nome}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
                <DropdownMenuItem onClick={() => navigate(`/perfil/${user?.id}`)}>
                  <User className="mr-2 h-4 w-4" />
                  Meu Perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600" data-testid="logout-btn">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 bottom-0 bg-white border-r z-40 transition-all duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 ${sidebarOpen ? 'w-64' : 'w-16'}`}
      >
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-[hsl(30,94%,54%,0.1)] text-[hsl(30,94%,54%)] font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                data-testid={`nav-${item.path.replace('/', '')}`}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-[hsl(30,94%,54%)]' : ''}`} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main
        className={`pt-16 min-h-screen transition-all duration-300 ${
          sidebarOpen ? 'md:ml-64' : 'md:ml-16'
        }`}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
