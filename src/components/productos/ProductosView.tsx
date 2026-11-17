import React, { useState, useEffect } from 'react';
import {
  Tag,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Store,
  LineChart as LineChartIcon,
  X,
  History,
  ShoppingBag,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  getProductos,
  getCategorias,
  getProductPriceHistory,
  updateProductoCategoria,
} from '../../services/dataService';
import { Producto, Categoria } from '../../types/database';
import { formatCOP, formatDateCO, formatPercent } from '../../lib/formatters';
import { useTheme } from '../../lib/theme';

export const ProductosView: React.FC = () => {
  const { theme, isDark } = useTheme();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');

  // Detalle histórico de un producto
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [priceHistory, setPriceHistory] = useState<
    Array<{ fecha: string; precio_unitario: number; proveedor: string; cantidad: number }>
  >([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [updatingProdId, setUpdatingProdId] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([getProductos(), getCategorias()]);
      setProductos(prods);
      setCategorias(cats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenProductHistory = async (prod: Producto) => {
    setSavedNotice(null);
    setSelectedProduct(prod);
    setHistoryLoading(true);
    try {
      const history = await getProductPriceHistory(prod.id);
      setPriceHistory(history);
    } catch (err) {
      console.error('Error cargando historial de precios:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleChangeProductoCategoria = async (productoId: string, newCategoriaId: string) => {
    const catIdOrNull = newCategoriaId || null;
    setUpdatingProdId(productoId);
    setSavedNotice(null);
    try {
      await updateProductoCategoria(productoId, catIdOrNull);
      const updatedProds = await getProductos();
      setProductos(updatedProds);
      if (selectedProduct && selectedProduct.id === productoId) {
        const refreshed = updatedProds.find((p) => p.id === productoId) || null;
        setSelectedProduct(refreshed);
        setSavedNotice('Categoría del producto actualizada.');
        setTimeout(() => setSavedNotice(null), 2500);
      }
    } catch (err) {
      console.error('Error actualizando categoría del producto:', err);
    } finally {
      setUpdatingProdId(null);
    }
  };

  const filteredProducts = productos.filter((p) => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat =
      !filterCategoria
        ? true
        : filterCategoria === '__unassigned__'
        ? !p.categoria_id
        : p.categoria_id === filterCategoria;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header and Search Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar producto en tu catálogo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-white dark:bg-[var(--card-bg)] border border-slate-200 dark:border-[var(--card-border)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent-fg)] text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
          </div>

          <select
            value={filterCategoria}
            onChange={(e) => setFilterCategoria(e.target.value)}
            className="text-xs bg-white dark:bg-[var(--card-bg)] border border-slate-200 dark:border-[var(--card-border)] text-slate-700 dark:text-slate-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--accent-fg)]"
          >
            <option value="">Todas las categorías</option>
            <option value="__unassigned__">Sin asignar</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Total: <span className="text-slate-900 dark:text-slate-100 font-semibold">{filteredProducts.length}</span> productos
        </div>
      </div>

      {/* Products Table Card */}
      <div className="bg-white dark:bg-[var(--card-bg)] rounded-lg border border-slate-200 dark:border-[var(--card-border)] shadow-2xs overflow-hidden transition-colors">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
            Cargando catálogo y análisis de precios...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[var(--card-muted)] text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Tag className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              No se encontraron productos
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Los productos se registran y actualizan automáticamente al ingresar facturas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-[var(--card-muted)] border-b border-slate-200 dark:border-[var(--card-border)] text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4 text-right">Último Precio</th>
                  <th className="py-3 px-4 text-center">Variación vs. Anterior</th>
                  <th className="py-3 px-4">Último Proveedor</th>
                  <th className="py-3 px-4">Fecha Compra</th>
                  <th className="py-3 px-4 text-center">Historial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[var(--card-border)]">
                {filteredProducts.map((prod) => {
                  const hasVariation = prod.variacion_porcentaje !== undefined;
                  const isUp = (prod.variacion_porcentaje || 0) > 0;
                  const isDown = (prod.variacion_porcentaje || 0) < 0;

                  return (
                    <tr
                      key={prod.id}
                      onClick={() => handleOpenProductHistory(prod)}
                      className="hover:bg-slate-50/80 dark:hover:bg-[var(--card-muted)]/60 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                        <div>{prod.nombre}</div>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {prod.unidad_medida} • {prod.total_compras || 0} compras
                        </span>
                      </td>

                      <td
                        className="py-3.5 px-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              backgroundColor: prod.categoria?.color || '#94A3B8',
                            }}
                          />
                          <select
                            aria-label={`Categoría de ${prod.nombre}`}
                            value={prod.categoria_id || ''}
                            disabled={updatingProdId === prod.id}
                            onChange={(e) => handleChangeProductoCategoria(prod.id, e.target.value)}
                            className="text-[11px] font-medium px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[var(--accent-fg)] cursor-pointer disabled:opacity-50 max-w-[185px]"
                            title="Asignar o cambiar categoría del producto"
                          >
                            <option value="">Sin asignar</option>
                            {categorias.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.nombre}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
                        {prod.ultimo_precio ? formatCOP(prod.ultimo_precio) : '-'}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {hasVariation ? (
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded ${
                              isUp
                                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                                : isDown
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {isUp && <TrendingUp className="w-3 h-3" />}
                            {isDown && <TrendingDown className="w-3 h-3" />}
                            {!isUp && !isDown && <Minus className="w-3 h-3" />}
                            <span>{formatPercent(prod.variacion_porcentaje)}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-[140px]">
                            {prod.ultimo_proveedor || '-'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                        {formatDateCO(prod.ultima_fecha)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenProductHistory(prod);
                          }}
                          className="p-1.5 text-slate-400 hover:text-[var(--accent-fg)] hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                          title="Ver gráfico de precios"
                        >
                          <LineChartIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Gráfico histórico de precios del producto */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[var(--card-bg)] rounded-lg shadow-xl border border-slate-200 dark:border-[var(--card-border)] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[var(--card-border)] bg-slate-50 dark:bg-[var(--card-muted)]">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] text-[var(--accent-fg)] flex items-center justify-center">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Histórico de Precios: {selectedProduct.nombre}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Evolución del precio unitario pagado a través del tiempo
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Asignar categoría del producto */}
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-[var(--card-border)] bg-slate-50 dark:bg-[var(--card-muted)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Categoría del Producto
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Usada en la distribución por categoría del Dashboard
                  </p>
                </div>
                <div className="flex flex-col items-stretch sm:items-end gap-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: selectedProduct.categoria?.color || '#94A3B8',
                      }}
                    />
                    <select
                      value={selectedProduct.categoria_id || ''}
                      disabled={updatingProdId === selectedProduct.id}
                      onChange={(e) =>
                        handleChangeProductoCategoria(selectedProduct.id, e.target.value)
                      }
                      className="text-xs px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent-fg)] text-slate-900 dark:text-slate-100 disabled:opacity-50"
                    >
                      <option value="">Sin asignar</option>
                      {categorias.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  {savedNotice && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{savedNotice}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Summary KPIs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 dark:bg-[var(--card-muted)] p-3 rounded-lg border border-slate-200 dark:border-[var(--card-border)] text-center">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Último Precio</span>
                  <div className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                    {formatCOP(selectedProduct.ultimo_precio)}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-[var(--card-muted)] p-3 rounded-lg border border-slate-200 dark:border-[var(--card-border)] text-center">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Precio Anterior</span>
                  <div className="text-base font-bold text-slate-700 dark:text-slate-200 font-mono mt-0.5">
                    {selectedProduct.precio_anterior ? formatCOP(selectedProduct.precio_anterior) : '—'}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-[var(--card-muted)] p-3 rounded-lg border border-slate-200 dark:border-[var(--card-border)] text-center">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Variación</span>
                  <div
                    className={`text-base font-bold font-mono mt-0.5 ${
                      (selectedProduct.variacion_porcentaje || 0) > 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : (selectedProduct.variacion_porcentaje || 0) < 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {formatPercent(selectedProduct.variacion_porcentaje)}
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div>
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Gráfica de Tendencia de Precios
                </h4>

                <div className="h-60 w-full bg-slate-50/50 dark:bg-[var(--card-muted)]/60 p-2 rounded-lg border border-slate-200 dark:border-[var(--card-border)]">
                  {historyLoading ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      Cargando histórico...
                    </div>
                  ) : priceHistory.length <= 1 ? (
                    <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 gap-1">
                      <ShoppingBag className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                      <span>Solo hay una compra registrada para este producto ({formatCOP(selectedProduct.ultimo_precio)}).</span>
                      <span className="text-[11px] text-slate-400">La línea de tendencia aparecerá a partir de 2 compras.</span>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={priceHistory} margin={{ top: 15, right: 20, left: 20, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.chartGrid} />
                        <XAxis
                          dataKey="fecha"
                          tick={{ fontSize: 10, fill: theme.chartTick }}
                          tickFormatter={(val) => formatDateCO(val)}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: theme.chartTick }}
                          tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                          domain={['auto', 'auto']}
                        />
                        <Tooltip
                          formatter={(val: any) => [formatCOP(Number(val)), 'Precio Unitario']}
                          labelFormatter={(label: any) => `Fecha: ${formatDateCO(label)}`}
                          contentStyle={{
                            backgroundColor: theme.cardBg,
                            borderRadius: '8px',
                            border: `1px solid ${theme.cardBorder}`,
                            fontSize: '12px',
                            color: isDark ? '#F1F5F9' : '#0F172A',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="precio_unitario"
                          stroke={theme.accentFg}
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: theme.accentFg }}
                          activeDot={{ r: 6, stroke: theme.cardBg, strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Historial en lista */}
              <div>
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Registro detallado de compras
                </h4>
                <div className="border border-slate-200 dark:border-[var(--card-border)] rounded-md divide-y divide-slate-100 dark:divide-[var(--card-border)] max-h-40 overflow-y-auto">
                  {priceHistory.map((h, i) => (
                    <div key={i} className="px-3 py-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-medium text-slate-900 dark:text-slate-100">{h.proveedor}</span>
                        <span className="text-slate-400 ml-2 font-mono text-[11px]">
                          {formatDateCO(h.fecha)}
                        </span>
                      </div>
                      <div className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                        {formatCOP(h.precio_unitario)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50 dark:bg-[var(--card-muted)] border-t border-slate-100 dark:border-[var(--card-border)] flex justify-end">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded text-xs font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
