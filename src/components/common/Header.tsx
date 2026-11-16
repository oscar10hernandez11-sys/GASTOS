import React from 'react';
import { Menu, Sparkles, Database, Wallet } from 'lucide-react';
import { NavTab } from './Sidebar';
import { CURRENT_APP_VERSION } from '../../lib/changelog';
import { UserProfile } from '../../types/database';
import { HeaderThemeButton, DarkModeToggleButton } from './ThemeSelector';

interface HeaderProps {
  currentTab: NavTab;
  onOpenMobileMenu: () => void;
  onOpenChangelog: () => void;
  onOpenSqlModal: () => void;
  user: UserProfile | null;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobileMenu,
  onOpenChangelog,
  onOpenSqlModal,
  user,
}) => {
  const titles: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Panel Principal',
      subtitle: 'Resumen ejecutivo de gastos, métricas y variaciones',
    },
    facturas: {
      title: 'Facturas de Gastos',
      subtitle: 'Captura manual, escáner OCR local o importación masiva CSV',
    },
    productos: {
      title: 'Productos y Comparativa de Precios',
      subtitle: 'Monitorea fluctuaciones de precios entre compras sucesivas',
    },
    deudas: {
      title: 'Control de Deudas y Abonos',
      subtitle: 'Plan de amortización, saldo pendiente y registro de pagos',
    },
    categorias: {
      title: 'Categorías de Gasto',
      subtitle: 'Organización personalizada con protección de dependencias',
    },
    integracion: {
      title: 'Integración Supabase & Netlify',
      subtitle: 'Diagnóstico en vivo de tablas, RLS y configuración de entorno',
    },
  };

  const current = titles[currentTab];

  return (
    <header className="bg-white dark:bg-[var(--sidebar-bg)] border-b border-slate-200 dark:border-[var(--card-border)] px-4 sm:px-8 py-3.5 flex items-center justify-between shrink-0 transition-colors">
      <div className="flex items-center space-x-3">
        {/* Mobile menu button */}
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile brand icon */}
        <div className="lg:hidden w-7 h-7 rounded bg-[var(--accent)] text-white flex items-center justify-center font-bold">
          <Wallet className="w-4 h-4" />
        </div>

        <div>
          <h1 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
            {current.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            {current.subtitle}
          </p>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center space-x-2 sm:space-x-2.5">
        {user?.isDemo && (
          <span className="hidden sm:inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
            Modo Demo
          </span>
        )}

        <DarkModeToggleButton />
        <HeaderThemeButton />

        {user?.isAdmin && (
          <button
            onClick={onOpenSqlModal}
            className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors border border-slate-200 dark:border-[var(--card-border)]"
          >
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Script SQL</span>
          </button>
        )}

        <button
          onClick={onOpenChangelog}
          className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-mono font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-[var(--card-muted)] hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors border border-slate-200 dark:border-[var(--card-border)]"
          title="Ver registro de versiones"
        >
          <Sparkles className="w-3 h-3 text-[var(--accent-fg)]" />
          <span>{CURRENT_APP_VERSION}</span>
        </button>
      </div>
    </header>
  );
};
