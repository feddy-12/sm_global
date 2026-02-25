
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR'
}

export enum ParcelStatus {
  RECEIVED = 'Recibido',
  IN_TRANSIT = 'En tránsito',
  IN_WAREHOUSE = 'En almacén',
  DELIVERED = 'Entregado'
}

export enum PaymentMethod {
  CASH = 'Efectivo',
  TRANSFER = 'Transferencia',
  MOBILE_MONEY = 'Muni Money / Getesa Money'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  branch: string; // Sucursal asignada
}

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  dni: string;
  email?: string;
}

export interface Parcel {
  id: string;
  trackingCode: string;
  senderId: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  weight: number;
  type: string;
  cost: number;
  status: ParcelStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: 'Pagado' | 'Pendiente';
  origin: string;
  destination: string;
  createdAt: string;
  branch: string; // Sucursal donde se registró
  createdById: string; // ID del usuario que lo registró
  createdByName: string; // Nombre del usuario que lo registró
  history: { status: ParcelStatus; date: string; note: string; updatedBy?: string }[];
}

export interface DashboardStats {
  totalParcels: number;
  pendingDelivery: number;
  deliveredToday: number;
  monthlyRevenue: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: string;
  read: boolean;
  targetBranch?: string; // If null, it's global (Super Admin)
  parcelId?: string;
  trackingCode?: string;
}
