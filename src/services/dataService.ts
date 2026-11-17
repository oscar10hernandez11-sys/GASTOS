import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Categoria,
  Producto,
  Factura,
  ItemFactura,
  Deuda,
  PagoDeuda,
  VistaDeudaSaldo,
  UserProfile,
} from '../types/database';
import {
  INITIAL_CATEGORIAS,
  INITIAL_PRODUCTOS,
  INITIAL_FACTURAS,
  INITIAL_ITEMS_FACTURA,
  INITIAL_DEUDAS,
  INITIAL_PAGOS_DEUDA,
  DEMO_USER_ID,
} from '../lib/mockData';

// Estado local estrictamente en memoria para Modo Demo (sin persistencia de credenciales ni datos en localStorage)
interface LocalStore {
  categorias: Categoria[];
  productos: Producto[];
  facturas: Factura[];
  items_factura: ItemFactura[];
  deudas: Deuda[];
  pagos_deuda: PagoDeuda[];
}

function createInitialDemoStore(): LocalStore {
  return {
    categorias: INITIAL_CATEGORIAS.map((c) => ({ ...c })),
    productos: INITIAL_PRODUCTOS.map((p) => ({ ...p })),
    facturas: INITIAL_FACTURAS.map((f) => ({ ...f })),
    items_factura: INITIAL_ITEMS_FACTURA.map((it) => ({ ...it })),
    deudas: INITIAL_DEUDAS.map((d) => ({ ...d })),
    pagos_deuda: INITIAL_PAGOS_DEUDA.map((p) => ({ ...p })),
  };
}

let demoModeActive = false;
let localStore: LocalStore = createInitialDemoStore();

function saveLocalStore(_store: LocalStore) {
  // Almacenamiento exclusivamente en memoria durante la sesión demo
}

export function resetDemoData() {
  localStore = createInitialDemoStore();
}

export function isDemoModeActive(): boolean {
  return demoModeActive;
}

export function setDemoModeActive(active: boolean) {
  demoModeActive = active;
  if (!active) {
    localStore = createInitialDemoStore();
  }
}

function clearLegacyBrowserStorage() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('kakebo_demo_store');
    localStorage.removeItem('kakebo_is_demo');
    localStorage.removeItem('kakebo_supabase_url');
    localStorage.removeItem('kakebo_supabase_anon_key');
  }
}

// -------------------------------------------------------------
// AUTENTICACIÓN
// -------------------------------------------------------------

function checkIsAdmin(user: { email?: string; app_metadata?: Record<string, any> } | null): boolean {
  if (!user) return false;
  if (user.app_metadata?.role === 'admin') return true;
  const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL as string | undefined)?.trim().toLowerCase();
  if (adminEmail && adminEmail !== 'correo_del_administrador' && user.email?.toLowerCase() === adminEmail) {
    return true;
  }
  return false;
}

async function requireAuthenticatedUser(): Promise<UserProfile> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase no está configurado en el entorno.');
  }
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('Tu sesión ha expirado o no has iniciado sesión.');
  }
  return {
    id: user.id,
    email: user.email || '',
    isDemo: false,
    isAdmin: checkIsAdmin(user),
  };
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  if (isDemoModeActive()) {
    return {
      id: DEMO_USER_ID,
      email: 'demo@kakebo.app',
      isDemo: true,
      isAdmin: false,
    };
  }

  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return {
      id: user.id,
      email: user.email || '',
      isDemo: false,
      isAdmin: checkIsAdmin(user),
    };
  } catch {
    return null;
  }
}

export async function signIn(email: string, password: string): Promise<{ user: UserProfile | null; error: string | null; emailNotConfirmed?: boolean }> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      user: null,
      error: 'Variables de entorno de Supabase pendientes. Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY o usa el Modo Demo.',
    };
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    const msg = error?.message || '';
    if (/email not confirmed/i.test(msg)) {
      return {
        user: null,
        error: 'Tu correo aún no está confirmado. Revisa tu bandeja de entrada (y spam) o reenvía el enlace de confirmación.',
        emailNotConfirmed: true,
      };
    }
    if (/invalid login credentials/i.test(msg)) {
      return { user: null, error: 'Correo o contraseña incorrectos.' };
    }
    return { user: null, error: msg || 'Credenciales inválidas.' };
  }
  setDemoModeActive(false);
  clearLegacyBrowserStorage();
  return {
    user: {
      id: data.user.id,
      email: data.user.email || email,
      isDemo: false,
      isAdmin: checkIsAdmin(data.user),
    },
    error: null,
  };
}

