import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Sparkles, RefreshCw, Sun, Moon } from 'lucide-react';
import { APP_THEMES, useTheme } from '../../lib/theme';

interface ThemePanelContentProps {
  compact?: boolean;
  onClose?: () => void;
}

export const ThemePanelContent: React.FC<ThemePanelContentProps> = ({ compact = false }) => {
  const {
    theme,
    isDark,
    customAccent,
    syncCategories,
    setSyncCategories,
    setDarkMode,
    selectTheme,
    setCustomAccentColor,
    applyThemePaletteToCategories,
    applyingCategories,
  } = useTheme();

  return (
    <div className="space-y-3">
      {/* Selector Modo Claro / Oscuro */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200/80 dark:border-slate-700/70">
        <div>
          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            Modo de iluminación
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Se combina con tu paleta de colores elegida
          </p>
        </div>

        <div className="inline-flex items-center p-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
          <button
            type="button"
            onClick={() => setDarkMode(false)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
              !isDark
                ? 'bg-white text-slate-900 font-medium shadow-2xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Claro</span>
          </button>
          <button
            type="button"
            onClick={() => setDarkMode(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
              isDark
                ? 'bg-[var(--accent)] text-white font-medium shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Oscuro</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            Tema global de colores
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Aplica a la navegación, botones, fondos y gráficas del Dashboard
          </p>
        </div>
        {applyingCategories && (
          <RefreshCw className="w-3.5 h-3.5 text-[var(--accent-fg)] animate-spin shrink-0" />
        )}
      </div>

      {/* Temas predefinidos */}
      <div className={`grid gap-2 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {APP_THEMES.map((item) => {
          const isActive = !customAccent && theme.id === item.id;
          return (
            <button
              key={item.id}
              type="button"
              disabled={applyingCategories}
              onClick={() => selectTheme(item.id)}
              className={`flex items-center justify-between px-3 py-2 rounded-md border text-left transition-all disabled:opacity-60 ${
                isActive
                  ? 'border-[var(--accent-fg)] bg-[var(--accent-tint)]'
                  : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[var(--card-muted)] hover:bg-slate-50 dark:hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center border border-black/15 dark:border-white/20"
                  style={{ backgroundColor: item.accent }}
                >
                  {isActive && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">
                    {item.name}
                  </div>
                  {!compact && (
                    <div className="text-[10px] text-slate-400 dark:text-slate-400 truncate">
                      {item.description}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-0.5 shrink-0 ml-2">
                {item.categoryPalette.slice(0, 4).map((col) => (
                  <span
                    key={col}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Color personalizado libre + Sincronización con categorías */}
      <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/70 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200 cursor-pointer">
          <input
            type="color"
            value={theme.accent}
            onChange={(e) => setCustomAccentColor(e.target.value)}
            className="w-6 h-6 rounded border border-slate-300 dark:border-slate-600 cursor-pointer bg-transparent p-0"
            title="Elegir color principal personalizado"
          />
          <span>Color libre para toda la app</span>
          {customAccent && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent-fg)]">
              {customAccent.toUpperCase()}
            </span>
          )}
        </label>

        <label className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={syncCategories}
            onChange={(e) => {
              const checked = e.target.checked;
              setSyncCategories(checked);
              if (checked) {
                applyThemePaletteToCategories();
              }
            }}
            className="rounded border-slate-300 dark:border-slate-600 accent-[var(--accent)]"
          />
          <span>Sincronizar categorías</span>
        </label>
      </div>
    </div>
  );
};

export const DarkModeToggleButton: React.FC = () => {
  const { isDark, toggleDarkMode } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleDarkMode}
      className="flex items-center justify-center p-1.5 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[var(--card-muted)] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors border border-slate-200 dark:border-[var(--card-border)]"
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {isDark ? (
        <Sun className="w-3.5 h-3.5 text-amber-400" />
      ) : (
        <Moon className="w-3.5 h-3.5 text-slate-600" />
      )}
    </button>
  );
};

export const HeaderThemeButton: React.FC = () => {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-[var(--card-muted)] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors border border-slate-200 dark:border-[var(--card-border)]"
        title="Cambiar tema de colores y modo claro/oscuro"
      >
        <span
          className="w-2.5 h-2.5 rounded-full border border-black/15 dark:border-white/25 shrink-0"
          style={{ backgroundColor: theme.accentFg }}
        />
        <Palette className="w-3.5 h-3.5 text-[var(--accent-fg)]" />
        <span className="hidden md:inline">Tema</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[var(--card-bg)] rounded-lg shadow-xl border border-slate-200 dark:border-[var(--card-border)] p-4 z-50">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-700/70">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent-fg)]" />
              Apariencia, Modo Oscuro y Colores
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Cerrar
            </button>
          </div>
          <ThemePanelContent compact />
        </div>
      )}
    </div>
  );
};
