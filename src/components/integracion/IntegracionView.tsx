import React, { useState } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Server,
  Copy,
  Check,
  Cloud,
  ExternalLink,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface TableStatus {
  name: string;
  status: 'pending' | 'ok' | 'error';
  detail?: string;
}

const REQUIRED_TABLES = [
  'categorias',
  'productos',
  'facturas',
  'items_factura',
  'deudas',
  'pagos_deuda',
  'vista_deudas_saldo',
];

interface IntegracionViewProps {
  onOpenSqlModal: () => void;
}

export const IntegracionView: React.FC<IntegracionViewProps> = ({ onOpenSqlModal }) => {
  const [testing, setTesting] = useState(false);
  const [tablesStatus, setTablesStatus] = useState<TableStatus[]>(
    REQUIRED_TABLES.map((name) => ({ name, status: 'pending' }))
  );
  const [testDone, setTestDone] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  const handleTestConnection = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    setTesting(true);
    setTestDone(false);

    const results: TableStatus[] = [];
    for (const table of REQUIRED_TABLES) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          results.push({
            name: table,
            status: 'error',
            detail: error.message || 'No accesible',
          });
        } else {
          results.push({
            name: table,
            status: 'ok',
            detail: 'Tabla/vista activa con RLS',
          });
        }
      } catch {
        results.push({
          name: table,
          status: 'error',
          detail: 'Error de red o permisos',
        });
      }
    }

    setTablesStatus(results);
    setTesting(false);
    setTestDone(true);
  };

  const handleCopyEnvTemplate = () => {
    navigator.clipboard.writeText(
      'VITE_SUPABASE_URL=tu_url_de_supabase\nVITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase'
    );
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Banner de Estado */}
      <div className="bg-white dark:bg-[var(--card-bg)] p-6 rounded-lg border border-slate-200 dark:border-[var(--card-border)] shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                isSupabaseConfigured
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
              }`}
            >
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Integración con Supabase & Netlify
                </h2>
                <span
                  className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
                    isSupabaseConfigured
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                  }`}
                >
                  {isSupabaseConfigured ? 'Entorno Conectado' : 'Configuración Pendiente'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {isSupabaseConfigured
                  ? 'Las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY están activas. Cada usuario accede únicamente a sus propios registros mediante Row Level Security (RLS).'
                  : 'No se detectaron variables de entorno de Supabase activas. La aplicación opera en Modo Demo en memoria hasta que configures VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenSqlModal}
              className="px-3.5 py-2 bg-slate-100 dark:bg-[var(--card-muted)] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 border border-transparent dark:border-[var(--card-border)]"
            >
              <Database className="w-3.5 h-3.5 text-[var(--accent-fg)]" />
              <span>Ver Script SQL</span>
            </button>

            <button
              onClick={handleTestConnection}
              disabled={!isSupabaseConfigured || testing}
              className="px-3.5 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Verificando...' : 'Probar Conexión'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Diagnóstico de Tablas y Vistas */}
      <div className="bg-white dark:bg-[var(--card-bg)] rounded-lg border border-slate-200 dark:border-[var(--card-border)] shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-[var(--card-border)] flex items-center justify-between bg-slate-50/70 dark:bg-[var(--card-muted)]">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[var(--accent-fg)]" />
              Estado del Esquema y Políticas RLS
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Verifica en vivo que todas las tablas requeridas existan en tu proyecto de Supabase
            </p>
          </div>
          {testDone && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              {tablesStatus.filter((t) => t.status === 'ok').length}/{REQUIRED_TABLES.length} activas
            </span>
          )}
        </div>

        <div className="divide-y divide-slate-100 dark:divide-[var(--card-border)]">
          {tablesStatus.map((item) => (
            <div
              key={item.name}
              className="px-6 py-3 flex items-center justify-between text-xs hover:bg-slate-50/50 dark:hover:bg-[var(--card-muted)]/50"
            >
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{item.name}</span>
                {item.name === 'vista_deudas_saldo' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    VIEW (security_invoker)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {item.status === 'pending' && (
                  <span className="text-slate-400">
                    {isSupabaseConfigured ? 'Pulsa "Probar Conexión"' : 'Sin entorno configurado'}
                  </span>
                )}
                {item.status === 'ok' && (
                  <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {item.detail}
                  </span>
                )}
                {item.status === 'error' && (
                  <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800/60 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {item.detail}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Guía de Variables de Entorno y Netlify */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[var(--card-bg)] p-6 rounded-lg border border-slate-200 dark:border-[var(--card-border)] shadow-2xs space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Cloud className="w-4 h-4 text-[var(--accent-fg)]" />
            Variables de Entorno (Vite + Netlify)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Por seguridad, ninguna llave ni URL se almacena en el código fuente. Configura estas dos variables en tu archivo local <code className="font-mono text-slate-800 dark:text-slate-200">.env</code> o en el panel de <strong>Netlify</strong>:
          </p>
          <div className="relative bg-slate-900 text-slate-100 p-3.5 rounded-md font-mono text-[11px] leading-relaxed border border-slate-800">
            <button
              onClick={handleCopyEnvTemplate}
              className="absolute top-2.5 right-2.5 px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] flex items-center gap-1 transition-colors"
            >
              {copiedEnv ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedEnv ? 'Copiado' : 'Copiar'}</span>
            </button>
            <div>VITE_SUPABASE_URL=tu_url_de_supabase</div>
            <div>VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[var(--card-bg)] p-6 rounded-lg border border-slate-200 dark:border-[var(--card-border)] shadow-2xs space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--accent-fg)]" />
            Checklist para Producción
          </h3>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Archivo <code className="font-mono text-slate-800 dark:text-slate-200">netlify.toml</code> configurado con redirección SPA (<code className="font-mono">/* → /index.html 200</code>).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Escaneo OCR 100% local en navegador sin subida ni almacenamiento de imágenes.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                Obtén tu llave pública desde{' '}
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--accent-fg)] underline inline-flex items-center gap-0.5"
                >
                  Supabase Dashboard <ExternalLink className="w-3 h-3" />
                </a>
                .
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