export async function resendConfirmationEmail(email: string): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { error: 'Servicio de cuentas no disponible.' };
  }
  const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
  });
  return { error: error ? error.message : null };
}

export async function signUp(email: string, password: string): Promise<{ user: UserProfile | null; error: string | null; confirmationRequired?: boolean }> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      user: null,
      error: 'Variables de entorno de Supabase pendientes. Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY o usa el Modo Demo.',
    };
  }
  const redirectTo =
    typeof window !== 'undefined' ? window.location.origin : undefined;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
  });
  if (error) {
    return { user: null, error: error.message };
  }

  setDemoModeActive(false);
  clearLegacyBrowserStorage();
  const requiresEmailConfirmation = !data.session;
  return {
    user: data.user
      ? {
          id: data.user.id,
          email: data.user.email || email,
          isDemo: false,
          isAdmin: checkIsAdmin(data.user),
        }
      : null,
    error: null,
    confirmationRequired: requiresEmailConfirmation,
  };
}

export async function signOut(): Promise<void> {
  setDemoModeActive(false);
  resetDemoData();
  clearLegacyBrowserStorage();
  if (supabase) {
    await supabase.auth.signOut();
  }
}

// -------------------------------------------------------------
// CATEGORÍAS
// -------------------------------------------------------------

export async function getCategorias(): Promise<Categoria[]> {
  if (isDemoModeActive()) {
    return [...localStore.categorias];
  }
  if (!supabase) return [];

  await requireAuthenticatedUser();

  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) {
    throw new Error('No fue posible consultar las categorías.');
  }
  return data || [];
}

