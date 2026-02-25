
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  UserSquare2,
  BarChart3, 
  Search, 
  LogOut, 
  Menu, 
  X, 
  Truck, 
  Plus, 
  Printer,
  ChevronRight,
  History as HistoryIcon,
  Bell,
  Check
} from 'lucide-react';
import { UserRole, User, Customer, Parcel, ParcelStatus, AppNotification } from './types';
import { INITIAL_CUSTOMERS, INITIAL_PARCELS } from './constants';

// Pages
import Dashboard from './pages/Dashboard';
import CustomerManagement from './pages/CustomerManagement';
import ParcelManagement from './pages/ParcelManagement';
import Reports from './pages/Reports';
import PublicTracking from './pages/PublicTracking';
import UserManagement from './pages/UserManagement';
import History from './pages/History';

const INITIAL_USERS: User[] = [
  { id: 'u-1', name: 'Super Admin', email: 'admin@sm-global.com', role: UserRole.SUPER_ADMIN, password: '123', branch: 'Sede Central' },
  { id: 'u-2', name: 'Admin Malabo', email: 'malabo@sm-global.com', role: UserRole.ADMIN, password: '123', branch: 'Malabo' },
  { id: 'u-3', name: 'Admin Bata', email: 'bata@sm-global.com', role: UserRole.ADMIN, password: '123', branch: 'Bata' },
  { id: 'u-4', name: 'Operador Logístico', email: 'operador@sm-global.com', role: UserRole.OPERATOR, password: '123', branch: 'Malabo' }
];

