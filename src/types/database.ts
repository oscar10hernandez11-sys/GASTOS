export interface Categoria {
  id: string;
  user_id: string;
  nombre: string;
  icono: string;
  color: string;
  created_at?: string;
}

export interface Producto {
  id: string;
  user_id: string;
  categoria_id: string | null;
  nombre: string;
  unidad_medida: string;
  created_at?: string;
  // Computed / joined fields
  categoria?: Categoria;
  ultimo_precio?: number;
  ultimo_proveedor?: string;
  ultima_fecha?: string;
  precio_anterior?: number;
  variacion_porcentaje?: number;
  total_compras?: number;
}

export interface Factura {
  id: string;
  user_id: string;
  fecha: string; // YYYY-MM-DD
  proveedor: string;
  categoria_id: string | null;
  total: number;
  nota: string | null;
  created_at?: string;
  // Joined fields
  categoria?: Categoria;
  items?: ItemFactura[];
}

export interface ItemFactura {
  id: string;
  user_id: string;
  factura_id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  // Joined fields
  producto?: Producto;
  categoria?: Categoria;
}

export interface Deuda {
  id: string;
  user_id: string;
  nombre: string;
  acreedor: string;
  monto_total: number;
  fecha_inicio: string;
  fecha_limite?: string | null;
  tasa_interes?: number;
  estado: 'activa' | 'pagada' | 'vencida';
  created_at?: string;
  // Computed from payments
  total_pagado?: number;
  saldo_pendiente?: number;
  pagos?: PagoDeuda[];
}

export interface PagoDeuda {
  id: string;
  user_id: string;
  deuda_id: string;
  fecha_pago: string;
  monto: number;
  nota?: string | null;
  created_at?: string;
}

export interface VistaDeudaSaldo extends Deuda {
  total_pagado: number;
  saldo_pendiente: number;
}

export interface AppChangelogEntry {
  version: string;
  fecha: string;
  cambios: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  isDemo?: boolean;
  isAdmin?: boolean;
}
