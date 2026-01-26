import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getNotifications, markAllNotificationsRead } from '../lib/api';
import { Button } from './ui/button';
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
  LogOut,
  Bell,
  Menu,
  X,
  User,
  Hexagon,
  ChevronLeft,
  Search
} from 'lucide-react';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_beeitfeedback/artifacts/i4773jcn_Logo%20BEE%20IT%20Original.png';

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
      case 'ADMIN': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'GESTOR': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default: return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
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
    <div className="min-h-screen bg-[#0F172A]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#0F172A]/95 backdrop-blur-md border-b border-slate-800/60 z-50">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (window.innerWidth < 768) {
                  setMobileMenuOpen(!mobileMenuOpen);
                } else {
                  setSidebarOpen(!sidebarOpen);
                }
              }}
              className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors text-slate-400 hover:text-white"
              data-testid="toggle-sidebar-btn"
            >
              {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to="/dashboard" className="flex items-center gap-3">
              <img 
                src={LOGO_URL} 
                alt="Bee It" 
                className="h-9 object-contain"
              />
              <span className="font-bold text-xl text-[#F59E0B] hidden sm:block">Feedback</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white hover:bg-slate-800/50" data-testid="notifications-btn">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-[#F59E0B] text-white text-xs rounded-full flex items-center justify-center font-semibold animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-[#1E293B] border-slate-700">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                  <span className="font-semibold text-white">Notificações</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-[#F59E0B] hover:text-[#FBBF24] transition-colors"
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-slate-500 text-sm">
                      Nenhuma notificação
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((notification) => (
                      <DropdownMenuItem key={notification.id} className="flex flex-col items-start px-4 py-3 hover:bg-slate-800/50 cursor-pointer">
                        <span className={`text-sm ${!notification.lida ? 'font-semibold text-white' : 'text-slate-300'}`}>
                          {notification.titulo}
                        </span>
                        <span className="text-xs text-slate-500 mt-1">{notification.mensagem}</span>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 hover:bg-slate-800/50 px-2" data-testid="user-menu-btn">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-orange-500/20">
                    {user?.nome?.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium text-white">{user?.nome}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getRoleBadgeColor()}`}>
                      {getRoleLabel()}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#1E293B] border-slate-700">
                <div className="px-4 py-3 border-b border-slate-700">
                  <p className="font-medium text-white">{user?.nome}</p>
                  <p className="text-sm text-slate-400">{user?.email}</p>
                </div>
                <DropdownMenuItem onClick={() => navigate(`/perfil/${user?.id}`)} className="hover:bg-slate-800/50 text-slate-300 hover:text-white cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Meu Perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem onClick={handleLogout} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer" data-testid="logout-btn">
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 bottom-0 bg-[#020617] border-r border-slate-800/60 z-40 transition-all duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 ${sidebarOpen ? 'w-64' : 'w-20'}`}
      >
        {/* Logo area when sidebar collapsed */}
        {!sidebarOpen && (
          <div className="flex justify-center py-4 border-b border-slate-800/60">
            <Hexagon className="h-8 w-8 text-[#F59E0B] fill-[#F59E0B]/20" />
          </div>
        )}
        
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-l-4 border-[#F59E0B]'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white border-l-4 border-transparent'
                } ${!sidebarOpen ? 'justify-center' : ''}`}
                data-testid={`nav-${item.path.replace('/', '')}`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 transition-colors ${isActive ? 'text-[#F59E0B]' : 'group-hover:text-[#F59E0B]'}`} />
                {sidebarOpen && (
                  <span className="font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        {sidebarOpen && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800/60">
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center text-white text-sm font-bold">
                  {user?.nome?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user?.nome}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main
        className={`pt-16 min-h-screen transition-all duration-300 ${
          sidebarOpen ? 'md:ml-64' : 'md:ml-20'
        }`}
      >
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
