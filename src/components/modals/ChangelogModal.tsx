import React from 'react';
import { X, Sparkles, Calendar, CheckCircle2, GitBranch } from 'lucide-react';
import { APP_CHANGELOG_HISTORY, CURRENT_APP_VERSION } from '../../lib/changelog';
import { formatDateCO } from '../../lib/formatters';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white dark:bg-[var(--card-bg)] rounded-lg shadow-xl border border-slate-200 dark:border-[var(--card-border)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[var(--card-border)] bg-slate-50/70 dark:bg-[var(--card-muted)]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] text-[var(--accent-fg)] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Historial de Versiones
                <span className="text-xs px-2 py-0.5 font-mono font-medium rounded-full bg-[var(--accent-soft)] text-[var(--accent-fg)] border border-[var(--accent-border)]">
                  {CURRENT_APP_VERSION}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registro de cambios y actualizaciones de Kakebo
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

        {/* Content list */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {APP_CHANGELOG_HISTORY.map((entry, idx) => (
            <div
              key={entry.version}
              className={`relative pl-6 pb-2 border-l-2 ${
                idx === 0 ? 'border-[var(--accent-fg)]' : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              {/* Dot */}
              <div
                className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 bg-white dark:bg-[var(--card-bg)] flex items-center justify-center ${
                  idx === 0
                    ? 'border-[var(--accent-fg)] text-[var(--accent-fg)]'
                    : 'border-slate-300 dark:border-slate-600 text-slate-400'
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    idx === 0 ? 'bg-[var(--accent-fg)]' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                />
              </div>

              {/* Version title and date */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-mono">
                    {entry.version}
                  </span>
                  {idx === 0 && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                      Versión actual
                    </span>
                  )}
                </div>
                <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDateCO(entry.fecha)}</span>
                </div>
              </div>

              {/* Items */}
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                {entry.cambios.map((change, cIdx) => (
                  <li key={cIdx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-fg)] shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-[var(--card-muted)] border-t border-slate-100 dark:border-[var(--card-border)] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5" />
            <span>Colección: <code className="text-slate-700 dark:text-slate-200 font-mono">app_changelog</code></span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded font-medium text-xs transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
