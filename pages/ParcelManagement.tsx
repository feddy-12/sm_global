
import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, Printer, Eye, MapPin, X, CheckCircle, User as UserIcon, BrainCircuit, Scale } from 'lucide-react';
import { Parcel, Customer, ParcelStatus, PaymentMethod, UserRole, User } from '../types';
import { PARCEL_TYPES, PROVINCES, CITIES, CURRENCY } from '../constants';
import { suggestPrice } from '../services/geminiService';
import { AppNotification } from '../types';

export default function ParcelManagement({ 
  parcels, 
  setParcels, 
  customers, 
  user,
  addNotification
}: { 
  parcels: Parcel[], 
  setParcels: (p: Parcel[]) => void, 
  customers: Customer[], 
  user: User,
  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [isSuggestingPrice, setIsSuggestingPrice] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Parcel>>({
    senderId: '',
    receiverName: '',
    receiverPhone: '',
    receiverAddress: '',
    origin: user.branch !== 'Sede Central' ? user.branch : 'Malabo',
    destination: 'Bata',
    weight: 0,
    type: PARCEL_TYPES[0],
    cost: 0,
    paymentMethod: PaymentMethod.CASH,
    paymentStatus: 'Pendiente'
  });

  // El Operador NO puede añadir paquetes, solo actualizar estados
  const canAddParcel = user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN;

  // VISIBILIDAD: El admin de Malabo debe ver lo que sale de Malabo O lo que va para Malabo.
  const filteredParcels = parcels.filter(p => {
    const matchesSearch = p.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.receiverName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro bidireccional
    const isOrigin = p.origin === user.branch;
    const isDestination = p.destination === user.branch;
    const matchesBranch = user.role === UserRole.SUPER_ADMIN ? true : (isOrigin || isDestination);
    
    return matchesSearch && matchesBranch;
  });

  const handleSuggestPrice = async () => {
    if (!formData.weight || !formData.origin || !formData.destination) {
      alert("Por favor, indique peso, origen y destino para sugerir un precio.");
      return;
    }
    setIsSuggestingPrice(true);
    const price = await suggestPrice(
      formData.weight,
      formData.origin,
      formData.destination,
      formData.type || 'Normal'
    );
    setFormData(prev => ({ ...prev, cost: price }));
    setIsSuggestingPrice(false);
  };

  const handleCreateParcel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAddParcel) return;

    const newParcel: Parcel = {
      ...formData as Parcel,
      id: Math.random().toString(36).substr(2, 9),
      trackingCode: `SM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: ParcelStatus.RECEIVED,
      branch: user.branch,
      createdById: user.id,
      createdByName: user.name,
      createdAt: new Date().toISOString(),
      history: [{ 
        status: ParcelStatus.RECEIVED, 
        date: new Date().toISOString(), 
        note: `Registrado en sucursal ${user.branch}`,
        updatedBy: user.name 
      }]
    };
    setParcels([newParcel, ...parcels]);
    
    // Notificar a la sucursal de destino
    addNotification({
      title: 'Nuevo Envío Entrante',
      message: `Nuevo envío ${newParcel.trackingCode} registrado desde ${newParcel.origin} con destino a ${newParcel.destination}.`,
      type: 'info',
      targetBranch: newParcel.destination,
      parcelId: newParcel.id,
      trackingCode: newParcel.trackingCode
    });

    setIsModalOpen(false);
    // Reset
    setFormData({
      senderId: '',
      receiverName: '',
      receiverPhone: '',
      receiverAddress: '',
      origin: user.branch !== 'Sede Central' ? user.branch : 'Malabo',
      destination: 'Bata',
      weight: 0,
      type: PARCEL_TYPES[0],
      cost: 0,
      paymentMethod: PaymentMethod.CASH,
      paymentStatus: 'Pendiente'
    });
  };

  const updateStatus = (id: string, newStatus: ParcelStatus) => {
    console.log(`Updating parcel ${id} to status: ${newStatus}`);
    let updatedParcel: Parcel | null = null;
    
    setParcels(parcels.map(p => {
      if (p.id === id) {
        updatedParcel = {
          ...p,
          status: newStatus,
          history: [...p.history, { 
            status: newStatus, 
            date: new Date().toISOString(), 
            note: `Estado actualizado en ${user.branch} por ${user.name}`,
            updatedBy: user.name 
          }]
        };
        return updatedParcel;
      }
      return p;
    }));

    if (updatedParcel) {
      const p = updatedParcel as Parcel;
      setSelectedParcel(p); // Mantener abierto con el nuevo estado
      
      // Notificaciones por evento
      if (newStatus === ParcelStatus.IN_TRANSIT) {
        addNotification({
          title: 'Paquete en Camino',
          message: `El paquete ${p.trackingCode} ha sido despachado desde ${user.branch} hacia ${p.destination}.`,
          type: 'warning',
          targetBranch: p.destination,
          parcelId: p.id,
          trackingCode: p.trackingCode
        });
      } else if (newStatus === ParcelStatus.IN_WAREHOUSE) {
        // Notificación SMS vía Twilio al RECEPTOR
        if (p.receiverPhone) {
          fetch('/api/notify-sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: p.receiverPhone,
              message: `SM Global Express: Hola ${p.receiverName}, su paquete ${p.trackingCode} ya está disponible en el almacén de ${user.branch} para su recogida.`
            })
          }).catch(err => console.error("Error al disparar SMS:", err));
        }
        
        addNotification({
          title: 'Paquete en Almacén',
          message: `El paquete ${p.trackingCode} ha llegado al almacén de ${user.branch}.`,
          type: 'info',
          targetBranch: user.branch,
          parcelId: p.id,
          trackingCode: p.trackingCode
        });
      } else if (newStatus === ParcelStatus.DELIVERED) {
        addNotification({
          title: 'Paquete Entregado',
          message: `El paquete ${p.trackingCode} enviado desde ${p.origin} ha sido entregado en ${user.branch}.`,
          type: 'success',
          targetBranch: p.origin,
          parcelId: p.id,
          trackingCode: p.trackingCode
        });
      }
    }

    setSelectedParcel(updatedParcel);
  };

  const ReceiptPrint = ({ parcel }: { parcel: Parcel }) => {
    const sender = customers.find(c => c.id === parcel.senderId);
    return (
      <div id="receipt-print" className="p-8 bg-white text-gray-900 font-mono text-sm print-only border-2 border-black">
        <div className="text-center border-b-2 border-dashed border-gray-400 pb-4 mb-4">
          <h1 className="text-xl font-bold uppercase">SM Global Express</h1>
          <p className="text-xs">Sucursal Emisora: {parcel.origin}</p>
          <p className="text-xs">Registrado por: {parcel.createdByName}</p>
        </div>
        <div className="space-y-2 mb-4">
          <div className="flex justify-between">
            <span className="font-bold">Guía Tracking:</span>
            <span>{parcel.trackingCode}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Remitente:</span>
            <span>{sender?.fullName}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Destinatario:</span>
            <span>{parcel.receiverName}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Ruta:</span>
            <span className="font-bold">{parcel.origin} → {parcel.destination}</span>
          </div>
        </div>
        <div className="border-y border-dashed border-gray-400 py-2 mb-4">
          <div className="flex justify-between">
            <span>Tipo:</span>
            <span>{parcel.type}</span>
          </div>
          <div className="flex justify-between">
            <span>Peso:</span>
            <span>{parcel.weight} Kg</span>
          </div>
          <div className="flex justify-between text-lg font-bold mt-2">
            <span>TOTAL PAGADO:</span>
            <span>{Number(parcel.cost || 0).toLocaleString()} {CURRENCY}</span>
          </div>
        </div>
        <div className="text-center text-[10px] mt-6">
          <p>Gracias por confiar en SM Global Express.</p>
          <p>Rastreo público en tiempo real.</p>
          <p className="mt-2">{new Date(parcel.createdAt).toLocaleString()}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="no-print space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Envíos SM Global</h1>
            <p className="text-gray-500">
              {user.role === UserRole.SUPER_ADMIN ? 'Visibilidad Global' : `Logística de ${user.branch}`}
            </p>
          </div>
          {canAddParcel && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 font-medium transition-all"
            >
              <Plus size={20} /> Registrar Nuevo Envío
            </button>
          )}
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-2">
             <Search size={20} className="text-gray-400" />
             <input 
              type="text" 
              placeholder="Buscar por código SM-202... o destinatario..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm outline-none"
             />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredParcels.map(parcel => (
            <div key={parcel.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-300 transition-all group cursor-pointer relative" onClick={() => setSelectedParcel(parcel)}>
              {parcel.destination === user.branch && parcel.status !== ParcelStatus.DELIVERED && (
                 <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl animate-pulse">
                   PAQUETE ENTRANTE
                 </div>
              )}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded mb-2 inline-block">
                    {parcel.trackingCode}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900">{parcel.receiverName}</h3>
                  <div className="flex items-center text-gray-500 text-sm mt-1">
                    <MapPin size={14} className="mr-1" />
                    <span className={parcel.origin === user.branch ? 'font-bold text-blue-700' : ''}>{parcel.origin}</span>
                    <span className="mx-2 text-gray-300">→</span>
                    <span className={parcel.destination === user.branch ? 'font-bold text-indigo-700' : ''}>{parcel.destination}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                    parcel.status === ParcelStatus.DELIVERED ? 'bg-green-100 text-green-700' :
                    parcel.status === ParcelStatus.IN_TRANSIT ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {parcel.status}
                  </span>
                  <span className="text-lg font-bold text-gray-900">{Number(parcel.cost || 0).toLocaleString()} {CURRENCY}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                 <div className="text-xs text-gray-400 space-y-1">
                    <p>Sucursal Emisora: {parcel.origin} | Peso: {parcel.weight}kg</p>
                    <p className="flex items-center gap-1"><UserIcon size={12} /> Responsable: <span className="font-semibold text-gray-600">{parcel.createdByName}</span></p>
                 </div>
                 <div className="flex space-x-2">
                   <button onClick={(e) => { e.stopPropagation(); setSelectedParcel(parcel); setTimeout(() => window.print(), 500); }} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                     <Printer size={18} />
                   </button>
                   <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                     <Eye size={18} />
                   </button>
                 </div>
              </div>
            </div>
          ))}
          {filteredParcels.length === 0 && (
            <div className="lg:col-span-2 py-20 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 font-medium">
              No hay paquetes registrados que coincidan con sucursal o búsqueda.
            </div>
          )}
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in duration-300">
              <div className="p-6 border-b flex items-center justify-between bg-blue-700 text-white">
                <div className="flex items-center gap-2">
                  <Package size={24} />
                  <h2 className="text-xl font-bold">SM Global - Registro de Envío</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={20} /></button>
              </div>
              
              <form onSubmit={handleCreateParcel} className="p-6 overflow-y-auto max-h-[85vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <section>
                      <h3 className="text-sm font-bold text-blue-700 uppercase mb-4 flex items-center gap-2">
                        <UserIcon size={16} /> Remitente (Cliente)
                      </h3>
                      <div className="space-y-4">
                        <select required className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.senderId} onChange={(e) => setFormData({...formData, senderId: e.target.value})}>
                          <option value="">Seleccionar Cliente Registrado</option>
                          {customers.map(c => <option key={c.id} value={c.id}>{c.fullName} ({c.dni})</option>)}
                        </select>
                        <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded-lg border border-blue-100 italic">
                          Solo clientes previamente registrados pueden realizar envíos.
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-sm font-bold text-blue-700 uppercase mb-4 flex items-center gap-2">
                        <MapPin size={16} /> Destinatario Final
                      </h3>
                      <div className="space-y-4">
                        <input type="text" placeholder="Nombre completo del destinatario" required className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.receiverName} onChange={(e) => setFormData({...formData, receiverName: e.target.value})} />
                        <input type="tel" placeholder="Teléfono de contacto" required className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.receiverPhone} onChange={(e) => setFormData({...formData, receiverPhone: e.target.value})} />
                        <textarea placeholder="Dirección exacta de entrega" required className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-24" value={formData.receiverAddress} onChange={(e) => setFormData({...formData, receiverAddress: e.target.value})}></textarea>
                      </div>
                    </section>
                  </div>

                  <div className="space-y-6">
                    <section>
                      <h3 className="text-sm font-bold text-blue-700 uppercase mb-4 flex items-center gap-2">
                        <Scale size={16} /> Logística y Ruta
                      </h3>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Origen</label>
                          <input type="text" disabled className="w-full px-4 py-3 border rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed font-medium" value={user.branch} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Destino Final</label>
                          <select 
                            required 
                            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium" 
                            value={formData.destination} 
                            onChange={(e) => setFormData({...formData, destination: e.target.value})}
                          >
                            <option value="">Seleccionar Ciudad</option>
                            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                            <optgroup label="Provincias">
                              {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                            </optgroup>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tipo de Mercancía</label>
                          <select required className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                            {PARCEL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Peso (Kg)</label>
                          <input type="number" step="0.1" required className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={isNaN(formData.weight || 0) ? '' : formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value === '' ? 0 : parseFloat(e.target.value)})} />
                        </div>
                      </div>
                    </section>

                    <section className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                      <h3 className="text-sm font-bold text-gray-600 uppercase mb-4 flex items-center gap-2">
                        Pago y Facturación
                      </h3>
                      <div className="space-y-4">
                        <div className="relative">
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Costo Estimado ({CURRENCY})</label>
                          <input type="number" required className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-xl" value={isNaN(formData.cost || 0) ? '' : formData.cost} onChange={(e) => setFormData({...formData, cost: e.target.value === '' ? 0 : parseInt(e.target.value)})} />
                          <button type="button" onClick={handleSuggestPrice} className="absolute right-2 top-7 flex items-center gap-1 bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-800 transition-colors shadow-sm">
                            <BrainCircuit size={14} /> {isSuggestingPrice ? 'Calculando...' : 'IA Sugerir'}
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Método</label>
                            <select className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.paymentMethod} onChange={(e) => setFormData({...formData, paymentMethod: e.target.value as PaymentMethod})}>
                              {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Estado</label>
                            <select className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.paymentStatus} onChange={(e) => setFormData({...formData, paymentStatus: e.target.value as 'Pagado' | 'Pendiente'})}>
                              <option value="Pendiente">Pendiente</option>
                              <option value="Pagado">Pagado</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>

                <div className="flex gap-4 pt-8 border-t border-gray-100 mt-8">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 border rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors">Cerrar</button>
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all text-lg">
                    Confirmar Envío SM Global
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {selectedParcel && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-6 animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Estado de Guía</h2>
                  <p className="text-sm text-gray-500 font-mono font-bold">{selectedParcel.trackingCode}</p>
                </div>
                <button onClick={() => setSelectedParcel(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20}/></button>
              </div>
              
              <div className="space-y-3">
                <div className="text-xs text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="flex justify-between mb-2"><span>Remitente:</span> <span className="font-bold text-gray-900">{customers.find(c => c.id === selectedParcel.senderId)?.fullName}</span></p>
                  <p className="flex justify-between mb-2"><span>Destinatario:</span> <span className="font-bold text-gray-900">{selectedParcel.receiverName}</span></p>
                  <p className="flex justify-between pt-2 border-t border-gray-200"><span>Ruta:</span> <span className="font-bold text-blue-700">{selectedParcel.origin} → {selectedParcel.destination}</span></p>
                </div>

                <div className="p-3 bg-blue-50 rounded-xl flex items-center gap-2 text-[10px] text-blue-800 font-medium">
                   <UserIcon size={14} /> Registrado por: <strong>{selectedParcel.createdByName}</strong>
                </div>

                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest pt-4">Actualizar Estado Logístico</h4>
                <div className="grid grid-cols-1 gap-2">
                  {Object.values(ParcelStatus).map(status => (
                    <button 
                      key={status} 
                      onClick={(e) => {
                        e.preventDefault();
                        updateStatus(selectedParcel.id, status);
                      }} 
                      className={`py-4 rounded-2xl text-sm font-bold border-2 transition-all flex items-center justify-between px-6 cursor-pointer active:scale-95 ${
                        selectedParcel.status === status 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                        : 'bg-white text-gray-500 border-gray-100 hover:border-blue-200'
                      }`}
                    >
                      {status}
                      {selectedParcel.status === status && <CheckCircle size={18} />}
                    </button>
                  ))}
                </div>

                {/* Historial Visual (Timeline) */}
                <div className="pt-6 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Historial de Movimientos</h4>
                  <div className="space-y-4">
                    {selectedParcel.history.slice().reverse().map((entry, idx) => (
                      <div key={idx} className="flex gap-3 relative">
                        {idx !== selectedParcel.history.length - 1 && (
                          <div className="absolute left-[7px] top-4 bottom-0 w-[2px] bg-gray-100"></div>
                        )}
                        <div className={`w-4 h-4 rounded-full mt-1 z-10 border-2 border-white ${
                          idx === 0 ? 'bg-blue-600 scale-110 shadow-sm' : 'bg-gray-300'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-gray-800">{entry.status}</p>
                          <p className="text-[10px] text-gray-500">{new Date(entry.date).toLocaleString()} • {entry.updatedBy}</p>
                          {entry.note && <p className="text-[10px] text-gray-400 italic mt-0.5">{entry.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedParcel && <ReceiptPrint parcel={selectedParcel} />}
    </div>
  );
}
