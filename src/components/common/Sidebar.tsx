import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  Tag,
  CreditCard,
  Folders,
  LogOut,
  Sparkles,
  Database,
  Sliders,
  Wallet,
  RotateCcw,
} from 'lucide-react';
import { UserProfile } from '../../types/database';
import { CURRENT_APP_VERSION } from '../../lib/changelog';
import { isSupabaseConfigured } from '../../lib/supabase';
import { resetDemoData } from '../../services/dataService';

export type NavTab = 'dashboard' | 'facturas' | 'productos' | 'deudas' | 'categorias' | 'integracion';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  user: UserProfile | null;
  onLogout: () => void;
  onOpenChangelog: () => void;
  onOpenSqlModal: () => void;
  onOpenConfigModal: () => void;
  onRefreshData?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  user,
  onLogout,
  onOpenChangelog,
  onOpenSqlModal,
  onOpenConfigModal,
  onRefreshData,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'facturas' as NavTab,
      label: 'Facturas',
      icon: ReceiptText,
      badge: 'OCR',
    },
    {
      id: 'productos' as NavTab,
      label: 'Productos y Precios',
      icon: Tag,
      badge: null,
    },
    {
      id: 'deudas' as NavTab,
      label: 'Deudas y Abonos',
      icon: CreditCard,
      badge: null,
    },
    {
      id: 'categorias' as NavTab,
      label: 'Categorías',
      icon: Folders,
      badge: null,
    },
  ];

  const handleResetDemo = () => {
    if (window.confirm('¿Deseas restaurar los datos de prueba iniciales (facturas de Éxito, D1, deudas de muestra)?')) {
      resetDemoData();
      onRefreshData?.();
    }
  };

  return (
    <aside className="w-64 bg-white dark:bg-[var(--sidebar-bg)] border-r border-slate-200 dark:border-[var(--card-border)] flex flex-col justify-between shrink-0 select-none transition-colors">
      {/* Top: Logo & Brand */}
      <div>
        <div className="p-5 border-b border-slate-100 dark:border-[var(--card-border)] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-md bg-[var(--accent)] text-white flex items-center justify-center font-bold transition-colors">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-slate-900 dark:text-slate-100 tracking-tight text-sm">
                Kakebo
              </span>
              <p className="text-[10px] text-slate-400">Finanzas Personales</p>
            </div>
          </div>

          <button
            onClick={onOpenChangelog}
            className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[var(--card-muted)] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1 border border-slate-200/80 dark:border-[var(--card-border)]"
            title="Ver registro de cambios de la app"
          >
            <Sparkles className="w-2.5 h-2.5 text-[var(--accent-fg)]" />
            <span>{CURRENT_APP_VERSION}</span>
          </button>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-[var(--accent-soft)] text-[var(--accent-fg)] font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--accent-fg)]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-[var(--accent)] text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Admin-only Integration & System tools */}
        {user?.isAdmin && (
          <div className="px-3 py-2 border-t border-slate-100 dark:border-[var(--card-border)] mt-2 space-y-1">
            <p className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Integración (Admin)
            </p>
            <button
              onClick={() => onSelectTab('integracion')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                currentTab === 'integracion'
                  ? 'bg-[var(--accent-soft)] text-[var(--accent-fg)] font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Sliders className={`w-3.5 h-3.5 ${currentTab === 'integracion' ? 'text-[var(--accent-fg)]' : 'text-slate-400'}`} />
                <span>Integración Supabase</span>
              </div>
              <span
                className={`w-2 h-2 rounded-full ${
                  isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-400'
                }`}
              />
            </button>
            <button
              onClick={onOpenSqlModal}
              className="w-full flex items-center space-x-2.5 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-md transition-colors"
            >
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span>Script SQL Supabase</span>
            </button>
            <button
              onClick={onOpenConfigModal}
              className="w-full flex items-center space-x-2.5 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-md transition-colors"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              <span>Estado del Backend</span>
            </button>
          </div>
        )}

        {/* Demo mode reset option */}
        {user?.isDemo && (
          <div className="px-3 py-2 border-t border-slate-100 dark:border-[var(--card-border)] mt-2">
            <button
              onClick={handleResetDemo}
              className="w-full flex items-center space-x-2.5 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-md transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Restaurar datos demo</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom: User Card and Logout */}
      <div className="p-3 border-t border-slate-100 dark:border-[var(--card-border)] bg-slate-50/50 dark:bg-black/15">
        <div className="p-2 rounded-md bg-white dark:bg-[var(--card-muted)] border border-slate-200/80 dark:border-[var(--card-border)] mb-2">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                {user?.email || 'Usuario'}
              </p>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    user?.isDemo
                      ? 'bg-amber-500'
                      : user?.isAdmin
                      ? 'bg-[var(--accent-fg)]'
                      : 'bg-emerald-500'
                  }`}
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {user?.isDemo
                    ? 'Modo Demo (En memoria)'
                    : user?.isAdmin
                    ? 'Administrador'
                    : 'Cuenta Personal'}
                </span>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Cerrar sesión"
              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-2 flex items-center justify-between text-[10px] text-slate-400">
          <span>Kakebo Finanzas</span>
          <button
            onClick={onOpenChangelog}
            className="hover:text-slate-600 dark:hover:text-slate-200 font-mono"
          >
            {CURRENT_APP_VERSION}
          </button>
        </div>
      </div>
    </aside>
  );
};