const SidebarLink = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean }) => (
  <Link 
    to={to} 
    className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
      active ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

const AppLayout = ({ 
  children, 
  user, 
  setUser, 
  notifications, 
  setNotifications 
}: { 
  children: React.ReactNode, 
  user: User, 
  setUser: (u: User | null) => void,
  notifications: AppNotification[],
  setNotifications: (n: AppNotification[]) => void
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-gray-900 z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0 no-print
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Truck className="text-white" size={24} />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">SM Global</span>
          </div>

          <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
            <SidebarLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/dashboard'} />
            <SidebarLink to="/parcels" icon={Package} label="Paquetes" active={location.pathname === '/parcels'} />
            <SidebarLink to="/customers" icon={Users} label="Clientes" active={location.pathname === '/customers'} />
            {user.role === UserRole.SUPER_ADMIN && (
              <SidebarLink to="/history" icon={HistoryIcon} label="Historial" active={location.pathname === '/history'} />
            )}
            {user.role === UserRole.SUPER_ADMIN && (
              <SidebarLink to="/users" icon={UserSquare2} label="Usuarios" active={location.pathname === '/users'} />
            )}
            {(user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) && (
              <SidebarLink to="/reports" icon={BarChart3} label="Reportes" active={location.pathname === '/reports'} />
            )}
          </nav>

          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center space-x-3 mb-4 px-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate capitalize">{user.role.toLowerCase().replace('_', ' ')} | {user.branch}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 p-3 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 lg:px-8 no-print">
          <button className="lg:hidden p-2" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <div className="flex items-center space-x-4">
             <div className="relative hidden sm:block">
               <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                 <Search size={16} />
               </span>
               <input 
                 type="text" 
                 placeholder="Buscar paquete..." 
                 className="pl-10 pr-4 py-2 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500 w-64"
               />
             </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button 
                onClick={() => setNotifOpen(!notifOpen)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all relative"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[100] overflow-hidden animate-in zoom-in-95 duration-200 origin-top-right">
                  <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-900">Notificaciones</h3>
                    <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:underline font-medium">Marcar todo como leído</button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 text-sm">No hay notificaciones</div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => markAsRead(n.id)}
                          className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${!n.read ? 'bg-blue-50/30' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <h4 className={`text-sm font-bold ${!n.read ? 'text-blue-700' : 'text-gray-700'}`}>{n.title}</h4>
                            {!n.read && <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></div>}
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed">{n.message}</p>
                          <p className="text-[10px] text-gray-400 mt-2">{new Date(n.createdAt).toLocaleTimeString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded">Sistema Activo | {user.branch}</span>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

const LoginPage = ({ setUser, users }: { setUser: (u: User) => void, users: User[] }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        // Fallback local para desarrollo o si el servidor está offline
        const foundUser = users.find(u => u.email === email && u.password === password);
        if (foundUser) {
          setUser(foundUser);
          localStorage.setItem('user', JSON.stringify(foundUser));
        } else {
          setError('Credenciales incorrectas');
        }
      }
    } catch (err) {
      // Fallback local si no hay conexión al servidor
      const foundUser = users.find(u => u.email === email && u.password === password);
      if (foundUser) {
        setUser(foundUser);
        localStorage.setItem('user', JSON.stringify(foundUser));
      } else {
        setError('Servidor no disponible y credenciales locales no coinciden');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Truck className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wider">SM Global Express</h1>
            <p className="text-gray-500 text-center text-sm">Logística Nacional e Internacional</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && <p className="text-red-500 text-center text-sm font-bold bg-red-50 p-2 rounded">{error}</p>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Corporativo</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="usuario@sm-global.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="••••••••"
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg transform hover:scale-[1.02] transition-all"
            >
              Acceder al Panel
            </button>
          </form>
          
          <div className="mt-8 text-center border-t pt-6">
             <Link to="/track" className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center justify-center">
               Ir a Seguimiento Público <ChevronRight size={16} />
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(() => {
    const savedUsers = localStorage.getItem('users');
    return savedUsers ? JSON.parse(savedUsers) : INITIAL_USERS;
  });
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const savedCustomers = localStorage.getItem('customers');
    return savedCustomers ? JSON.parse(savedCustomers) : INITIAL_CUSTOMERS;
  });
  const [parcels, setParcels] = useState<Parcel[]>(() => {
    const savedParcels = localStorage.getItem('parcels');
    return savedParcels ? JSON.parse(savedParcels) : INITIAL_PARCELS;
  });
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('notifications');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));

    // Intentar cargar datos desde MySQL al iniciar
    const fetchInitialData = async () => {
      try {
        const response = await fetch('/api/data');
        if (response.ok) {
          const data = await response.json();
          if (data.parcels?.length > 0) setParcels(data.parcels);
          if (data.customers?.length > 0) setCustomers(data.customers);
          if (data.users?.length > 0) setUsers(data.users);
          console.log("Datos cargados desde MySQL");
        }
      } catch (err) {
        console.log("MySQL no disponible, usando LocalStorage");
      }
    };
    fetchInitialData();

    // Sincronización periódica cada 1 minuto por si acaso
    const syncInterval = setInterval(() => {
      const c = JSON.parse(localStorage.getItem('customers') || '[]');
      const p = JSON.parse(localStorage.getItem('parcels') || '[]');
      const u = JSON.parse(localStorage.getItem('users') || '[]');
      syncWithCloud(c, p, u);
    }, 60000);

    return () => clearInterval(syncInterval);
  }, []);

  const syncWithCloud = async (c: Customer[], p: Parcel[], u: User[]) => {
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parcels: p, customers: c, users: u })
      });
      if (response.ok) {
        console.log("Sincronización automática exitosa");
        window.dispatchEvent(new CustomEvent('sync-status', { detail: { status: 'success' } }));
      } else {
        window.dispatchEvent(new CustomEvent('sync-status', { detail: { status: 'error' } }));
      }
    } catch (err) {
      console.warn("Sincronización automática fallida (servidor offline)");
      window.dispatchEvent(new CustomEvent('sync-status', { detail: { status: 'error' } }));
    }
  };

  const saveState = (c: Customer[], p: Parcel[], u: User[], n: AppNotification[]) => {
    localStorage.setItem('customers', JSON.stringify(c));
    localStorage.setItem('parcels', JSON.stringify(p));
    localStorage.setItem('users', JSON.stringify(u));
    localStorage.setItem('notifications', JSON.stringify(n));
    
    // Sincronización inmediata al guardar cambios
    syncWithCloud(c, p, u);
  };

  const handleSetParcels = (newParcels: Parcel[]) => {
    setParcels(newParcels);
    saveState(customers, newParcels, users, notifications);
  };

  const handleSetCustomers = (newCustomers: Customer[]) => {
    setCustomers(newCustomers);
    saveState(newCustomers, parcels, users, notifications);
  };

  const handleSetUsers = (newUsers: User[]) => {
    setUsers(newUsers);
    saveState(customers, parcels, newUsers, notifications);
  };

  const handleSetNotifications = (newNotifs: AppNotification[]) => {
    setNotifications(newNotifs);
    saveState(customers, parcels, users, newNotifs);
  };

  const addNotification = (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    const newNotif: AppNotification = {
      ...n,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      read: false
    };
    const updated = [newNotif, ...notifications].slice(0, 50); // Keep last 50
    setNotifications(updated);
    saveState(customers, parcels, users, updated);
  };

  if (!user) {
    return (
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage setUser={setUser} users={users} />} />
          <Route path="/track" element={<PublicTracking parcels={parcels} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </HashRouter>
    );
  }

  const filteredNotifications = notifications.filter(n => {
    if (user.role === UserRole.SUPER_ADMIN) return true;
    return n.targetBranch === user.branch;
  });

  return (
    <HashRouter>
      <AppLayout 
        user={user} 
        setUser={setUser} 
        notifications={filteredNotifications} 
        setNotifications={handleSetNotifications}
      >
        <Routes>
          <Route path="/dashboard" element={<Dashboard parcels={parcels} customers={customers} user={user} />} />
          <Route path="/customers" element={<CustomerManagement customers={customers} setCustomers={handleSetCustomers} user={user} addNotification={addNotification} />} />
          <Route path="/parcels" element={<ParcelManagement parcels={parcels} setParcels={handleSetParcels} customers={customers} user={user} addNotification={addNotification} />} />
          <Route path="/history" element={user.role === UserRole.SUPER_ADMIN ? <History parcels={parcels} customers={customers} user={user} /> : <Navigate to="/dashboard" />} />
          <Route path="/users" element={user.role === UserRole.SUPER_ADMIN ? <UserManagement users={users} setUsers={handleSetUsers} currentUser={user} /> : <Navigate to="/dashboard" />} />
          <Route path="/reports" element={(user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) ? <Reports parcels={parcels} user={user} /> : <Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AppLayout>
    </HashRouter>
  );
}
