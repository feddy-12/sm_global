
import React, { useState } from 'react';
import { UserSquare2, Plus, Search, Trash2, Shield, X, Mail, User as UserIcon, Home } from 'lucide-react';
import { User, UserRole } from '../types';
import { CITIES } from '../constants';

export default function UserManagement({ users, setUsers, currentUser }: { users: User[], setUsers: (u: User[]) => void, currentUser: User }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: UserRole.OPERATOR, branch: currentUser.branch });

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
    // Un ADMIN solo ve usuarios de su propia sucursal
    const matchesBranch = currentUser.role === UserRole.SUPER_ADMIN ? true : u.branch === currentUser.branch;
    return matchesSearch && matchesBranch;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: `u-${Date.now()}`,
      ...formData
    };
    setUsers([...users, newUser]);
    setIsModalOpen(false);
    setFormData({ name: '', email: '', password: '', role: UserRole.OPERATOR, branch: currentUser.branch });
  };

  const deleteUser = (id: string) => {
    const userToDelete = users.find(u => u.id === id);
    if (userToDelete?.role === UserRole.SUPER_ADMIN) {
      alert('No se puede eliminar un Super Administrador.');
      return;
    }
    if (confirm('¿Eliminar este usuario de forma permanente?')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="text-blue-600" />
            Personal de {currentUser.role === UserRole.SUPER_ADMIN ? 'Red Global' : currentUser.branch}
          </h1>
          <p className="text-gray-500">Gestión de roles y accesos por sucursal.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg font-medium">
          <Plus size={20} /> Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <Search size={18} />
            </span>
            <input 
              type="text" 
              placeholder="Buscar por nombre o correo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full bg-gray-50 border rounded-lg outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
              <tr>
                <th className="px-6 py-3">Nombre</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Sucursal</th>
                <th className="px-6 py-3">Rol</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.branch}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${
                      user.role === UserRole.SUPER_ADMIN ? 'bg-purple-100 text-purple-700' :
                      user.role === UserRole.ADMIN ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {user.id !== currentUser.id && user.role !== UserRole.SUPER_ADMIN && (
                      <button onClick={() => deleteUser(user.id)} className="p-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-xl font-bold">Añadir Nuevo Usuario</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Nombre Completo" required className="w-full px-4 py-2 border rounded-xl" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              <input type="email" placeholder="Correo Corporativo" required className="w-full px-4 py-2 border rounded-xl" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              <input type="password" placeholder="Contraseña Temporal" required className="w-full px-4 py-2 border rounded-xl" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
              
              <div className="grid grid-cols-2 gap-4">
                <select className="px-4 py-2 border rounded-xl" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}>
                  <option value={UserRole.OPERATOR}>Operador</option>
                  <option value={UserRole.ADMIN}>Administrador</option>
                  {currentUser.role === UserRole.SUPER_ADMIN && <option value={UserRole.SUPER_ADMIN}>Super Admin</option>}
                </select>
                <select className="px-4 py-2 border rounded-xl" value={formData.branch} onChange={(e) => setFormData({...formData, branch: e.target.value})}>
                  <option value="Sede Central">Sede Central</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border rounded-xl">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
