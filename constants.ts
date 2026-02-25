
import { ParcelStatus, PaymentMethod, Parcel, Customer } from './types';

export const PROVINCES = [
  'Bioko Norte',
  'Bioko Sur',
  'Litoral',
  'Centro Sur',
  'Kié-Ntem',
  'Wele-Nzas',
  'Annobón',
  'Djibloho'
];

export const CITIES = [
  'Malabo',
  'Bata',
  'Ebebiyín',
  'Mongomo',
  'Evinayong',
  'Luba',
  'Anisoc',
  'Oyala / Ciudad de la Paz'
];

export const PARCEL_TYPES = [
  'Documentos',
  'Paquete Pequeño (<2kg)',
  'Caja Mediana (2-10kg)',
  'Caja Grande (>10kg)',
  'Electrónicos',
  'Frágil'
];

export const CURRENCY = 'FCFA';

// Type INITIAL_CUSTOMERS to match the Customer interface
export const INITIAL_CUSTOMERS: Customer[] = [
  { id: '1', fullName: 'Juan Obiang', phone: '+240 222 000 111', address: 'Bata, Plaza de la Libertad', dni: '1234567-A' },
  { id: '2', fullName: 'Maria Nchama', phone: '+240 555 123 456', address: 'Malabo, Calle Kenia', dni: '9876543-B' }
];

// Type INITIAL_PARCELS to match the Parcel interface and use enums for status and paymentMethod
export const INITIAL_PARCELS: Parcel[] = [
  {
    id: 'p1',
    trackingCode: 'GE-2023-A001',
    senderId: '1',
    receiverName: 'Carlos Mba',
    receiverPhone: '+240 222 999 888',
    receiverAddress: 'Malabo, Paraíso',
    weight: 2.5,
    type: 'Caja Mediana (2-10kg)',
    cost: 5000,
    status: ParcelStatus.RECEIVED,
    paymentMethod: PaymentMethod.CASH,
    paymentStatus: 'Pagado',
    origin: 'Bata',
    destination: 'Malabo',
    createdAt: new Date().toISOString(),
    branch: 'Bata',
    createdById: 'u-1',
    createdByName: 'Super Admin',
    history: [{ status: ParcelStatus.RECEIVED, date: new Date().toISOString(), note: 'Paquete recibido en oficina central', updatedBy: 'Super Admin' }]
  }
];
