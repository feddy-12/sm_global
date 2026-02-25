
import React, { useState } from 'react';
import { Search, Truck, MapPin, CheckCircle, Package, ArrowLeft, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Parcel } from '../types';

export default function PublicTracking({ parcels }: { parcels: Parcel[] }) {
  const [code, setCode] = useState('');
  const [foundParcel, setFoundParcel] = useState<Parcel | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const result = parcels.find(p => p.trackingCode.toUpperCase() === code.toUpperCase().trim());
    setFoundParcel(result || null);
    setSearched(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between no-print">
         <div className="flex items-center space-x-2">
            <Truck className="text-blue-700" size={28} />
            <span className="text-xl font-bold tracking-tight uppercase">SM Global Express</span>
         </div>
         <Link to="/login" className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
           <ArrowLeft size={16} /> Portal Administrativo
         </Link>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        <div className="text-center mb-12 no-print">
          <h1 className="text-4xl font-black text-gray-900 mb-4">Rastreo de Paquetería</h1>
          <p className="text-gray-600 text-lg">Consulta la trazabilidad de tu envío SM Global.</p>
        </div>

        <form onSubmit={handleSearch} className="mb-12 no-print">
           <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                  <Search size={22} />
                </span>
                <input 
                  type="text" 
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ej: SM-202X-XXXX"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-100 focus:border-blue-500 outline-none text-lg shadow-sm font-mono font-bold"
                  required
                />
              </div>
              <button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-8 py-4 rounded-2xl shadow-lg transition-all text-lg">
                Rastrear Ahora
              </button>
           </div>
        </form>

        {searched && foundParcel && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-blue-700 p-8 text-white flex flex-col sm:flex-row justify-between items-center gap-4">
                 <div>
                    <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Estado de la Guía</p>
                    <h2 className="text-3xl font-black">{foundParcel.status.toUpperCase()}</h2>
                 </div>
                 <div className="text-center sm:text-right">
                    <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Código Tracking</p>
                    <p className="text-2xl font-mono font-bold">{foundParcel.trackingCode}</p>
                 </div>
              </div>

              <div className="p-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <div className="space-y-4">
                       <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Trazabilidad de Ruta</h3>
                       <div className="flex items-center space-x-6">
                          <div className="flex flex-col items-center">
                             <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                                <MapPin size={20} />
                             </div>
                             <div className="w-0.5 h-12 bg-gray-100"></div>
                             <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                                <CheckCircle size={20} />
                             </div>
                          </div>
                          <div className="space-y-8">
                             <div>
                                <p className="font-bold text-gray-900">Origen</p>
                                <p className="text-sm text-gray-500">{foundParcel.origin}</p>
                             </div>
                             <div className="pt-2">
                                <p className="font-bold text-gray-900">Destino</p>
                                <p className="text-sm text-gray-500">{foundParcel.destination}</p>
                             </div>
                          </div>
                       </div>
                    </div>
                    <div className="space-y-4">
                       <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Información General</h3>
                       <div className="bg-gray-50 p-6 rounded-2xl space-y-4">
                          <div className="flex justify-between border-b border-gray-200 pb-2">
                             <span className="text-gray-500 text-sm">Para:</span>
                             <span className="font-bold text-gray-900">{foundParcel.receiverName}</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-200 pb-2">
                             <span className="text-gray-500 text-sm">Fecha Registro:</span>
                             <span className="font-bold text-gray-900">{new Date(foundParcel.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                             <span className="text-gray-500 text-sm">Sucursal:</span>
                             <span className="font-bold text-gray-900">{foundParcel.origin}</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div>
                    <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-6">Historial de Eventos</h3>
                    <div className="space-y-8">
                       {foundParcel.history.slice().reverse().map((event, idx) => (
                          <div key={idx} className="relative flex gap-6">
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${
                                idx === 0 ? 'bg-blue-700 text-white' : 'bg-gray-200 text-gray-400'
                             }`}>
                                {idx === 0 ? <Clock size={16} /> : <div className="w-2 h-2 rounded-full bg-current"></div>}
                             </div>
                             {idx !== foundParcel.history.length - 1 && (
                                <div className="absolute left-4 top-8 bottom-[-2rem] w-0.5 bg-gray-100"></div>
                             )}
                             <div className="pb-4">
                                <p className={`text-lg font-bold ${idx === 0 ? 'text-gray-900' : 'text-gray-400'}`}>{event.status}</p>
                                <p className="text-sm text-gray-500">{new Date(event.date).toLocaleString()}</p>
                                <p className="text-sm text-gray-400 italic">{event.note}</p>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {searched && !foundParcel && (
          <div className="bg-white p-12 rounded-3xl shadow-xl border border-gray-100 text-center animate-in zoom-in no-print">
             <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package size={40} />
             </div>
             <h2 className="text-2xl font-bold text-gray-900 mb-2">Código No Encontrado</h2>
             <p className="text-gray-500 mb-8">No hemos localizado ningún envío con el código "{code}". Verifique el número en su comprobante físico.</p>
             <button onClick={() => setSearched(false)} className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors">Intentar de Nuevo</button>
          </div>
        )}
      </main>

      <footer className="bg-white border-t p-8 text-center text-gray-400 text-sm no-print">
         <p>© {new Date().getFullYear()} SM Global Express. Guinea Ecuatorial.</p>
      </footer>
    </div>
  );
}
