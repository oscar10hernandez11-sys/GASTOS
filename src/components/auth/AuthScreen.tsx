import React, { useState } from 'react';
import {
  Wallet,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  Database,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { signIn, signUp, setDemoModeActive } from '../../services/dataService';
import { isSupabaseConfigured } from '../../lib/supabase';
import { CURRENT_APP_VERSION } from '../../lib/changelog';
import { HeaderThemeButton, DarkModeToggleButton } from '../common/ThemeSelector';

interface AuthScreenProps {
  onSuccess: () => void;
  onOpenChangelogModal: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSuccess,
  onOpenChangelogModal,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationNotice, setConfirmationNotice] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setConfirmationNotice(false);
    setLoading(true);

    try {
      if (isRegister) {
        const res = await signUp(email, password);
        if (res.error) {
          setError(res.error);
        } else if (res.confirmationRequired) {
          setConfirmationNotice(true);
        } else {
          onSuccess();
        }
      } else {
        const res = await signIn(email, password);
        if (res.error) {
          setError(res.error);
        } else {
          onSuccess();
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Error inesperado al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterDemo = () => {
    setDemoModeActive(true);
    onSuccess();
  };

  return (
    <div className="min-h-screen bg-[var(--page-bg)] flex flex-col justify-between text-slate-800 dark:text-slate-100 selection:bg-[var(--accent)] selection:text-white transition-colors duration-200">
      {/* Top bar with version & setup tools */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-slate-200/80 dark:border-[var(--card-border)] bg-white/70 dark:bg-[var(--sidebar-bg)]/85 backdrop-blur-xs">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white font-bold shadow-xs">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-slate-900 dark:text-slate-100 tracking-tight text-base">
              Kakebo
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-2 hidden sm:inline">
              Finanzas & Facturas OCR
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <DarkModeToggleButton />
          <HeaderThemeButton />
          <button
            onClick={onOpenChangelogModal}
            className="text-xs px-2.5 py-1 font-mono font-medium rounded-full bg-slate-100 dark:bg-[var(--card-muted)] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1.5 border border-transparent dark:border-[var(--card-border)]"
            title="Ver registro de cambios de la versión"
          >
            <Sparkles className="w-3 h-3 text-[var(--accent-fg)]" />
            <span>{CURRENT_APP_VERSION}</span>
          </button>
        </div>
      </header>

      {/* Main card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          {/* Hero Branding */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Control de Finanzas Personales
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
              Registra facturas con OCR local sin subir fotos, compara la variación de precios de compra y controla tus deudas.
            </p>
          </div>

          {/* Quick Demo Button (Top Priority for Instant Experience) */}
          <div className="mb-6">
            <button
              onClick={handleEnterDemo}
              className="w-full group p-4 bg-white dark:bg-[var(--card-bg)] hover:bg-slate-50 dark:hover:bg-[var(--card-muted)] border border-slate-200/90 dark:border-[var(--card-border)] hover:border-[var(--accent-border)] rounded-lg shadow-xs transition-all text-left flex items-center justify-between"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-lg bg-[var(--accent-soft)] text-[var(--accent-fg)] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    Explorar modo demo
                    <span className="text-[10px] font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                      Sin registro
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Carga datos simulados en memoria (Éxito, Carulla, D1, deudas).
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[var(--accent-fg)] group-hover:translate-x-1 transition-all" />
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-[var(--card-border)]" />
            </div>
            <div className="relative inline-block bg-[var(--page-bg)] px-3 text-xs text-slate-400 uppercase tracking-wider font-medium">
              o accede con tu cuenta
            </div>
          </div>

          {/* Auth Card */}
          <div className="bg-white dark:bg-[var(--card-bg)] rounded-lg border border-slate-200 dark:border-[var(--card-border)] shadow-xs p-6 sm:p-7">
            {/* Tabs */}
            <div className="flex rounded-md bg-slate-100 dark:bg-[var(--card-muted)] p-1 mb-6">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setError(null);
                }}
                className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
                  !isRegister
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setError(null);
                }}
                className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
                  isRegister
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Crear cuenta
              </button>
            </div>

            {/* Pending configuration notice */}
            {!isSupabaseConfigured && (
              <div className="mb-4 p-3 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="font-semibold">Servicio de cuentas no disponible temporalmente</p>
                  <p className="mt-0.5 text-amber-800 dark:text-amber-300 leading-snug">
                    Puedes explorar todas las funciones al instante usando el <strong>Modo Demo</strong> arriba.
                  </p>
                </div>
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className="mb-4 p-3 rounded-md bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {/* Confirmation notice */}
            {confirmationNotice && (
              <div className="mb-4 p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="font-semibold">Revisa tu correo electrónico</p>
                  <p className="mt-0.5 text-emerald-700 dark:text-emerald-300">
                    Te enviamos un enlace de confirmación para activar tu cuenta de Supabase.
                  </p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Correo electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    disabled={!isSupabaseConfigured}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-200 dark:border-[var(--card-border)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent-fg)] focus:border-[var(--accent-fg)] text-slate-900 dark:text-slate-100 bg-white dark:bg-[var(--card-muted)] placeholder-slate-400 disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    disabled={!isSupabaseConfigured}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-200 dark:border-[var(--card-border)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent-fg)] focus:border-[var(--accent-fg)] text-slate-900 dark:text-slate-100 bg-white dark:bg-[var(--card-muted)] placeholder-slate-400 disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:text-slate-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !isSupabaseConfigured}
                className="w-full mt-2 py-2.5 px-4 bg-[var(--accent)] hover:bg-[var(--accent-hover)] active:scale-[0.99] text-white text-xs font-medium rounded-md shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isRegister ? 'Registrarme en Supabase' : 'Iniciar Sesión'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-[var(--card-border)] flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Datos privados y aislados
              </span>
              <span className="font-mono">
                {isSupabaseConfigured ? 'Conexión Segura' : 'Modo Demo'}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-400 border-t border-slate-200/80 dark:border-[var(--card-border)] bg-white/50 dark:bg-[var(--sidebar-bg)]/70">
        <div className="max-w-xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Kakebo — Finanzas y OCR local sin fotos</span>
          <button
            onClick={onOpenChangelogModal}
            className="hover:text-slate-700 dark:hover:text-slate-200 underline underline-offset-2"
          >
            Versión {CURRENT_APP_VERSION}
          </button>
        </div>
      </footer>
    </div>
  );
};
