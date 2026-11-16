-- ====================================================================
-- ESQUEMA COMPLETO DE BASE DE DATOS PARA SUPABASE
-- Plataforma: Kakebo - Control de Finanzas Personales & Facturas OCR
-- ====================================================================

-- 1. Habilitar extensión pgcrypto para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLA: categorias
CREATE TABLE IF NOT EXISTS public.categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    nombre TEXT NOT NULL,
    icono TEXT NOT NULL DEFAULT 'Tag',
    color TEXT NOT NULL DEFAULT '#0F4C5C',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TABLA: productos
CREATE TABLE IF NOT EXISTS public.productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
    nombre TEXT NOT NULL,
    unidad_medida TEXT NOT NULL DEFAULT 'unidad',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TABLA: facturas (no almacena fotos ni URLs de fotos)
CREATE TABLE IF NOT EXISTS public.facturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    proveedor TEXT NOT NULL,
    categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
    total NUMERIC(14,2) NOT NULL DEFAULT 0,
    nota TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TABLA: items_factura
CREATE TABLE IF NOT EXISTS public.items_factura (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    factura_id UUID NOT NULL REFERENCES public.facturas(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
    cantidad NUMERIC(10,2) NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    precio_unitario NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (precio_unitario >= 0),
    subtotal NUMERIC(14,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED
);

-- 6. TABLA: deudas
CREATE TABLE IF NOT EXISTS public.deudas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    nombre TEXT NOT NULL,
    acreedor TEXT NOT NULL,
    monto_total NUMERIC(14,2) NOT NULL CHECK (monto_total > 0),
    fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_limite DATE,
    tasa_interes NUMERIC(5,2) DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'pagada', 'vencida')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. TABLA: pagos_deuda
CREATE TABLE IF NOT EXISTS public.pagos_deuda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    deuda_id UUID NOT NULL REFERENCES public.deudas(id) ON DELETE CASCADE,
    fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
    monto NUMERIC(14,2) NOT NULL CHECK (monto > 0),
    nota TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. TABLA: app_changelog (historial de versiones del proyecto)
CREATE TABLE IF NOT EXISTS public.app_changelog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version TEXT NOT NULL UNIQUE,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    cambios JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. VISTA: vista_deudas_saldo (con security_invoker = true)
CREATE OR REPLACE VIEW public.vista_deudas_saldo
WITH (security_invoker = true) AS
SELECT 
    d.id,
    d.user_id,
    d.nombre,
    d.acreedor,
    d.monto_total,
    d.fecha_inicio,
    d.fecha_limite,
    d.tasa_interes,
    d.estado,
    d.created_at,
    COALESCE(SUM(p.monto), 0)::NUMERIC(14,2) AS total_pagado,
    GREATEST(0, d.monto_total - COALESCE(SUM(p.monto), 0))::NUMERIC(14,2) AS saldo_pendiente
FROM public.deudas d
LEFT JOIN public.pagos_deuda p ON d.id = p.deuda_id
GROUP BY d.id;

-- 10. HABILITAR ROW LEVEL SECURITY (RLS) EN TODAS LAS TABLAS
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_factura ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deudas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos_deuda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_changelog ENABLE ROW LEVEL SECURITY;

-- 11. POLÍTICAS DE SEGURIDAD (Cada usuario accede únicamente a sus propios datos)
-- Categorías
CREATE POLICY "Usuarios gestionan sus propias categorias" 
ON public.categorias FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Productos
CREATE POLICY "Usuarios gestionan sus propios productos" 
ON public.productos FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Facturas
CREATE POLICY "Usuarios gestionan sus propias facturas" 
ON public.facturas FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Items Factura
CREATE POLICY "Usuarios gestionan sus propios items de factura" 
ON public.items_factura FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Deudas
CREATE POLICY "Usuarios gestionan sus propias deudas" 
ON public.deudas FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Pagos de Deuda
CREATE POLICY "Usuarios gestionan sus propios pagos de deuda" 
ON public.pagos_deuda FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Changelog (Lectura pública para usuarios autenticados y anónimos)
CREATE POLICY "Lectura pública de changelog" 
ON public.app_changelog FOR SELECT 
USING (true);

-- 12. TRIGGER: Crear 7 categorías por defecto al registrarse un nuevo usuario
CREATE OR REPLACE FUNCTION public.handle_new_user_categories()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.categorias (user_id, nombre, icono, color) VALUES
        (NEW.id, 'Alimentación y Supermercado', 'ShoppingCart', '#16A34A'),
        (NEW.id, 'Vivienda y Servicios', 'Home', '#2563EB'),
        (NEW.id, 'Transporte', 'Car', '#D97706'),
        (NEW.id, 'Salud y Bienestar', 'HeartPulse', '#DC2626'),
        (NEW.id, 'Educación', 'GraduationCap', '#7C3AED'),
        (NEW.id, 'Entretenimiento y Ocio', 'Film', '#DB2777'),
        (NEW.id, 'Otros y Varios', 'MoreHorizontal', '#475569');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_categories();

-- 13. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_categorias_user ON public.categorias(user_id);
CREATE INDEX IF NOT EXISTS idx_productos_user ON public.productos(user_id);
CREATE INDEX IF NOT EXISTS idx_facturas_user_fecha ON public.facturas(user_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_items_factura_user ON public.items_factura(user_id, factura_id);
CREATE INDEX IF NOT EXISTS idx_items_factura_producto ON public.items_factura(producto_id);
CREATE INDEX IF NOT EXISTS idx_deudas_user ON public.deudas(user_id);
CREATE INDEX IF NOT EXISTS idx_pagos_deuda_deuda ON public.pagos_deuda(deuda_id);
