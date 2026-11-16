import { Categoria, Producto, Factura, ItemFactura, Deuda, PagoDeuda } from '../types/database';

export const DEMO_USER_ID = 'demo-user-123456';

export const INITIAL_CATEGORIAS: Categoria[] = [
  {
    id: 'cat-1',
    user_id: DEMO_USER_ID,
    nombre: 'Alimentación y Supermercado',
    icono: 'ShoppingCart',
    color: '#16A34A',
    created_at: '2026-08-01T00:00:00Z',
  },
  {
    id: 'cat-2',
    user_id: DEMO_USER_ID,
    nombre: 'Vivienda y Servicios',
    icono: 'Home',
    color: '#2563EB',
    created_at: '2026-08-01T00:00:00Z',
  },
  {
    id: 'cat-3',
    user_id: DEMO_USER_ID,
    nombre: 'Transporte',
    icono: 'Car',
    color: '#D97706',
    created_at: '2026-08-01T00:00:00Z',
  },
  {
    id: 'cat-4',
    user_id: DEMO_USER_ID,
    nombre: 'Salud y Bienestar',
    icono: 'HeartPulse',
    color: '#DC2626',
    created_at: '2026-08-01T00:00:00Z',
  },
  {
    id: 'cat-5',
    user_id: DEMO_USER_ID,
    nombre: 'Educación',
    icono: 'GraduationCap',
    color: '#7C3AED',
    created_at: '2026-08-01T00:00:00Z',
  },
  {
    id: 'cat-6',
    user_id: DEMO_USER_ID,
    nombre: 'Entretenimiento y Ocio',
    icono: 'Film',
    color: '#DB2777',
    created_at: '2026-08-01T00:00:00Z',
  },
  {
    id: 'cat-7',
    user_id: DEMO_USER_ID,
    nombre: 'Otros y Varios',
    icono: 'MoreHorizontal',
    color: '#475569',
    created_at: '2026-08-01T00:00:00Z',
  },
];

export const INITIAL_PRODUCTOS: Producto[] = [
  {
    id: 'prod-1',
    user_id: DEMO_USER_ID,
    categoria_id: 'cat-1',
    nombre: 'Leche Alquería Deslactosada 1.1L',
    unidad_medida: 'bolsa',
    created_at: '2026-08-02T10:00:00Z',
  },
  {
    id: 'prod-2',
    user_id: DEMO_USER_ID,
    categoria_id: 'cat-1',
    nombre: 'Arroz Diana Premium 1kg',
    unidad_medida: 'bolsa',
    created_at: '2026-08-02T10:00:00Z',
  },
  {
    id: 'prod-3',
    user_id: DEMO_USER_ID,
    categoria_id: 'cat-1',
    nombre: 'Pechuga de Pollo Fresca 1kg',
    unidad_medida: 'kg',
    created_at: '2026-08-05T14:00:00Z',
  },
  {
    id: 'prod-4',
    user_id: DEMO_USER_ID,
    categoria_id: 'cat-1',
    nombre: 'Café Juan Valdez Molido 454g',
    unidad_medida: 'paquete',
    created_at: '2026-08-10T12:00:00Z',
  },
  {
    id: 'prod-5',
    user_id: DEMO_USER_ID,
    categoria_id: 'cat-1',
    nombre: 'Aceite Premier Girasol 1000ml',
    unidad_medida: 'botella',
    created_at: '2026-08-12T11:00:00Z',
  },
  {
    id: 'prod-6',
    user_id: DEMO_USER_ID,
    categoria_id: 'cat-3',
    nombre: 'Gasolina Corriente',
    unidad_medida: 'galón',
    created_at: '2026-08-15T09:00:00Z',
  },
  {
    id: 'prod-7',
    user_id: DEMO_USER_ID,
    categoria_id: 'cat-2',
    nombre: 'Servicio de Internet Fibra Óptica',
    unidad_medida: 'mes',
    created_at: '2026-08-20T08:00:00Z',
  },
  {
    id: 'prod-8',
    user_id: DEMO_USER_ID,
    categoria_id: 'cat-4',
    nombre: 'Complejo Vitamínico B',
    unidad_medida: 'caja',
    created_at: '2026-08-25T16:00:00Z',
  },
  {
    id: 'prod-9',
    user_id: DEMO_USER_ID,
    categoria_id: 'cat-6',
    nombre: 'Entradas de Cine Multiplex',
    unidad_medida: 'boleta',
    created_at: '2026-09-02T19:00:00Z',
  },
  {
    id: 'prod-10',
    user_id: DEMO_USER_ID,
    categoria_id: 'cat-1',
    nombre: 'Huevos AA Santa Anita x30',
    unidad_medida: 'panal',
    created_at: '2026-09-05T10:00:00Z',
  },
];

