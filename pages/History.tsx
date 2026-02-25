
import React, { useState } from 'react';
import { History as HistoryIcon, Search, Printer, Filter, Calendar, MapPin, Package, User as UserIcon, Download } from 'lucide-react';
import { Parcel, Customer, ParcelStatus, UserRole, User } from '../types';
import { CURRENCY } from '../constants';

export default function History({ parcels, customers, user }: { parcels: Parcel[], customers: Customer[], user: User }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');

  const filteredParcels = parcels.filter(p => {
    const matchesSearch = 
      p.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.receiverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customers.find(c => c.id === p.senderId)?.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesBranch = branchFilter === 'all' || p.origin === branchFilter || p.destination === branchFilter;
    
    const parcelDate = new Date(p.createdAt).getTime();
    const matchesDateStart = !dateStart || parcelDate >= new Date(dateStart).getTime();
    const matchesDateEnd = !dateEnd || parcelDate <= new Date(dateEnd).getTime() + 86400000; // +1 day to include the end date

    return matchesSearch && matchesStatus && matchesBranch && matchesDateStart && matchesDateEnd;
  });

  const handlePrint = () => {
    window.print();
  };

  const branches = Array.from(new Set(parcels.flatMap(p => [p.origin, p.destination])));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Print-only Header */}
      <div className="hidden print:block p-8 bg-white border-b-2 border-gray-900 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-tighter">SM Global Express</h1>
            <p className="text-sm text-gray-500">Logística Nacional e Internacional - Guinea Ecuatorial</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold">REPORTE DE HISTORIAL</h2>
            <p className="text-xs text-gray-400">Filtros aplicados: {statusFilter !== 'all' ? `Estado: ${statusFilter}` : ''} {branchFilter !== 'all' ? `Sucursal: ${branchFilter}` : ''}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HistoryIcon className="text-blue-600" /> Historial de Envíos
          </h1>
          <p className="text-gray-500">Consulta avanzada y auditoría de paquetes</p>
        </div>
        <button 
          onClick={handlePrint}
          className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-lg font-medium transition-all"
        >
          <Printer size={20} /> Imprimir Reporte
        </button>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4 no-print">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por código, cliente..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400" size={18} />
            <select 
              className="flex-1 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos los Estados</option>
              {Object.values(ParcelStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="text-gray-400" size={18} />
            <select 
              className="flex-1 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            >
              <option value="all">Todas las Sucursales</option>
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="text-gray-400" size={18} />
            <div className="flex-1 flex items-center gap-2">
              <input 
                type="date" 
                className="flex-1 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
              />
              <span className="text-gray-400">a</span>
              <input 
                type="date" 
                className="flex-1 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end items-center gap-4">
            <button 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setBranchFilter('all');
                setDateStart('');
                setDateEnd('');
              }}
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Fecha</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Código</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Remitente</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Destinatario</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Ruta</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Costo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredParcels.map(parcel => (
                <tr key={parcel.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(parcel.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-bold text-blue-600 font-mono">{parcel.trackingCode}</span>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-medium text-gray-900">
                      {customers.find(c => c.id === parcel.senderId)?.fullName || 'N/A'}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-medium text-gray-900">{parcel.receiverName}</div>
                    <div className="text-xs text-gray-400">{parcel.receiverPhone}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center text-xs text-gray-500">
                      <span className="font-semibold">{parcel.origin}</span>
                      <span className="mx-1">→</span>
                      <span className="font-semibold">{parcel.destination}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      parcel.status === ParcelStatus.DELIVERED ? 'bg-green-100 text-green-700' :
                      parcel.status === ParcelStatus.IN_TRANSIT ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {parcel.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-sm font-bold text-gray-900">
                      {Number(parcel.cost || 0).toLocaleString()} {CURRENCY}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredParcels.length === 0 && (
          <div className="py-20 text-center text-gray-400 font-medium">
            No se encontraron envíos con los filtros seleccionados.
          </div>
        )}

        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center print-only">
          <div className="text-xs text-gray-500">
            Reporte generado el {new Date().toLocaleString()} por {user.name}
          </div>
          <div className="text-sm font-bold text-gray-900">
            Total Envíos: {filteredParcels.length} | Total Recaudado: {filteredParcels.reduce((acc, p) => acc + Number(p.cost || 0), 0).toLocaleString()} {CURRENCY}
          </div>
        </div>
      </div>
    </div>
  );
}
