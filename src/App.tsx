/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { getCurrentUser, signOut } from './services/dataService';
import { UserProfile } from './types/database';
import { AuthScreen } from './components/auth/AuthScreen';
import { Sidebar, NavTab } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { DashboardView } from './components/dashboard/DashboardView';
import { FacturasView } from './components/facturas/FacturasView';
import { ProductosView } from './components/productos/ProductosView';
import { DeudasView } from './components/deudas/DeudasView';
import { CategoriasView } from './components/categorias/CategoriasView';
import { IntegracionView } from './components/integracion/IntegracionView';
import { ChangelogModal } from './components/modals/ChangelogModal';
import { SqlSetupModal } from './components/modals/SqlSetupModal';
import { SupabaseConfigModal } from './components/modals/SupabaseConfigModal';
import { X } from 'lucide-react';

import { supabase } from './lib/supabase';
import { ThemeProvider } from './lib/theme';

const TAB_STORAGE_KEY = 'kakebo_active_tab';
const VALID_TABS: NavTab[] = ['dashboard', 'facturas', 'productos', 'deudas', 'categorias', 'integracion'];

function getInitialTab(): NavTab {
  if (typeof window === 'undefined') return 'dashboard';
  try {
    const saved = window.sessionStorage.getItem(TAB_STORAGE_KEY) as NavTab | null;
    if (saved && VALID_TABS.includes(saved)) {
      return saved;
    }
  } catch {
    // ignore storage errors
  }
  return 'dashboard';
}

function AppContent() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<NavTab>(getInitialTab);

  // Modals
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Mobile drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Key to force refresh/unmount views cleanly on user switch or logout
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSelectTab = (tab: NavTab) => {
    setCurrentTab(tab);
    try {
      window.sessionStorage.setItem(TAB_STORAGE_KEY, tab);
    } catch {
      // ignore storage errors
    }
  };

  const syncUserSilently = async (showSpinner = false) => {
    if (showSpinner) {
      setAuthLoading(true);
    }
    try {
      const currentUser = await getCurrentUser();
      setUser((prev) => {
        if (!currentUser) return null;
        if (
          prev &&
          prev.id === currentUser.id &&
          prev.email === currentUser.email &&
          prev.isDemo === currentUser.isDemo &&
          prev.isAdmin === currentUser.isAdmin
        ) {
          return prev;
        }
        return currentUser;
      });
    } catch {
      if (showSpinner) {
        setUser(null);
      }
    } finally {
      if (showSpinner) {
        setAuthLoading(false);
      }
    }
  };

  useEffect(() => {
    syncUserSilently(true);

    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        handleSelectTab('dashboard');
        setRefreshKey((k) => k + 1);
      } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        // Al volver a la pestaña del navegador, Supabase emite SIGNED_IN para validar la sesión.
        // Sincronizamos en segundo plano sin activar authLoading para no recargar ni desmontar vistas.
        setUser((prev) => {
          if (prev && session?.user && prev.id === session.user.id) {
            return prev;
          }
          void syncUserSilently(false);
          return prev;
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    handleSelectTab('dashboard');
    try {
      window.sessionStorage.removeItem(TAB_STORAGE_KEY);
    } catch {
      // ignore
    }
    setIsChangelogOpen(false);
    setIsSqlModalOpen(false);
    setIsConfigModalOpen(false);
    setIsMobileMenuOpen(false);
    setRefreshKey((k) => k + 1);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--page-bg)] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-[var(--accent-fg)] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Iniciando Kakebo...</p>
      </div>
    );
  }

  // Si no hay usuario autenticado ni modo demo activo, mostrar pantalla de autenticación y bienvenida
  if (!user) {
    return (
      <>
        <AuthScreen
          onSuccess={() => syncUserSilently(false)}
          onOpenChangelogModal={() => setIsChangelogOpen(true)}
        />
        <ChangelogModal
          isOpen={isChangelogOpen}
          onClose={() => setIsChangelogOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--page-bg)] flex text-slate-900 dark:text-slate-100 font-sans selection:bg-[var(--accent)] selection:text-white transition-colors duration-200">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          user={user}
          onLogout={handleLogout}
          onOpenChangelog={() => setIsChangelogOpen(true)}
          onOpenSqlModal={() => setIsSqlModalOpen(true)}
          onOpenConfigModal={() => setIsConfigModalOpen(true)}
          onRefreshData={() => setRefreshKey((k) => k + 1)}
        />
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-72 max-w-xs h-full bg-white dark:bg-[var(--sidebar-bg)] flex flex-col border-r border-slate-200 dark:border-[var(--card-border)]">
            <div className="p-3 flex justify-end">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar
                currentTab={currentTab}
                onSelectTab={(tab) => {
                  handleSelectTab(tab);
                  setIsMobileMenuOpen(false);
                }}
                user={user}
                onLogout={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                onOpenChangelog={() => {
                  setIsMobileMenuOpen(false);
                  setIsChangelogOpen(true);
                }}
                onOpenSqlModal={() => {
                  setIsMobileMenuOpen(false);
                  setIsSqlModalOpen(true);
                }}
                onOpenConfigModal={() => {
                  setIsMobileMenuOpen(false);
                  setIsConfigModalOpen(true);
                }}
                onRefreshData={() => setRefreshKey((k) => k + 1)}
              />
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          currentTab={currentTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenChangelog={() => setIsChangelogOpen(true)}
          onOpenSqlModal={() => setIsSqlModalOpen(true)}
          user={user}
        />

        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && <DashboardView key={`dash-${refreshKey}`} />}
          {currentTab === 'facturas' && <FacturasView key={`fac-${refreshKey}`} />}
          {currentTab === 'productos' && <ProductosView key={`prod-${refreshKey}`} />}
          {currentTab === 'deudas' && <DeudasView key={`deu-${refreshKey}`} />}
          {currentTab === 'categorias' && <CategoriasView key={`cat-${refreshKey}`} />}
          {currentTab === 'integracion' && user.isAdmin && (
            <IntegracionView
              key={`int-${refreshKey}`}
              onOpenSqlModal={() => setIsSqlModalOpen(true)}
            />
          )}
        </main>

        <Footer
          onOpenChangelog={() => setIsChangelogOpen(true)}
          onOpenSqlModal={() => setIsSqlModalOpen(true)}
          isAdmin={Boolean(user.isAdmin)}
        />
      </div>

      {/* Global Modals */}
      <ChangelogModal
        isOpen={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
      />
      {user.isAdmin && (
        <>
          <SqlSetupModal
            isOpen={isSqlModalOpen}
            onClose={() => setIsSqlModalOpen(false)}
          />
          <SupabaseConfigModal
            isOpen={isConfigModalOpen}
            onClose={() => setIsConfigModalOpen(false)}
          />
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
