import React, { useState, useEffect } from 'react';
import {
  Folders,
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  X,
  Check,
} from 'lucide-react';
import {
  getCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  getProductos,
} from '../../services/dataService';
import { Categoria } from '../../types/database';
import {
  IconRenderer,
  AVAILABLE_CATEGORY_ICONS,
  AVAILABLE_CATEGORY_COLORS,
} from '../common/IconRenderer';
import { useTheme } from '../../lib/theme';

export const CategoriasView: React.FC = () => {
  const { theme } = useTheme();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [icono, setIcono] = useState('Tag');
  const [color, setColor] = useState(theme.accent);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Alerta global de eliminación
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, prods] = await Promise.all([
        getCategorias(),
        getProductos(),
      ]);
      setCategorias(cats);

      // Calcular productos asociados
      const pCount: Record<string, number> = {};
      for (const p of prods) {
        if (p.categoria_id) {
          pCount[p.categoria_id] = (pCount[p.categoria_id] || 0) + 1;
        }
      }
      setProductCounts(pCount);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setNombre('');
    setIcono('ShoppingCart');
    setColor(theme.accent);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Categoria) => {
    setEditingId(cat.id);
    setNombre(cat.nombre);
    setIcono(cat.icono);
    setColor(cat.color);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setModalError('Por favor ingresa un nombre para la categoría.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await updateCategoria(editingId, nombre.trim(), icono, color);
      } else {
        await createCategoria(nombre.trim(), icono, color);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error(err);
      setModalError(err?.message || 'Error al guardar la categoría.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cat: Categoria) => {
    setActionError(null);
    const prodCount = productCounts[cat.id] || 0;

    if (prodCount > 0) {
      setActionError(
        `No se puede eliminar la categoría "${cat.nombre}" porque tiene ${prodCount} producto(s) vinculado(s). Reasígnalos primero en Productos y Precios para proteger tus análisis.`
      );
      return;
    }

    if (window.confirm(`¿Estás seguro de eliminar la categoría "${cat.nombre}"?`)) {
      const res = await deleteCategoria(cat.id);
      if (!res.success) {
        setActionError(res.error || 'Error al eliminar la categoría.');
      } else {
        await loadData();
      }
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Categorías de Gastos
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Organiza tus productos y presupuestos con iconos y colores personalizados
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-md text-xs font-medium transition-colors shadow-2xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Categoría</span>
        </button>
      </div>

      {actionError && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs rounded-lg flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Acción bloqueada para proteger tus datos</p>
            <p className="mt-0.5 leading-relaxed">{actionError}</p>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grid of Categories */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
          Cargando categorías...
        </div>
      ) : categorias.length === 0 ? (
        <div className="bg-white dark:bg-[var(--card-bg)] rounded-lg border border-slate-200 dark:border-[var(--card-border)] p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[var(--card-muted)] text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Folders className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            No hay categorías creadas
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Crea categorías para organizar tus facturas y compras.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 px-3.5 py-1.5 bg-[var(--accent)] text-white rounded-md text-xs font-medium hover:bg-[var(--accent-hover)] transition-colors"
          >
            Crear Primera Categoría
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categorias.map((cat) => {
            const prodCount = productCounts[cat.id] || 0;

            return (
              <div
                key={cat.id}
                className="bg-white dark:bg-[var(--card-bg)] rounded-lg border border-slate-200/90 dark:border-[var(--card-border)] shadow-2xs p-4 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-2xs"
                      style={{ backgroundColor: cat.color }}
                    >
                      <IconRenderer name={cat.icono} className="w-5 h-5 text-white" />
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                        title="Editar categoría"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                        title="Eliminar categoría"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-3">
                    {cat.nombre}
                  </h3>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[var(--card-border)] flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>{prodCount} producto(s)</span>
                  <span className="text-[10px] font-sans text-slate-400 dark:text-slate-500">Por producto</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Crear / Editar Categoría */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-[var(--card-bg)] rounded-lg shadow-xl border border-slate-200 dark:border-[var(--card-border)] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[var(--card-border)] bg-slate-50 dark:bg-[var(--card-muted)]">
              <div className="flex items-center space-x-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: color }}
                >
                  <IconRenderer name={icono} className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {editingId ? 'Editar Categoría' : 'Nueva Categoría'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Elige nombre, icono representativo y color
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="p-2.5 rounded bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nombre de la Categoría
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Supermercado, Salud, Streaming..."
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-[var(--card-muted)] border border-slate-200 dark:border-[var(--card-border)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent-fg)] text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Selecciona un Ícono
                </label>
                <div className="grid grid-cols-7 gap-2 max-h-36 overflow-y-auto p-1.5 border border-slate-200 dark:border-[var(--card-border)] rounded-md bg-white dark:bg-[var(--card-muted)]">
                  {AVAILABLE_CATEGORY_ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIcono(ic)}
                      className={`p-2 rounded flex items-center justify-center transition-colors ${
                        icono === ic
                          ? 'bg-[var(--accent)] text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={ic}
                    >
                      <IconRenderer name={ic} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Color Distintivo
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_CATEGORY_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setColor(col)}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 relative"
                      style={{ backgroundColor: col }}
                    >
                      {color === col && (
                        <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded text-xs font-medium transition-colors shadow-2xs disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Crear Categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