export const INITIAL_FACTURAS: Factura[] = [
  {
    id: 'fac-1',
    user_id: DEMO_USER_ID,
    fecha: '2026-08-12',
    proveedor: 'Éxito Calle 80',
    categoria_id: 'cat-1',
    total: 68400,
    nota: 'Mercado quincenal básico',
    created_at: '2026-08-12T11:20:00Z',
  },
  {
    id: 'fac-2',
    user_id: DEMO_USER_ID,
    fecha: '2026-08-28',
    proveedor: 'Estación Terpel Norte',
    categoria_id: 'cat-3',
    total: 75000,
    nota: 'Tanqueda semanal',
    created_at: '2026-08-28T09:15:00Z',
  },
  {
    id: 'fac-3',
    user_id: DEMO_USER_ID,
    fecha: '2026-09-14',
    proveedor: 'Carulla Country',
    categoria_id: 'cat-1',
    total: 94800,
    nota: 'Compra de despensa',
    created_at: '2026-09-14T17:40:00Z',
  },
  {
    id: 'fac-4',
    user_id: DEMO_USER_ID,
    fecha: '2026-09-29',
    proveedor: 'Droguerías Farmatodo',
    categoria_id: 'cat-4',
    total: 48900,
    nota: 'Vitaminas y cuidado personal',
    created_at: '2026-09-29T15:10:00Z',
  },
  {
    id: 'fac-5',
    user_id: DEMO_USER_ID,
    fecha: '2026-10-10',
    proveedor: 'Tiendas D1',
    categoria_id: 'cat-1',
    total: 62200,
    nota: 'Mercado de reposición',
    created_at: '2026-10-10T12:00:00Z',
  },
  {
    id: 'fac-6',
    user_id: DEMO_USER_ID,
    fecha: '2026-10-25',
    proveedor: 'Cine Colombia Titán Plaza',
    categoria_id: 'cat-6',
    total: 58000,
    nota: 'Salida de fin de semana con amigos',
    created_at: '2026-10-25T20:30:00Z',
  },
  {
    id: 'fac-7',
    user_id: DEMO_USER_ID,
    fecha: '2026-11-04',
    proveedor: 'Éxito Calle 80',
    categoria_id: 'cat-1',
    total: 112500,
    nota: 'Mercado mensual grande',
    created_at: '2026-11-04T16:15:00Z',
  },
  {
    id: 'fac-8',
    user_id: DEMO_USER_ID,
    fecha: '2026-11-08',
    proveedor: 'Estación Terpel Norte',
    categoria_id: 'cat-3',
    total: 82000,
    nota: 'Gasolina fin de semana',
    created_at: '2026-11-08T08:45:00Z',
  },
];