export async function createCategoria(nombre: string, icono: string, color: string): Promise<Categoria> {
  if (isDemoModeActive()) {
    const newCat: Categoria = {
      id: `cat-${Date.now()}`,
      user_id: DEMO_USER_ID,
      nombre: nombre.trim(),
      icono,
      color,
      created_at: new Date().toISOString(),
    };
    localStore.categorias.push(newCat);
    saveLocalStore(localStore);
    return newCat;
  }

  if (!supabase) throw new Error('Cliente Supabase no disponible');
  await requireAuthenticatedUser();

  const { data, error } = await supabase
    .from('categorias')
    .insert([{ nombre: nombre.trim(), icono, color }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCategoria(id: string, nombre: string, icono: string, color: string): Promise<Categoria> {
  if (isDemoModeActive()) {
    const index = localStore.categorias.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Categoría no encontrada');
    localStore.categorias[index] = {
      ...localStore.categorias[index],
      nombre: nombre.trim(),
      icono,
      color,
    };
    saveLocalStore(localStore);
    return localStore.categorias[index];
  }

  if (!supabase) throw new Error('Cliente Supabase no disponible');
  await requireAuthenticatedUser();

  const { data, error } = await supabase
    .from('categorias')
    .update({ nombre: nombre.trim(), icono, color })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCategoria(id: string): Promise<{ success: boolean; error?: string }> {
  // Comprobar productos o facturas asociadas antes de permitir borrar
  if (isDemoModeActive()) {
    const hasProducts = localStore.productos.some((p) => p.categoria_id === id);
    const hasInvoices = localStore.facturas.some((f) => f.categoria_id === id);

    if (hasProducts || hasInvoices) {
      return {
        success: false,
        error: `No puedes eliminar esta categoría porque está asignada a ${
          hasProducts ? 'productos existentes' : ''
        } ${hasProducts && hasInvoices ? 'y' : ''} ${
          hasInvoices ? 'facturas registradas' : ''
        }. Reasígnalos primero.`,
      };
    }

    localStore.categorias = localStore.categorias.filter((c) => c.id !== id);
    saveLocalStore(localStore);
    return { success: true };
  }

  if (!supabase) return { success: false, error: 'Supabase no disponible' };
  await requireAuthenticatedUser();

  // Comprobar relaciones en Supabase
  const [{ count: prodCount }, { count: facCount }] = await Promise.all([
    supabase.from('productos').select('*', { count: 'exact', head: true }).eq('categoria_id', id),
    supabase.from('facturas').select('*', { count: 'exact', head: true }).eq('categoria_id', id),
  ]);

  if ((prodCount && prodCount > 0) || (facCount && facCount > 0)) {
    return {
      success: false,
      error: `Esta categoría tiene ${(prodCount || 0)} producto(s) y ${(facCount || 0)} factura(s) asociadas. No es posible eliminarla.`,
    };
  }

  const { error } = await supabase.from('categorias').delete().eq('id', id);
  if (error) return { success: false, error: error.message };

  return { success: true };
}

// -------------------------------------------------------------
// PRODUCTOS Y COMPARADOR DE PRECIOS
// -------------------------------------------------------------

export async function getProductos(): Promise<Producto[]> {
  const cats = await getCategorias();
  const catMap = new Map(cats.map((c) => [c.id, c]));

  if (isDemoModeActive()) {
    return computeProductsStats(localStore.productos, localStore.items_factura, localStore.facturas, catMap);
  }

  if (!supabase) return [];
  await requireAuthenticatedUser();

  // Traer productos con sus categorías
  const { data: prods, error: prodErr } = await supabase
    .from('productos')
    .select('*, categorias(*)');

  if (prodErr || !prods) {
    console.error('Error obteniendo productos:', prodErr);
    return [];
  }

  // Traer historial de compras para calcular variaciones
  const { data: items } = await supabase
    .from('items_factura')
    .select('*, facturas(fecha, proveedor)');

  const formattedItems: ItemFactura[] = (items || []).map((it: any) => ({
    id: it.id,
    user_id: it.user_id,
    factura_id: it.factura_id,
    producto_id: it.producto_id,
    cantidad: Number(it.cantidad),
    precio_unitario: Number(it.precio_unitario),
    subtotal: Number(it.subtotal || it.cantidad * it.precio_unitario),
    factura: it.facturas,
  }));

  const facturasList: Factura[] = (items || []).map((it: any) => ({
    id: it.factura_id,
    user_id: it.user_id,
    fecha: it.facturas?.fecha || '',
    proveedor: it.facturas?.proveedor || '',
    categoria_id: null,
    total: 0,
    nota: null,
  }));

  return computeProductsStats(prods, formattedItems, facturasList, catMap);
}

function computeProductsStats(
  products: Producto[],
  items: ItemFactura[],
  facturas: Factura[],
  catMap: Map<string, Categoria>
): Producto[] {
  const facMap = new Map(facturas.map((f) => [f.id, f]));

  return products.map((prod) => {
    const prodItems = items
      .filter((it) => it.producto_id === prod.id)
      .map((it) => {
        const fac = facMap.get(it.factura_id) || (it as any).factura;
        return {
          ...it,
          fecha: fac?.fecha || '',
          proveedor: fac?.proveedor || 'Desconocido',
        };
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    let ultimo_precio = 0;
    let ultimo_proveedor = '-';
    let ultima_fecha = '';
    let precio_anterior: number | undefined = undefined;
    let variacion_porcentaje: number | undefined = undefined;

    if (prodItems.length > 0) {
      ultimo_precio = prodItems[0].precio_unitario;
      ultimo_proveedor = prodItems[0].proveedor;
      ultima_fecha = prodItems[0].fecha;

      if (prodItems.length > 1) {
        precio_anterior = prodItems[1].precio_unitario;
        if (precio_anterior > 0) {
          variacion_porcentaje = ((ultimo_precio - precio_anterior) / precio_anterior) * 100;
        }
      }
    }

    return {
      ...prod,
      categoria: prod.categoria_id ? catMap.get(prod.categoria_id) : undefined,
      ultimo_precio,
      ultimo_proveedor,
      ultima_fecha,
      precio_anterior,
      variacion_porcentaje,
      total_compras: prodItems.length,
    };
  });
}

export async function getProductPriceHistory(productId: string): Promise<
  Array<{
    fecha: string;
    precio_unitario: number;
    proveedor: string;
    factura_id: string;
    cantidad: number;
  }>
> {
  if (isDemoModeActive()) {
    const facMap = new Map(localStore.facturas.map((f) => [f.id, f]));
    return localStore.items_factura
      .filter((it) => it.producto_id === productId)
      .map((it) => {
        const fac = facMap.get(it.factura_id);
        return {
          fecha: fac?.fecha || '',
          precio_unitario: it.precio_unitario,
          proveedor: fac?.proveedor || 'Desconocido',
          factura_id: it.factura_id,
          cantidad: it.cantidad,
        };
      })
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  }

  if (!supabase) return [];
  await requireAuthenticatedUser();

  const { data, error } = await supabase
    .from('items_factura')
    .select('*, facturas(fecha, proveedor)')
    .eq('producto_id', productId);

  if (error || !data) return [];

  return data
    .map((it: any) => ({
      fecha: it.facturas?.fecha || '',
      precio_unitario: Number(it.precio_unitario),
      proveedor: it.facturas?.proveedor || 'Desconocido',
      factura_id: it.factura_id,
      cantidad: Number(it.cantidad),
    }))
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
}

export async function getOrCreateProduct(
  nombre: string,
  categoriaId: string | null,
  unidadMedida: string = 'unidad'
): Promise<Producto> {
  const trimmed = nombre.trim();

  if (isDemoModeActive()) {
    const existing = localStore.productos.find(
      (p) => p.nombre.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      if (categoriaId && existing.categoria_id !== categoriaId) {
        existing.categoria_id = categoriaId;
        saveLocalStore(localStore);
      }
      return existing;
    }

    const newProd: Producto = {
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_id: DEMO_USER_ID,
      categoria_id: categoriaId,
      nombre: trimmed,
      unidad_medida: unidadMedida,
      created_at: new Date().toISOString(),
    };
    localStore.productos.push(newProd);
    saveLocalStore(localStore);
    return newProd;
  }

  if (!supabase) throw new Error('Cliente Supabase no disponible');
  await requireAuthenticatedUser();

  // Buscar coincidencia en Supabase
  const { data: existing } = await supabase
    .from('productos')
    .select('*')
    .ilike('nombre', trimmed)
    .maybeSingle();

  if (existing) {
    if (categoriaId && existing.categoria_id !== categoriaId) {
      await supabase.from('productos').update({ categoria_id: categoriaId }).eq('id', existing.id);
    }
    return existing;
  }

  const { data: created, error } = await supabase
    .from('productos')
    .insert([
      {
        nombre: trimmed,
        categoria_id: categoriaId,
        unidad_medida: unidadMedida,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return created;
}

// -------------------------------------------------------------
// FACTURAS
// -------------------------------------------------------------

export async function getFacturas(): Promise<Factura[]> {
  const cats = await getCategorias();
  const catMap = new Map(cats.map((c) => [c.id, c]));

  if (isDemoModeActive()) {
    const prods = await getProductos();
    const prodMap = new Map(prods.map((p) => [p.id, p]));

    return localStore.facturas
      .map((fac) => {
        const items = localStore.items_factura
          .filter((it) => it.factura_id === fac.id)
          .map((it) => ({
            ...it,
            producto: prodMap.get(it.producto_id),
            categoria: prodMap.get(it.producto_id)?.categoria_id
              ? catMap.get(prodMap.get(it.producto_id)!.categoria_id!)
              : undefined,
          }));

        return {
          ...fac,
          categoria: fac.categoria_id ? catMap.get(fac.categoria_id) : undefined,
          items,
        };
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }

  if (!supabase) return [];
  await requireAuthenticatedUser();

  const { data, error } = await supabase
    .from('facturas')
    .select(`
      *,
      categorias(*),
      items_factura(
        *,
        productos(
          *,
          categorias(*)
        )
      )
    `)
    .order('fecha', { ascending: false });

  if (error) {
    console.error('Error obteniendo facturas:', error);
    return [];
  }

  return (data || []).map((f: any) => ({
    id: f.id,
    user_id: f.user_id,
    fecha: f.fecha,
    proveedor: f.proveedor,
    categoria_id: f.categoria_id,
    total: Number(f.total),
    nota: f.nota,
    created_at: f.created_at,
    categoria: f.categorias,
    items: (f.items_factura || []).map((it: any) => ({
      id: it.id,
      user_id: it.user_id,
      factura_id: it.factura_id,
      producto_id: it.producto_id,
      cantidad: Number(it.cantidad),
      precio_unitario: Number(it.precio_unitario),
      subtotal: Number(it.subtotal || it.cantidad * it.precio_unitario),
      producto: it.productos,
      categoria: it.productos?.categorias,
    })),
  }));
}

export interface NewInvoiceItemPayload {
  productoNombre: string;
  categoriaId?: string | null;
  cantidad: number;
  precio_unitario: number;
}

export interface NewInvoicePayload {
  fecha: string;
  proveedor: string;
  categoria_id?: string | null;
  nota?: string | null;
  items: NewInvoiceItemPayload[];
}

export async function createFacturaWithItems(payload: NewInvoicePayload): Promise<Factura> {
  // Calcular total a partir de ítems
  const computedTotal = payload.items.reduce(
    (sum, it) => sum + (it.cantidad * it.precio_unitario),
    0
  );

  if (isDemoModeActive()) {
    const facId = `fac-${Date.now()}`;
    const newFac: Factura = {
      id: facId,
      user_id: DEMO_USER_ID,
      fecha: payload.fecha,
      proveedor: payload.proveedor.trim(),
      categoria_id: payload.categoria_id || null,
      total: computedTotal,
      nota: payload.nota?.trim() || null,
      created_at: new Date().toISOString(),
    };

    localStore.facturas.unshift(newFac);

    // Procesar cada ítem
    for (const itemPayload of payload.items) {
      const prod = await getOrCreateProduct(
        itemPayload.productoNombre,
        itemPayload.categoriaId || payload.categoria_id || null
      );

      const newItem: ItemFactura = {
        id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        user_id: DEMO_USER_ID,
        factura_id: facId,
        producto_id: prod.id,
        cantidad: itemPayload.cantidad,
        precio_unitario: itemPayload.precio_unitario,
        subtotal: itemPayload.cantidad * itemPayload.precio_unitario,
      };

      localStore.items_factura.push(newItem);
    }

    saveLocalStore(localStore);
    return newFac;
  }

  if (!supabase) throw new Error('Cliente Supabase no disponible');
  await requireAuthenticatedUser();

  // Insertar factura
  const { data: createdFac, error: facErr } = await supabase
    .from('facturas')
    .insert([
      {
        fecha: payload.fecha,
        proveedor: payload.proveedor.trim(),
        categoria_id: payload.categoria_id || null,
        total: computedTotal,
        nota: payload.nota?.trim() || null,
      },
    ])
    .select()
    .single();

  if (facErr || !createdFac) throw facErr || new Error('Error al registrar factura');

  // Asegurar o crear productos y preparar ítems
  const itemsToInsert = [];
  for (const itemPayload of payload.items) {
    const prod = await getOrCreateProduct(
      itemPayload.productoNombre,
      itemPayload.categoriaId || payload.categoria_id || null
    );

    itemsToInsert.push({
      factura_id: createdFac.id,
      producto_id: prod.id,
      cantidad: itemPayload.cantidad,
      precio_unitario: itemPayload.precio_unitario,
    });
  }

  if (itemsToInsert.length > 0) {
    const { error: itemsErr } = await supabase
      .from('items_factura')
      .insert(itemsToInsert);

    if (itemsErr) {
      console.error('Error insertando items de factura:', itemsErr);
    }
  }

  return createdFac;
}

export async function deleteFactura(id: string): Promise<void> {
  if (isDemoModeActive()) {
    localStore.facturas = localStore.facturas.filter((f) => f.id !== id);
    localStore.items_factura = localStore.items_factura.filter((it) => it.factura_id !== id);
    saveLocalStore(localStore);
    return;
  }

  if (!supabase) throw new Error('Supabase no disponible');
  await requireAuthenticatedUser();

  const { error } = await supabase.from('facturas').delete().eq('id', id);
  if (error) throw error;
}

// -------------------------------------------------------------
// DEUDAS Y ABONOS
// -------------------------------------------------------------

export async function getDeudas(): Promise<VistaDeudaSaldo[]> {
  if (isDemoModeActive()) {
    return localStore.deudas.map((d) => {
      const pagos = localStore.pagos_deuda
        .filter((p) => p.deuda_id === d.id)
        .sort((a, b) => new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime());

      const total_pagado = pagos.reduce((sum, p) => sum + p.monto, 0);
      const saldo_pendiente = Math.max(0, d.monto_total - total_pagado);

      return {
        ...d,
        total_pagado,
        saldo_pendiente,
        pagos,
      };
    });
  }

  if (!supabase) return [];
  await requireAuthenticatedUser();

  // Intentar consultar desde la vista con fallback
  try {
    const { data: vistaData, error: vistaError } = await supabase
      .from('vista_deudas_saldo')
      .select('*')
      .order('created_at', { ascending: false });

    if (!vistaError && vistaData) {
      return vistaData.map((d: any) => ({
        ...d,
        monto_total: Number(d.monto_total),
        total_pagado: Number(d.total_pagado || 0),
        saldo_pendiente: Number(d.saldo_pendiente || 0),
      }));
    }
  } catch {
    // Si la vista aún no está creada, calcular manualmente
  }

  // Fallback: consultar deudas y pagos directamente
  const [{ data: deudas }, { data: pagos }] = await Promise.all([
    supabase.from('deudas').select('*').order('created_at', { ascending: false }),
    supabase.from('pagos_deuda').select('*'),
  ]);

  const pagosList = pagos || [];
  return (deudas || []).map((d: any) => {
    const dPagos = pagosList.filter((p: any) => p.deuda_id === d.id);
    const total_pagado = dPagos.reduce((acc: number, curr: any) => acc + Number(curr.monto), 0);
    const monto_total = Number(d.monto_total);
    const saldo_pendiente = Math.max(0, monto_total - total_pagado);

    return {
      id: d.id,
      user_id: d.user_id,
      nombre: d.nombre,
      acreedor: d.acreedor,
      monto_total,
      fecha_inicio: d.fecha_inicio,
      fecha_limite: d.fecha_limite,
      tasa_interes: Number(d.tasa_interes || 0),
      estado: d.estado,
      created_at: d.created_at,
      total_pagado,
      saldo_pendiente,
    };
  });
}

export async function createDeuda(data: {
  nombre: string;
  acreedor: string;
  monto_total: number;
  fecha_inicio: string;
  fecha_limite?: string | null;
  tasa_interes?: number;
}): Promise<Deuda> {
  if (isDemoModeActive()) {
    const newDeuda: Deuda = {
      id: `deuda-${Date.now()}`,
      user_id: DEMO_USER_ID,
      nombre: data.nombre.trim(),
      acreedor: data.acreedor.trim(),
      monto_total: data.monto_total,
      fecha_inicio: data.fecha_inicio,
      fecha_limite: data.fecha_limite || null,
      tasa_interes: data.tasa_interes || 0,
      estado: 'activa',
      created_at: new Date().toISOString(),
    };
    localStore.deudas.unshift(newDeuda);
    saveLocalStore(localStore);
    return newDeuda;
  }

  if (!supabase) throw new Error('Supabase no disponible');
  await requireAuthenticatedUser();

  const { data: created, error } = await supabase
    .from('deudas')
    .insert([
      {
        nombre: data.nombre.trim(),
        acreedor: data.acreedor.trim(),
        monto_total: data.monto_total,
        fecha_inicio: data.fecha_inicio,
        fecha_limite: data.fecha_limite || null,
        tasa_interes: data.tasa_interes || 0,
        estado: 'activa',
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return created;
}

export async function deleteDeuda(id: string): Promise<void> {
  if (isDemoModeActive()) {
    localStore.deudas = localStore.deudas.filter((d) => d.id !== id);
    localStore.pagos_deuda = localStore.pagos_deuda.filter((p) => p.deuda_id !== id);
    saveLocalStore(localStore);
    return;
  }

  if (!supabase) throw new Error('Supabase no disponible');
  await requireAuthenticatedUser();

  const { error } = await supabase.from('deudas').delete().eq('id', id);
  if (error) throw error;
}

export async function getPagosDeuda(deudaId: string): Promise<PagoDeuda[]> {
  if (isDemoModeActive()) {
    return localStore.pagos_deuda
      .filter((p) => p.deuda_id === deudaId)
      .sort((a, b) => new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime());
  }

  if (!supabase) return [];
  await requireAuthenticatedUser();

  const { data, error } = await supabase
    .from('pagos_deuda')
    .select('*')
    .eq('deuda_id', deudaId)
    .order('fecha_pago', { ascending: false });

  if (error) throw error;
  return (data || []).map((p: any) => ({
    ...p,
    monto: Number(p.monto),
  }));
}

export async function createPagoDeuda(payload: {
  deuda_id: string;
  fecha_pago: string;
  monto: number;
  nota?: string | null;
}): Promise<PagoDeuda> {
  if (isDemoModeActive()) {
    const newPago: PagoDeuda = {
      id: `pago-${Date.now()}`,
      user_id: DEMO_USER_ID,
      deuda_id: payload.deuda_id,
      fecha_pago: payload.fecha_pago,
      monto: payload.monto,
      nota: payload.nota?.trim() || null,
      created_at: new Date().toISOString(),
    };
    localStore.pagos_deuda.unshift(newPago);

    // Recalcular saldo y si llega a 0 cambiar estado a pagada
    const targetDeuda = localStore.deudas.find((d) => d.id === payload.deuda_id);
    if (targetDeuda) {
      const allPagos = localStore.pagos_deuda.filter((p) => p.deuda_id === targetDeuda.id);
      const sumPagado = allPagos.reduce((acc, curr) => acc + curr.monto, 0);
      if (sumPagado >= targetDeuda.monto_total) {
        targetDeuda.estado = 'pagada';
      }
    }

    saveLocalStore(localStore);
    return newPago;
  }

  if (!supabase) throw new Error('Supabase no disponible');
  await requireAuthenticatedUser();

  const { data: createdPago, error: pagoErr } = await supabase
    .from('pagos_deuda')
    .insert([
      {
        deuda_id: payload.deuda_id,
        fecha_pago: payload.fecha_pago,
        monto: payload.monto,
        nota: payload.nota?.trim() || null,
      },
    ])
    .select()
    .single();

  if (pagoErr) throw pagoErr;

  // Actualizar estado de la deuda si ya se pagó en su totalidad
  const [{ data: deuda }, { data: pagos }] = await Promise.all([
    supabase.from('deudas').select('monto_total').eq('id', payload.deuda_id).single(),
    supabase.from('pagos_deuda').select('monto').eq('deuda_id', payload.deuda_id),
  ]);

  if (deuda && pagos) {
    const totalPagado = pagos.reduce((acc: number, curr: any) => acc + Number(curr.monto), 0);
    if (totalPagado >= Number(deuda.monto_total)) {
      await supabase.from('deudas').update({ estado: 'pagada' }).eq('id', payload.deuda_id);
    }
  }

  return createdPago;
}

export async function deletePagoDeuda(pagoId: string, deudaId: string): Promise<void> {
  if (isDemoModeActive()) {
    localStore.pagos_deuda = localStore.pagos_deuda.filter((p) => p.id !== pagoId);

    // Revisar si la deuda debe reactivarse
    const targetDeuda = localStore.deudas.find((d) => d.id === deudaId);
    if (targetDeuda) {
      const allPagos = localStore.pagos_deuda.filter((p) => p.deuda_id === targetDeuda.id);
      const sumPagado = allPagos.reduce((acc, curr) => acc + curr.monto, 0);
      if (sumPagado < targetDeuda.monto_total && targetDeuda.estado === 'pagada') {
        targetDeuda.estado = 'activa';
      }
    }

    saveLocalStore(localStore);
    return;
  }

  if (!supabase) throw new Error('Supabase no disponible');
  await requireAuthenticatedUser();

  const { error } = await supabase.from('pagos_deuda').delete().eq('id', pagoId);
  if (error) throw error;

  // Revisar estado de la deuda
  const [{ data: deuda }, { data: pagos }] = await Promise.all([
    supabase.from('deudas').select('monto_total, estado').eq('id', deudaId).single(),
    supabase.from('pagos_deuda').select('monto').eq('deuda_id', deudaId),
  ]);

  if (deuda && pagos) {
    const totalPagado = pagos.reduce((acc: number, curr: any) => acc + Number(curr.monto), 0);
    if (totalPagado < Number(deuda.monto_total) && deuda.estado === 'pagada') {
      await supabase.from('deudas').update({ estado: 'activa' }).eq('id', deudaId);
    }
  }
}

// -------------------------------------------------------------
// ESTADÍSTICAS DASHBOARD
// -------------------------------------------------------------

export interface DashboardStats {
  totalGastadoMes: number;
  totalGastadoMesAnterior: number;
  variacionPorcentajeMes: number;
  totalFacturasPeriodo: number;
  saldoPendienteDeudas: number;
  gastoPorCategoria: Array<{
    categoriaId: string;
    nombre: string;
    total: number;
    color: string;
    porcentaje: number;
  }>;
  evolucion12Meses: Array<{
    mes: string;
    total: number;
    facturas: number;
  }>;
  comparativaCategorias: Array<{
    categoria: string;
    mesActual: number;
    mesAnterior: number;
    color: string;
  }>;
}

export async function getDashboardStats(
  filterDateRange: 'current_month' | 'last_month' | 'last_3_months' | 'year' | 'all' = 'current_month',
  filterCategoriaId?: string | null
): Promise<DashboardStats> {
  const [facturas, categorias, deudas] = await Promise.all([
    getFacturas(),
    getCategorias(),
    getDeudas(),
  ]);

  const catMap = new Map(categorias.map((c) => [c.id, c]));

  // Determinar mes actual y mes anterior basados en la fecha de referencia
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  const curYearMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const prevYearMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

  // Filtrar facturas según categoría si se especifica
  const filteredFacturas = filterCategoriaId
    ? facturas.filter((f) => {
        if (f.categoria_id === filterCategoriaId) return true;
        // O si alguno de sus ítems pertenece a la categoría
        return f.items?.some((it) => it.categoria?.id === filterCategoriaId || it.producto?.categoria_id === filterCategoriaId);
      })
    : facturas;

  // Total gastado en el mes actual
  const currentMonthFacturas = filteredFacturas.filter((f) => f.fecha.startsWith(curYearMonth));
  const totalGastadoMes = currentMonthFacturas.reduce((sum, f) => sum + f.total, 0);

  // Total gastado en el mes anterior
  const prevMonthFacturas = filteredFacturas.filter((f) => f.fecha.startsWith(prevYearMonth));
  const totalGastadoMesAnterior = prevMonthFacturas.reduce((sum, f) => sum + f.total, 0);

  // Variación %
  let variacionPorcentajeMes = 0;
  if (totalGastadoMesAnterior > 0) {
    variacionPorcentajeMes = ((totalGastadoMes - totalGastadoMesAnterior) / totalGastadoMesAnterior) * 100;
  } else if (totalGastadoMes > 0) {
    variacionPorcentajeMes = 100;
  }

  // Filtrar facturas para el período seleccionado
  let periodFacturas = filteredFacturas;
  if (filterDateRange === 'current_month') {
    periodFacturas = filteredFacturas.filter((f) => f.fecha.startsWith(curYearMonth));
  } else if (filterDateRange === 'last_month') {
    periodFacturas = filteredFacturas.filter((f) => f.fecha.startsWith(prevYearMonth));
  } else if (filterDateRange === 'last_3_months') {
    const threeMonthsAgo = new Date(currentYear, currentMonth - 2, 1);
    periodFacturas = filteredFacturas.filter((f) => new Date(f.fecha) >= threeMonthsAgo);
  } else if (filterDateRange === 'year') {
    periodFacturas = filteredFacturas.filter((f) => f.fecha.startsWith(`${currentYear}`));
  }

  const totalFacturasPeriodo = periodFacturas.length;

  // Saldo total de deudas activas
  const saldoPendienteDeudas = deudas
    .filter((d) => d.estado !== 'pagada')
    .reduce((sum, d) => sum + d.saldo_pendiente, 0);

  // 1. GASTO POR CATEGORÍA (Donut Chart)
  // Calculado a partir de los ítems de las facturas del período
  const catTotalsMap = new Map<string, number>();

  for (const fac of periodFacturas) {
    if (fac.items && fac.items.length > 0) {
      for (const it of fac.items) {
        const catId = it.categoria?.id || it.producto?.categoria_id || fac.categoria_id || 'otros';
        const currentSum = catTotalsMap.get(catId) || 0;
        catTotalsMap.set(catId, currentSum + (it.subtotal || it.cantidad * it.precio_unitario));
      }
    } else {
      const catId = fac.categoria_id || 'otros';
      const currentSum = catTotalsMap.get(catId) || 0;
      catTotalsMap.set(catId, currentSum + fac.total);
    }
  }

  const totalPeriodSpend = Array.from(catTotalsMap.values()).reduce((a, b) => a + b, 0) || 1;

  const gastoPorCategoria = Array.from(catTotalsMap.entries())
    .map(([catId, total]) => {
      const cat = catMap.get(catId);
      return {
        categoriaId: catId,
        nombre: cat?.nombre || 'Otros y Varios',
        total,
        color: cat?.color || '#0F4C5C',
        porcentaje: (total / totalPeriodSpend) * 100,
      };
    })
    .sort((a, b) => b.total - a.total);

  // 2. EVOLUCIÓN ÚLTIMOS 12 MESES (Line Chart)
  const evolucion12Meses: Array<{ mes: string; total: number; facturas: number }> = [];
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const ymString = `${y}-${String(m + 1).padStart(2, '0')}`;
    const label = `${monthNames[m]} ${String(y).slice(2)}`;

    const monthFacs = filteredFacturas.filter((f) => f.fecha.startsWith(ymString));
    const total = monthFacs.reduce((sum, f) => sum + f.total, 0);

    evolucion12Meses.push({
      mes: label,
      total,
      facturas: monthFacs.length,
    });
  }

  // 3. COMPARATIVA MES ACTUAL VS MES ANTERIOR POR CATEGORÍA (Bar Chart)
  const comparativaMap = new Map<string, { actual: number; anterior: number; color: string }>();

  // Iniciar con categorías conocidas
  for (const cat of categorias) {
    comparativaMap.set(cat.nombre, { actual: 0, anterior: 0, color: cat.color });
  }

  for (const fac of currentMonthFacturas) {
    const catName = fac.categoria?.nombre || 'Otros y Varios';
    const entry = comparativaMap.get(catName) || { actual: 0, anterior: 0, color: '#0F4C5C' };
    entry.actual += fac.total;
    comparativaMap.set(catName, entry);
  }

  for (const fac of prevMonthFacturas) {
    const catName = fac.categoria?.nombre || 'Otros y Varios';
    const entry = comparativaMap.get(catName) || { actual: 0, anterior: 0, color: '#0F4C5C' };
    entry.anterior += fac.total;
    comparativaMap.set(catName, entry);
  }

  const comparativaCategorias = Array.from(comparativaMap.entries())
    .map(([categoria, val]) => ({
      categoria,
      mesActual: val.actual,
      mesAnterior: val.anterior,
      color: val.color,
    }))
    .filter((item) => item.mesActual > 0 || item.mesAnterior > 0)
    .sort((a, b) => b.mesActual - a.mesActual);

  return {
    totalGastadoMes,
    totalGastadoMesAnterior,
    variacionPorcentajeMes,
    totalFacturasPeriodo,
    saldoPendienteDeudas,
    gastoPorCategoria,
    evolucion12Meses,
    comparativaCategorias,
  };
}
