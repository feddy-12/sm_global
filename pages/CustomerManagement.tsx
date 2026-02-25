
import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, X } from 'lucide-react';
import { Customer, User, UserRole, AppNotification } from '../types';

export default function CustomerManagement({ 
  customers, 
  setCustomers, 
  user,
  addNotification
}: { 
  customers: Customer[], 
  setCustomers: (c: Customer[]) => void, 
  user: User,
  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({ fullName: '', phone: '', address: '', dni: '', email: '' });

  const filteredCustomers = customers.filter(c => 
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.dni.includes(searchTerm) ||
    c.phone.includes(searchTerm)
  );

  // Los Operadores NO pueden añadir ni editar clientes
  const canManageCustomers = user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageCustomers) return;

    if (editingCustomer) {
      setCustomers(customers.map(c => c.id === editingCustomer.id ? { ...formData, id: c.id } : c));
    } else {
      const newCustomer = { ...formData, id: Math.random().toString(36).substr(2, 9) };
      setCustomers([...customers, newCustomer]);
      
      addNotification({
        title: 'Nuevo Cliente Registrado',
        message: `Se ha registrado un nuevo cliente: ${newCustomer.fullName} en la sucursal ${user.branch}.`,
        type: 'success'
      });
    }
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
    setFormData({ fullName: '', phone: '', address: '', dni: '', email: '' });
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      fullName: customer.fullName,
      phone: customer.phone,
      address: customer.address,
      dni: customer.dni,
      email: customer.email || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Desea eliminar este cliente permanentemente?')) {
      setCustomers(customers.filter(c => c.id !== id));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Base de Datos de Clientes</h1>
          <p className="text-gray-500">Registro histórico de remitentes registrados en {user.branch}.</p>
        </div>
        {canManageCustomers && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-lg font-medium transition-all"
          >
            <Plus size={20} /> Nuevo Registro
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <Search size={18} />
            </span>
            <input 
              type="text" 
              placeholder="Buscar por nombre o identificación..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full bg-gray-50 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
              <tr>
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">ID / DNI</th>
                <th className="px-6 py-3">Teléfono</th>
                {canManageCustomers && <th className="px-6 py-3 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.map(customer => (
                <tr key={customer.id} className="hover:bg-gray-50 group transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{customer.fullName}</div>
                    <div className="text-xs text-gray-500">{customer.email || 'Sin correo vinculado'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-600">{customer.dni}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{customer.phone}</td>
                  {canManageCustomers && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(customer)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(customer.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={canManageCustomers ? 4 : 3} className="px-6 py-12 text-center text-gray-400">
                    No se encontraron clientes que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && canManageCustomers && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-6 animate-in zoom-in duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">{editingCustomer ? 'Editar Perfil de Cliente' : 'Nuevo Cliente'}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nombre Completo</label>
                <input type="text" required className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">DNI / Pasaporte</label>
                  <input type="text" required className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.dni} onChange={(e) => setFormData({...formData, dni: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Teléfono</label>
                  <input type="tel" required className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Dirección Física</label>
                <textarea required className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})}></textarea>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 py-3 border rounded-xl text-gray-500 font-bold hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
