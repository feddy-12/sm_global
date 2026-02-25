
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Users, TrendingUp, Clock, BrainCircuit, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { Parcel, Customer, User, ParcelStatus, UserRole } from '../types';
import { CURRENCY } from '../constants';
import { getIntelligentReport } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const StatCard = ({ title, value, icon: Icon, color, subValue }: { title: string, value: string | number, icon: any, color: string, subValue?: string }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="text-white" size={24} />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
    </div>
  </div>
);

export default function Dashboard({ parcels, customers, user }: { parcels: Parcel[], customers: Customer[], user: User }) {
  const [aiReport, setAiReport] = useState<string>('Analizando datos...');
  const [loadingAi, setLoadingAi] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');

  const handleSync = async () => {
    setSyncStatus('syncing');
    try {
      // Obtenemos todos los datos de localStorage para asegurar que enviamos todo
      const localParcels = JSON.parse(localStorage.getItem('parcels') || '[]');
      const localCustomers = JSON.parse(localStorage.getItem('customers') || '[]');
      const localUsers = JSON.parse(localStorage.getItem('users') || '[]');

      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          parcels: localParcels, 
          customers: localCustomers, 
          users: localUsers 
        })
      });

      if (response.ok) {
        setSyncStatus('success');
        setSyncMessage('Datos sincronizados con MySQL');
        setTimeout(() => setSyncStatus('idle'), 3000);
      } else {
        const err = await response.json();
        throw new Error(err.error || 'Error en el servidor');
      }
    } catch (error: any) {
      setSyncStatus('error');
      setSyncMessage(error.message);
      setTimeout(() => setSyncStatus('idle'), 5000);
    }
  };

  // FILTRO CLAVE: Super Admin ve todo. 
  // Otros ven paquetes donde sucursal es ORIGEN o sucursal es DESTINO.
  const filteredParcels = user.role === UserRole.SUPER_ADMIN 
    ? parcels 
    : parcels.filter(p => p.origin === user.branch || p.destination === user.branch);

  // RECAUDACIÓN: 
  // Super Admin -> Global
  // Admin -> Solo lo facturado en su sucursal (origin === branch)
  // Operador -> No ve recaudación (se oculta en el UI)
  const revenueParcels = user.role === UserRole.SUPER_ADMIN
    ? parcels
    : parcels.filter(p => p.origin === user.branch);

  const stats = {
    total: filteredParcels.length,
    delivered: filteredParcels.filter(p => p.status === ParcelStatus.DELIVERED).length,
    pending: filteredParcels.filter(p => p.status !== ParcelStatus.DELIVERED).length,
    revenue: revenueParcels.reduce((acc, curr) => acc + Number(curr.cost || 0), 0),
  };

  const chartData = [
    { name: 'En espera', value: filteredParcels.filter(p => p.status === ParcelStatus.RECEIVED).length, color: '#3b82f6' },
    { name: 'Tránsito', value: filteredParcels.filter(p => p.status === ParcelStatus.IN_TRANSIT).length, color: '#f59e0b' },
    { name: 'Almacén', value: filteredParcels.filter(p => p.status === ParcelStatus.IN_WAREHOUSE).length, color: '#6366f1' },
    { name: 'Entregado', value: filteredParcels.filter(p => p.status === ParcelStatus.DELIVERED).length, color: '#10b981' },
  ];

  useEffect(() => {
    const handleSyncEvent = (e: any) => {
      if (e.detail.status === 'success') {
        setSyncStatus('success');
        setSyncMessage('Sincronizado');
        setTimeout(() => setSyncStatus('idle'), 3000);
      } else {
        setSyncStatus('error');
        setSyncMessage('Error de conexión');
      }
    };

    window.addEventListener('sync-status', handleSyncEvent);
    return () => window.removeEventListener('sync-status', handleSyncEvent);
  }, []);

  useEffect(() => {
    const fetchAiReport = async () => {
      setLoadingAi(true);
      const report = await getIntelligentReport({
        branch: user.role === UserRole.SUPER_ADMIN ? 'Global' : user.branch,
        total_parcels: stats.total,
        total_revenue: stats.revenue,
        delivered_count: stats.delivered,
        pending_count: stats.pending,
        currency: CURRENCY
      });
      setAiReport(report || "No se pudo obtener el reporte.");
      setLoadingAi(false);
    };

    fetchAiReport();
  }, [user.branch, user.role, stats.total]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hola, {user.name}</h1>
          <p className="text-gray-500">Panel operativo SM Global Express - {user.branch}.</p>
        </div>
        <div className="flex items-center gap-3">
          {syncStatus !== 'idle' && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold animate-in fade-in slide-in-from-right-4 ${
              syncStatus === 'syncing' ? 'bg-blue-100 text-blue-700' :
              syncStatus === 'success' ? 'bg-green-100 text-green-700' :
              'bg-red-100 text-red-700'
            }`}>
              {syncStatus === 'syncing' && <RefreshCw className="animate-spin" size={14} />}
              {syncStatus === 'success' && <CheckCircle2 size={14} />}
              {syncStatus === 'error' && <AlertCircle size={14} />}
              {syncStatus === 'syncing' ? 'Sincronizando...' : syncMessage}
            </div>
          )}
          <button 
            onClick={handleSync}
            disabled={syncStatus === 'syncing'}
            title="Clic para sincronizar manualmente"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50 ${
              syncStatus === 'error' ? 'bg-red-50 border border-red-100 text-red-700' :
              syncStatus === 'success' ? 'bg-green-50 border border-green-100 text-green-700' :
              'bg-blue-50 border border-blue-100 text-blue-700'
            }`}
          >
            <RefreshCw size={18} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
            {syncStatus === 'error' ? 'Error de Sincronización' : 
             syncStatus === 'success' ? 'Sincronizado' : 
             syncStatus === 'syncing' ? 'Sincronizando...' : 'Auto-Sync Activo'}
          </button>
          <div className="text-sm bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium border border-blue-100">
            En línea: {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Envíos bajo control" value={stats.total} icon={Package} color="bg-blue-600" subValue="Origen o Destino actual" />
        <StatCard title="Entregados" value={stats.delivered} icon={Clock} color="bg-green-600" subValue="Proceso finalizado" />
        <StatCard title="Pendientes" value={stats.pending} icon={TrendingUp} color="bg-amber-500" subValue="Por procesar" />
        {user.role !== UserRole.OPERATOR && (
          <StatCard title="Recaudación" value={`${stats.revenue.toLocaleString()} ${CURRENCY}`} icon={Users} color="bg-indigo-600" subValue={user.role === UserRole.SUPER_ADMIN ? "Volumen Global" : "Facturado en esta sucursal"} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-500" />
            Flujo Logístico ({user.role === UserRole.SUPER_ADMIN ? 'Global' : user.branch})
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f9fafb'}} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-900 to-indigo-800 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center space-x-2 mb-4">
              <BrainCircuit className="text-blue-300" size={24} />
              <h2 className="text-lg font-semibold">Logística Inteligente</h2>
            </div>
            {loadingAi ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <p className="text-blue-50 text-sm leading-relaxed italic">
                  "{aiReport}"
                </p>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-white/10 text-xs text-blue-200">
              SM Global - Gemini AI Insights
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Actividad en {user.role === UserRole.SUPER_ADMIN ? 'Red Global' : user.branch}</h2>
          <Link to="/parcels" className="text-sm text-blue-600 font-medium hover:underline">Gestionar todos</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
              <tr>
                <th className="px-6 py-3">Código</th>
                <th className="px-6 py-3">Destinatario</th>
                <th className="px-6 py-3">Ruta</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredParcels.slice(0, 10).map(parcel => (
                <tr key={parcel.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-blue-600">{parcel.trackingCode}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{parcel.receiverName}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                    {parcel.origin} <span className="text-gray-300 mx-1">→</span> {parcel.destination}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      parcel.status === ParcelStatus.DELIVERED ? 'bg-green-100 text-green-700' :
                      parcel.status === ParcelStatus.IN_TRANSIT ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {parcel.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold">{Number(parcel.cost || 0).toLocaleString()} {CURRENCY}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
