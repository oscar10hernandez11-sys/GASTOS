import React, { useState } from 'react';
import { X, Copy, Check, Database, ExternalLink, Terminal } from 'lucide-react';

interface SqlSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SQL_SCRIPT = `-- ====================================================================
-- ESQUEMA COMPLETO DE BASE DE DATOS PARA SUPABASE
-- Plataforma: Kakebo - Control de Finanzas Personales & Facturas OCR
-- Copia y pega este script en: Supabase Dashboard -> SQL Editor -> New Query -> RUN
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABLA: categorias
CREATE TABLE IF NOT EXISTS public.categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    nombre TEXT NOT NULL,
    icono TEXT NOT NULL DEFAULT 'Tag',
    color TEXT NOT NULL DEFAULT '#0F4C5C',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TABLA: productos
CREATE TABLE IF NOT EXISTS public.productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
    nombre TEXT NOT NULL,
    unidad_medida TEXT NOT NULL DEFAULT 'unidad',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TABLA: facturas (no almacena fotos ni URLs de fotos)
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

-- 4. TABLA: items_factura
CREATE TABLE IF NOT EXISTS public.items_factura (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    factura_id UUID NOT NULL REFERENCES public.facturas(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
    cantidad NUMERIC(10,2) NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    precio_unitario NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (precio_unitario >= 0),
    subtotal NUMERIC(14,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED
);

-- 5. TABLA: deudas
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

-- 6. TABLA: pagos_deuda
CREATE TABLE IF NOT EXISTS public.pagos_deuda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    deuda_id UUID NOT NULL REFERENCES public.deudas(id) ON DELETE CASCADE,
    fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
    monto NUMERIC(14,2) NOT NULL CHECK (monto > 0),
    nota TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. TABLA: app_changelog
CREATE TABLE IF NOT EXISTS public.app_changelog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version TEXT NOT NULL UNIQUE,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    cambios JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. VISTA: vista_deudas_saldo (con security_invoker = true)
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

-- 9. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_factura ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deudas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos_deuda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_changelog ENABLE ROW LEVEL SECURITY;

-- 10. POLÍTICAS DE ACCESO AISLADO POR USUARIO
CREATE POLICY "RLS_Categorias" ON public.categorias FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "RLS_Productos" ON public.productos FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "RLS_Facturas" ON public.facturas FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "RLS_ItemsFactura" ON public.items_factura FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "RLS_Deudas" ON public.deudas FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "RLS_PagosDeuda" ON public.pagos_deuda FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "RLS_Changelog" ON public.app_changelog FOR SELECT USING (true);

-- 11. TRIGGER: 7 Categorías automáticas para nuevos usuarios
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
`;

export const SqlSetupModal: React.FC<SqlSetupModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#121B24] rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#0E161E]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] text-[var(--accent-fg)] flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Script SQL para Supabase
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Esquema con RLS, tablas, vista_deudas_saldo y trigger de categorías
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions banner */}
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/70 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
          <Terminal className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Instrucciones de despliegue en 2 pasos:</p>
            <ol className="list-decimal pl-4 space-y-0.5 text-emerald-700 dark:text-emerald-300/90">
              <li>Crea un proyecto gratuito en <a href="https://supabase.com" target="_blank" rel="noreferrer" className="underline font-medium inline-flex items-center gap-0.5">Supabase <ExternalLink className="w-3 h-3" /></a></li>
              <li>Abre el <strong>SQL Editor</strong>, pega este script completo y presiona <strong>RUN</strong>. ¡Listo!</li>
            </ol>
          </div>
        </div>

        {/* Code area */}
        <div className="relative flex-1 overflow-hidden p-4 bg-slate-900 dark:bg-[#080D13] text-slate-100">
          <div className="absolute top-6 right-6 z-10">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors border border-white/20"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar SQL</span>
                </>
              )}
            </button>
          </div>
          <pre className="h-[45vh] overflow-y-auto text-xs font-mono leading-relaxed p-2 text-slate-300 selection:bg-[var(--accent)]">
            {SQL_SCRIPT}
          </pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-[#0E161E] border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            El archivo también se encuentra guardado en <code className="text-slate-800 dark:text-slate-200 font-mono">/supabase/schema.sql</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded text-xs font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