export const INITIAL_ITEMS_FACTURA: ItemFactura[] = [
  // Fac 1 (Aug 12)
  {
    id: 'item-1',
    user_id: DEMO_USER_ID,
    factura_id: 'fac-1',
    producto_id: 'prod-1', // Leche
    cantidad: 4,
    precio_unitario: 4700,
    subtotal: 18800,
  },
  {
    id: 'item-2',
    user_id: DEMO_USER_ID,
    factura_id: 'fac-1',
    producto_id: 'prod-2', // Arroz
    cantidad: 2,
    precio_unitario: 4800,
    subtotal: 9600,
  },
  {
    id: 'item-3',
    user_id: DEMO_USER_ID,
    factura_id: 'fac-1',
    producto_id: 'prod-4', // Cafe
    cantidad: 1,
    precio_unitario: 24000,
    subtotal: 24000,
  },
  {
    id: 'item-4',
    user_id: DEMO_USER_ID,
    factura_id: 'fac-1',
    producto_id: 'prod-5', // Aceite
    cantidad: 1,
    precio_unitario: 16000,
    subtotal: 16000,
  },

  // Fac 2 (Aug 28)
  {
    id: 'item-5',
    user_id: DEMO_USER_ID,
    factura_id: 'fac-2',
    producto_id: 'prod-6', // Gasolina
    cantidad: 5,
    precio_unitario: 15000,
    subtotal: 75000,
  },

  // Fac 3 (Sep 14)
  {
    id: 'item-6',
    user_id: DEMO_USER_ID,
    factura_id: 'fac-3',
    producto_id: 'prod-1', // Leche (subió a 4900)
    cantidad: 4,
    precio_unitario: 4900,
    subtotal: 19600,
  },
  {
    id: 'item-7',
    user_id: DEMO_USER_ID,
    factura_id: 'fac-3',
    producto_id: 'prod-3', // Pollo
    cantidad: 2,
    precio_unitario: 19800,
    subtotal: 39600,
  },
  {
    id: 'item-8',
    user_id: DEMO_USER_ID,
    factura_id: 'fac-3',
    producto_id: 'prod-10', // Huevos
    cantidad: 2,
    precio_unitario: 17800,
    subtotal: 35600,
  },

  // Fac 4 (Sep 29)
  {
    id: 'item-9',
    user_id: DEMO_USER_ID,
    factura_id: 'fac-4',
    producto_id: 'prod-8', // Vitaminas
    cantidad: 1,
    precio_unitario: 48900,
    subtotal: 48900,
  },

  // Fac 5 (Oct 10)
  {
    id: 'item-10',
    user_id: DEMO_USER_ID,
    factura_id: 'fac-5',
    producto_id: 'prod-1', // Leche (D1 a 4800)
    cantidad: 4,
    precio_unitario: 4800,
    subtotal: 19200,
  },
  {
    id: 'item-11',
    user_id: DEMO_USER_ID,
    factura_id: 'fac-5',
    producto_id: 'prod-2', // Arroz
    cantidad: 3,
    precio_unitario: 5000,
    subtotal: 15000,
  },
  {
    id: 'item-12',
    user_id: DEMO_USER_ID,
    factura_id: 'fac-5',
    producto_id: 'prod-5', // Aceite
    cantidad: 1,
    precio_unitario: 18000,
    subtotal: 18000,
  },
  {
    id: 'item-13',
    user_id: DEMO_USER_ID,
    factura_id: 'fac-5',
    producto_id: 'prod-10', // Huevos
    cantidad: 1,
    precio_unitario: 10000,
    subtotal: 10000,
  },

  // Fac 6 (Oct 25)
  {
    id: 'item-14',
    user_id: DEMO_USER_ID,
    factura_id: 'fac-6',
    producto_id: 'prod-9', // Cine
    cantidad: 2,
    precio_unitario: 29000,
    subtotal: 58000,
  },

  // Fac 7 (Nov 04)
  {
    id: 'item-15',
    user_id: DEMO_USER_ID,
    factura_id: 'fac-7',
    producto_id: 'prod-1', // Leche (Noviembre a 5200)
    cantidad: 5,
    precio_unitario: 5200,
    subtotal: 26000,
  },
  {
    id: 'item-16',
    user_id: DEMO_USER_ID,
    factura_id: 'fac-7',
    producto_id: 'prod-3', // Pollo (Noviembre a 21500)
    cantidad: 2,
    precio_unitario: 21500,
    subtotal: 43000,
  },
  {
    id: 'item-17',
    user_id: DEMO_USER_ID,
    factura_id: 'fac-7',
    producto_id: 'prod-4', // Cafe (Noviembre a 25500)
    cantidad: 1,
    precio_unitario: 25500,
    subtotal: 25500,
  },
  {
    id: 'item-18',
    user_id: DEMO_USER_ID,
    factura_id: 'fac-7',
    producto_id: 'prod-10', // Huevos
    cantidad: 1,
    precio_unitario: 18000,
    subtotal: 18000,
  },

  // Fac 8 (Nov 08)
  {
    id: 'item-19',
    user_id: DEMO_USER_ID,
    factura_id: 'fac-8',
    producto_id: 'prod-6', // Gasolina (Noviembre a 16400 galón)
    cantidad: 5,
    precio_unitario: 16400,
    subtotal: 82000,
  },
];

