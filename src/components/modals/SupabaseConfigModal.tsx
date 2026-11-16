import React, { useState } from 'react';
import { X, Server, AlertCircle, CheckCircle, ShieldCheck, ExternalLink, RefreshCw, CheckCircle2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CHECK_TABLES = [
  'categorias',
  'productos',
  'facturas',
  'items_factura',
  'deudas',
  'pagos_deuda',
  'vista_deudas_saldo',
];

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose }) => {
  const [testing, setTesting] = useState(false);
  const [tableResults, setTableResults] = useState<Array<{ name: string; ok: boolean; error?: string }> | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    setTesting(true);
    const results: Array<{ name: string; ok: boolean; error?: string }> = [];

    for (const table of CHECK_TABLES) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        results.push({
          name: table,
          ok: !error,
          error: error?.message,
        });
      } catch {
        results.push({ name: table, ok: false, error: 'Error de red' });
      }
    }

    setTableResults(results);
    setTesting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#121B24] rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#0E161E]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] text-[var(--accent-fg)] flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Integración con Supabase
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Estado del backend y verificación de esquema
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

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="flex items-start gap-2.5 p-3 rounded-lg border text-xs bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800">
            {isSupabaseConfigured ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-emerald-800 dark:text-emerald-300 space-y-1 flex-1">
                  <p className="font-semibold">Conexión activa mediante variables de entorno</p>
                  <p className="text-emerald-700 dark:text-emerald-300/90 leading-relaxed">
                    Las variables <code className="font-mono">VITE_SUPABASE_URL</code> y{' '}
                    <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> están configuradas en el entorno.
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-amber-900 dark:text-amber-200 space-y-1">
                  <p className="font-semibold">Variables de entorno pendientes</p>
                  <p className="text-amber-800 dark:text-amber-300/90 leading-relaxed">
                    No se detectaron credenciales en el entorno. Puedes explorar el <strong>Modo Demo</strong> en memoria o configurar tus variables para habilitar el acceso multiusuario.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Live Test Button */}
          {isSupabaseConfigured && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Diagnóstico en vivo de tablas y RLS
                </span>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="px-3 py-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                  <span>{testing ? 'Verificando...' : 'Probar Conexión'}</span>
                </button>
              </div>

              {tableResults && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-md divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  {tableResults.map((res) => (
                    <div key={res.name} className="px-3 py-2 flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-800 dark:text-slate-200">{res.name}</span>
                      {res.ok ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Activa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" /> {res.error || 'Faltante'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[var(--accent-fg)]" />
              Configuración segura (Vite + Netlify)
            </h3>
            <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed">
              <li>
                En local, copia <code className="font-mono text-slate-800 dark:text-slate-200">.env.example</code> a{' '}
                <code className="font-mono text-slate-800 dark:text-slate-200">.env</code> (excluido de Git).
              </li>
              <li>
                En <strong>Netlify</strong>, configura en{' '}
                <em>Site configuration → Environment variables</em>:
                <ul className="list-disc pl-4 mt-1 font-mono text-[11px] text-slate-800 dark:text-slate-200">
                  <li>VITE_SUPABASE_URL</li>
                  <li>VITE_SUPABASE_ANON_KEY</li>
                </ul>
              </li>
              <li>
                Usa siempre la llave pública desde{' '}
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--accent-fg)] underline inline-flex items-center gap-0.5"
                >
                  Supabase Dashboard <ExternalLink className="w-3 h-3" />
                </a>
                . Nunca expongas llaves privadas de servidor en el frontend.
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-[#0E161E] border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium rounded-md transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
