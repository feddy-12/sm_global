
import React from 'react';
import { BarChart3, Download, PieChart, Calendar, FileText } from 'lucide-react';
import { Parcel, ParcelStatus, User, UserRole } from '../types';
import { CURRENCY } from '../constants';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RPieChart, Pie, Cell, Legend
} from 'recharts';

export default function Reports({ parcels, user }: { parcels: Parcel[], user: User }) {
  // VISIBILIDAD BIDIRECCIONAL TAMBIÉN EN REPORTES
  const filteredParcels = user.role === UserRole.SUPER_ADMIN 
    ? parcels 
    : parcels.filter(p => p.origin === user.branch || p.destination === user.branch);

  const statusData = [
    { name: 'Entregados', value: filteredParcels.filter(p => p.status === ParcelStatus.DELIVERED).length },
    { name: 'En Proceso', value: filteredParcels.filter(p => p.status !== ParcelStatus.DELIVERED).length },
  ];

  const COLORS = ['#10b981', '#3b82f6'];

  // RECAUDACIÓN: Solo lo facturado en la sucursal (origin) para Admins
  const revenueParcels = user.role === UserRole.SUPER_ADMIN
    ? parcels
    : parcels.filter(p => p.origin === user.branch);

  const monthlyRevenue = [
    { name: 'Ene', total: 450000 },
    { name: 'Feb', total: 520000 },
    { name: 'Mar', total: 480000 },
    { name: 'Abr', total: 610000 },
    { name: 'Mes Actual', total: revenueParcels.reduce((acc, p) => acc + Number(p.cost || 0), 0) },
  ];

  const handleExportCSV = () => {
    const headers = ['Guía', 'Receptor', 'Origen', 'Destino', 'Costo', 'Estado', 'Fecha'];
    const rows = filteredParcels.map(p => [
      p.trackingCode, p.receiverName, p.origin, p.destination, p.cost, p.status, 
      new Date(p.createdAt).toLocaleDateString()
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `reporte_SMGlobal_${user.branch}_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inteligencia de Negocio</h1>
          <p className="text-gray-500">Métricas SM Global Express - {user.role === UserRole.SUPER_ADMIN ? 'Red Global' : user.branch}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="bg-white border p-3 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
            <Download size={18} className="text-green-600" /> Exportar CSV
          </button>
          <button onClick={() => window.print()} className="bg-blue-600 text-white p-3 rounded-lg flex items-center gap-2 text-sm font-medium shadow-md">
            <FileText size={18} /> Generar PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-96">
           <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><BarChart3 size={20} className="text-blue-600" /> Rendimiento de Ingresos ({CURRENCY})</h2>
           <ResponsiveContainer width="100%" height="90%">
             <BarChart data={monthlyRevenue}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
               <XAxis dataKey="name" axisLine={false} tickLine={false} />
               <YAxis axisLine={false} tickLine={false} />
               <Tooltip />
               <Bar dataKey="total" fill="#2563eb" radius={[6, 6, 0, 0]} />
             </BarChart>
           </ResponsiveContainer>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-96">
           <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><PieChart size={20} className="text-green-600" /> Efectividad de Entregas</h2>
           <ResponsiveContainer width="100%" height="90%">
              <RPieChart>
                <Pie data={statusData} innerRadius={60} outerRadius={80} dataKey="value" paddingAngle={5}>
                  {statusData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </RPieChart>
           </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
