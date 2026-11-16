import React from 'react';
import { CURRENT_APP_VERSION } from '../../lib/changelog';
import { ShieldCheck, GitCommit } from 'lucide-react';

interface FooterProps {
  onOpenChangelog: () => void;
  onOpenSqlModal: () => void;
  isAdmin?: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenChangelog,
  onOpenSqlModal,
  isAdmin = false,
}) => {
  return (
    <footer className="w-full bg-white dark:bg-[var(--sidebar-bg)] border-t border-slate-200/80 dark:border-[var(--card-border)] px-4 sm:px-8 py-3 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0 transition-colors">
      <div className="flex items-center space-x-2">
        <span className="font-medium text-slate-700 dark:text-slate-200">Kakebo</span>
        <span>—</span>
        <span>Control de Finanzas Personales & OCR</span>
      </div>

      <div className="flex items-center space-x-4">
        <span className="flex items-center gap-1 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          Privacidad garantizada
        </span>

        {isAdmin && (
          <button
            onClick={onOpenSqlModal}
            className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors text-[11px] underline underline-offset-2"
          >
            Esquema SQL
          </button>
        )}

        <button
          onClick={onOpenChangelog}
          className="flex items-center gap-1 font-mono text-[11px] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors bg-slate-100 dark:bg-[var(--card-muted)] hover:bg-slate-200 dark:hover:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-[var(--card-border)]"
          title="Ver registro de versiones"
        >
          <GitCommit className="w-3 h-3 text-[var(--accent-fg)]" />
          <span>Versión {CURRENT_APP_VERSION}</span>
        </button>
      </div>
    </footer>
  );
};