export const INITIAL_DEUDAS: Deuda[] = [
  {
    id: 'deuda-1',
    user_id: DEMO_USER_ID,
    nombre: 'Crédito Libre Destino',
    acreedor: 'Bancolombia',
    monto_total: 4500000,
    fecha_inicio: '2026-04-15',
    fecha_limite: '2027-04-15',
    tasa_interes: 1.8,
    estado: 'activa',
    created_at: '2026-04-15T10:00:00Z',
  },
  {
    id: 'deuda-2',
    user_id: DEMO_USER_ID,
    nombre: 'Compra Computador Portátil',
    acreedor: 'Tarjeta CMR Falabella',
    monto_total: 2800000,
    fecha_inicio: '2026-07-01',
    fecha_limite: '2026-12-30',
    tasa_interes: 2.1,
    estado: 'activa',
    created_at: '2026-07-01T15:00:00Z',
  },
  {
    id: 'deuda-3',
    user_id: DEMO_USER_ID,
    nombre: 'Préstamo Repuesto Vehículo',
    acreedor: 'Carlos (Hermano)',
    monto_total: 600000,
    fecha_inicio: '2026-09-01',
    fecha_limite: '2026-10-30',
    tasa_interes: 0,
    estado: 'pagada',
    created_at: '2026-09-01T11:00:00Z',
  },
];

export const INITIAL_PAGOS_DEUDA: PagoDeuda[] = [
  // Pagos a Deuda 1 (Bancolombia)
  {
    id: 'pago-1',
    user_id: DEMO_USER_ID,
    deuda_id: 'deuda-1',
    fecha_pago: '2026-05-15',
    monto: 400000,
    nota: 'Cuota 1 de 12',
    created_at: '2026-05-15T10:00:00Z',
  },
  {
    id: 'pago-2',
    user_id: DEMO_USER_ID,
    deuda_id: 'deuda-1',
    fecha_pago: '2026-06-15',
    monto: 400000,
    nota: 'Cuota 2 de 12',
    created_at: '2026-06-15T10:00:00Z',
  },
  {
    id: 'pago-3',
    user_id: DEMO_USER_ID,
    deuda_id: 'deuda-1',
    fecha_pago: '2026-07-15',
    monto: 400000,
    nota: 'Cuota 3 de 12',
    created_at: '2026-07-15T10:00:00Z',
  },
  {
    id: 'pago-4',
    user_id: DEMO_USER_ID,
    deuda_id: 'deuda-1',
    fecha_pago: '2026-08-15',
    monto: 400000,
    nota: 'Cuota 4 de 12',
    created_at: '2026-08-15T10:00:00Z',
  },
  {
    id: 'pago-5',
    user_id: DEMO_USER_ID,
    deuda_id: 'deuda-1',
    fecha_pago: '2026-09-15',
    monto: 500000,
    nota: 'Abono extraordinario con prima',
    created_at: '2026-09-15T10:00:00Z',
  },
  {
    id: 'pago-6',
    user_id: DEMO_USER_ID,
    deuda_id: 'deuda-1',
    fecha_pago: '2026-10-15',
    monto: 400000,
    nota: 'Cuota 5 de 12',
    created_at: '2026-10-15T10:00:00Z',
  },

  // Pagos a Deuda 2 (Falabella)
  {
    id: 'pago-7',
    user_id: DEMO_USER_ID,
    deuda_id: 'deuda-2',
    fecha_pago: '2026-08-05',
    monto: 500000,
    nota: 'Pago cuota 1',
    created_at: '2026-08-05T12:00:00Z',
  },
  {
    id: 'pago-8',
    user_id: DEMO_USER_ID,
    deuda_id: 'deuda-2',
    fecha_pago: '2026-09-05',
    monto: 500000,
    nota: 'Pago cuota 2',
    created_at: '2026-09-05T12:00:00Z',
  },
  {
    id: 'pago-9',
    user_id: DEMO_USER_ID,
    deuda_id: 'deuda-2',
    fecha_pago: '2026-10-05',
    monto: 600000,
    nota: 'Pago cuota 3',
    created_at: '2026-10-05T12:00:00Z',
  },

  // Pagos a Deuda 3 (Carlos - Pagada completa)
  {
    id: 'pago-10',
    user_id: DEMO_USER_ID,
    deuda_id: 'deuda-3',
    fecha_pago: '2026-09-30',
    monto: 300000,
    nota: 'Primera mitad',
    created_at: '2026-09-30T10:00:00Z',
  },
  {
    id: 'pago-11',
    user_id: DEMO_USER_ID,
    deuda_id: 'deuda-3',
    fecha_pago: '2026-10-20',
    monto: 300000,
    nota: 'Saldo final pagado completo',
    created_at: '2026-10-20T10:00:00Z',
  },
];
