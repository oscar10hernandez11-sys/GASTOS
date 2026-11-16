import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  CreditCard,
  Filter,
  RefreshCw,
  PieChart as PieIcon,
  Calendar,
  Palette,
  Check,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  LabelList,
} from 'recharts';
import {
  getDashboardStats,
  DashboardStats,
  getCategorias,
  updateCategoria,
} from '../../services/dataService';
import { Categoria } from '../../types/database';
import { formatCOP, formatPercent } from '../../lib/formatters';
import { useTheme } from '../../lib/theme';
import { ThemePanelContent } from '../common/ThemeSelector';

function formatCompactAxisCOP(value: number): string {
  if (value === 0) return '$0';
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return `$${value}`;
}

function truncateSingleLine(text: string, maxLen: number = 24): string {
  if (!text) return '';
  return text.length > maxLen ? `${text.slice(0, maxLen - 1)}…` : text;
}

const SingleLineCategoryTick: React.FC<{
  x?: number;
  y?: number;
  payload?: { value: string };
  fillColor?: string;
}> = ({ x = 0, y = 0, payload, fillColor = '#334155' }) => {
  const fullLabel = payload?.value || '';
  const displayLabel = truncateSingleLine(fullLabel, 24);
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={-6}
        y={0}
        dy={4}
        textAnchor="end"
        fill={fillColor}
        fontSize={11}
        fontWeight={500}
      >
        <title>{fullLabel}</title>
        {displayLabel}
      </text>
    </g>
  );
};

export const DashboardView: React.FC = () => {
  const { theme, isDark, categorySyncVersion } = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [dateFilter, setDateFilter] = useState<'current_month' | 'last_month' | 'last_3_months' | 'year' | 'all'>('current_month');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('');

  // Panel de personalización de tema y colores
  const [isEditingColors, setIsEditingColors] = useState(false);
  const [savingColorId, setSavingColorId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cats, dashboardData] = await Promise.all([
        getCategorias(),
        getDashboardStats(dateFilter, selectedCategoria || null),
      ]);
      setCategorias(cats);
      setStats(dashboardData);
    } catch {
      setError('No fue posible cargar las estadísticas del panel.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateFilter, selectedCategoria, categorySyncVersion]);

  const handleChangeCategoryColor = async (catId: string, newColor: string) => {
    const target = categorias.find((c) => c.id === catId);
    if (!target) return;

    // Actualización optimista inmediata en UI
    setCategorias((prev) =>
      prev.map((c) => (c.id === catId ? { ...c, color: newColor } : c))
    );
    setStats((prev) =>
      prev
        ? {
            ...prev,
            gastoPorCategoria: prev.gastoPorCategoria.map((g) =>
              g.categoriaId === catId ? { ...g, color: newColor } : g
            ),
          }
        : prev
    );

    setSavingColorId(catId);
    try {
      await updateCategoria(target.id, target.nombre, target.icono, newColor);
    } catch {
      await loadData();
    } finally {
      setSavingColorId(null);
    }
  };

  const totalDonutSpend =
    stats?.gastoPorCategoria.reduce((sum, item) => sum + item.total, 0) || 0;

  const activeMonths =
    stats?.evolucion12Meses.filter((m) => m.total > 0) || [];
  const averageMonthlySpend =
    activeMonths.length > 0
      ? activeMonths.reduce((s, m) => s + m.total, 0) / activeMonths.length
      : 0;
  const peakMonth =
    activeMonths.length > 0
      ? activeMonths.reduce((max, m) => (m.total > max.total ? m : max), activeMonths[0])
      : null;

  const comparativaHeight = Math.max(
    220,
    Math.min(440, (stats?.comparativaCategorias.length || 3) * 58)
  );

  const tooltipStyle: React.CSSProperties = {
    backgroundColor: theme.cardBg,
    borderRadius: '8px',
    border: `1px solid ${theme.cardBorder}`,
    fontSize: '12px',
    color: isDark ? '#F1F5F9' : '#0F172A',
    boxShadow: isDark
      ? '0 8px 24px rgba(0, 0, 0, 0.45)'
      : '0 4px 12px rgba(15, 23, 42, 0.08)',
  };

  if (loading && !stats) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[var(--accent-fg)] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Cargando métricas y análisis financiero...
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-[var(--card-bg)] p-4 rounded-lg border border-slate-200/90 dark:border-[var(--card-border)] shadow-2xs flex flex-wrap items-center justify-between gap-4 transition-colors">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <Filter className="w-3.5 h-3.5 text-[var(--accent-fg)]" />
            <span>Filtros:</span>
          </div>

          {/* Period selector */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-[var(--card-muted)] p-0.5 rounded-md text-xs">
            <button
              onClick={() => setDateFilter('current_month')}
              className={`px-2.5 py-1 rounded transition-colors ${
                dateFilter === 'current_month'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Este mes
            </button>
            <button
              onClick={() => setDateFilter('last_month')}
              className={`px-2.5 py-1 rounded transition-colors ${
                dateFilter === 'last_month'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Mes anterior
            </button>
            <button
              onClick={() => setDateFilter('last_3_months')}
              className={`px-2.5 py-1 rounded transition-colors ${
                dateFilter === 'last_3_months'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Últimos 3 meses
            </button>
            <button
              onClick={() => setDateFilter('year')}
              className={`px-2.5 py-1 rounded transition-colors ${
                dateFilter === 'year'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Este año
            </button>
            <button
              onClick={() => setDateFilter('all')}
              className={`px-2.5 py-1 rounded transition-colors ${
                dateFilter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Todo
            </button>
          </div>

          {/* Category filter dropdown */}
          <div className="relative">
            <select
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-[var(--card-muted)] border border-slate-200 dark:border-[var(--card-border)] text-slate-700 dark:text-slate-200 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--accent-fg)]"
            >
              <option value="">Todas las categorías</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="text-xs text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 dark:border-[var(--card-border)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          title="Actualizar datos"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Gasto del mes */}
        <div className="bg-white dark:bg-[var(--card-bg)] p-5 rounded-lg border border-slate-200 dark:border-[var(--card-border)] shadow-2xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Gasto del mes</span>
            <div className="w-8 h-8 rounded-md bg-[var(--accent-soft)] text-[var(--accent-fg)] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight font-mono">
            {formatCOP(stats?.totalGastadoMes)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            En el mes actual en curso
          </p>
        </div>

        {/* KPI 2: Variación vs mes anterior */}
        <div className="bg-white dark:bg-[var(--card-bg)] p-5 rounded-lg border border-slate-200 dark:border-[var(--card-border)] shadow-2xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Variación vs mes anterior</span>
            <div
              className={`w-8 h-8 rounded-md flex items-center justify-center ${
                (stats?.variacionPorcentajeMes || 0) <= 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
              }`}
            >
              {(stats?.variacionPorcentajeMes || 0) <= 0 ? (
                <TrendingDown className="w-4 h-4" />
              ) : (
                <TrendingUp className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span
              className={`text-2xl font-bold tracking-tight font-mono ${
                (stats?.variacionPorcentajeMes || 0) <= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatPercent(stats?.variacionPorcentajeMes)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Mes anterior: {formatCOP(stats?.totalGastadoMesAnterior)}
          </p>
        </div>

        {/* KPI 3: Facturas en período */}
        <div className="bg-white dark:bg-[var(--card-bg)] p-5 rounded-lg border border-slate-200 dark:border-[var(--card-border)] shadow-2xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Facturas registradas</span>
            <div className="w-8 h-8 rounded-md bg-[var(--accent-soft)] text-[var(--accent-fg)] flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight font-mono">
            {stats?.totalFacturasPeriodo ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Comprobantes en el rango seleccionado
          </p>
        </div>

        {/* KPI 4: Saldo pendiente en deudas */}
        <div className="bg-white dark:bg-[var(--card-bg)] p-5 rounded-lg border border-slate-200 dark:border-[var(--card-border)] shadow-2xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Saldo total deudas</span>
            <div className="w-8 h-8 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight font-mono">
            {formatCOP(stats?.saldoPendienteDeudas)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Compromisos activos por pagar
          </p>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Chart 1: Donut Chart + Desglose completo y selector global de tema */}
        <div className="bg-white dark:bg-[var(--card-bg)] p-6 rounded-lg border border-slate-200 dark:border-[var(--card-border)] shadow-2xs flex flex-col transition-colors">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-[var(--accent-fg)]" />
                Distribución del Gasto por Categoría
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Toca cualquier color de categoría o cambia el tema global y modo oscuro
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsEditingColors((v) => !v)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors flex items-center gap-1.5 shrink-0 ${
                isEditingColors
                  ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                  : 'bg-slate-50 dark:bg-[var(--card-muted)] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-[var(--card-border)]'
              }`}
              title="Cambiar tema global, modo oscuro y colores por categoría"
            >
              {isEditingColors ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Listo</span>
                </>
              ) : (
                <>
                  <Palette className="w-3.5 h-3.5 text-[var(--accent-fg)]" />
                  <span>Tema y Colores</span>
                </>
              )}
            </button>
          </div>

          {/* Selector de Tema Global + Modo Oscuro */}
          {isEditingColors && (
            <div className="mb-5 p-3.5 rounded-lg bg-[var(--accent-tint)] border border-[var(--accent-border)]">
              <ThemePanelContent />
            </div>
          )}

          {stats?.gastoPorCategoria && stats.gastoPorCategoria.length > 0 ? (
            <div className="space-y-5">
              {/* Donut centrado con total exacto */}
              <div className="h-52 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.gastoPorCategoria}
                      cx="50%"
                      cy="50%"
                      innerRadius="60%"
                      outerRadius="88%"
                      paddingAngle={2.5}
                      dataKey="total"
                      nameKey="nombre"
                    >
                      {stats.gastoPorCategoria.map((entry, index) => (
                        <Cell
                          key={`cell-${entry.categoriaId || index}`}
                          fill={entry.color || theme.accentFg}
                          stroke={theme.donutStroke}
                          strokeWidth={1.5}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any) => [
                        formatCOP(Number(value)),
                        String(name),
                      ]}
                      contentStyle={tooltipStyle}
                      itemStyle={{ color: isDark ? '#F1F5F9' : '#0F172A' }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-4 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                    Total Período
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                    {totalDonutSpend >= 10_000_000
                      ? formatCompactAxisCOP(totalDonutSpend)
                      : formatCOP(totalDonutSpend)}
                  </span>
                </div>
              </div>

              {/* Desglose completo sin cortes de texto y con selector de color directo */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-[var(--card-border)]">
                {stats.gastoPorCategoria.map((item) => {
                  const canEdit = categorias.some((c) => c.id === item.categoriaId);
                  const barColor = item.color || theme.accentFg;
                  return (
                    <div
                      key={item.categoriaId || item.nombre}
                      className="p-2.5 rounded-md border border-slate-100 dark:border-[var(--card-border)] bg-slate-50/40 dark:bg-[var(--card-muted)]/60 hover:bg-slate-50 dark:hover:bg-[var(--card-muted)] transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {canEdit ? (
                            <label
                              className="relative flex items-center cursor-pointer shrink-0"
                              title="Cambiar color de esta categoría"
                            >
                              <input
                                type="color"
                                value={barColor}
                                onChange={(e) =>
                                  handleChangeCategoryColor(item.categoriaId, e.target.value)
                                }
                                className="w-4 h-4 rounded cursor-pointer border border-slate-300 dark:border-slate-600 p-0 bg-transparent"
                              />
                              {savingColorId === item.categoriaId && (
                                <span className="ml-1 w-2.5 h-2.5 border border-[var(--accent-fg)] border-t-transparent rounded-full animate-spin" />
                              )}
                            </label>
                          ) : (
                            <span
                              className="w-3.5 h-3.5 rounded-sm shrink-0 border border-black/10 dark:border-white/20"
                              style={{ backgroundColor: barColor }}
                            />
                          )}

                          <span className="text-xs font-medium text-slate-800 dark:text-slate-100 leading-snug">
                            {item.nombre}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 font-mono">
                            {formatCOP(item.total)}
                          </span>
                          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 min-w-[48px] text-center">
                            {item.porcentaje.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Barra visual proporcional */}
                      <div className="mt-2 w-full h-1.5 bg-slate-200/70 dark:bg-slate-700/60 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.max(3, Math.min(100, item.porcentaje))}%`,
                            backgroundColor: barColor,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-xs text-slate-400">
              No hay compras registradas en el período
            </div>
          )}
        </div>

        {/* Chart 2: Comparativa Mes Actual vs Anterior por Categoría */}
        <div className="bg-white dark:bg-[var(--card-bg)] p-6 rounded-lg border border-slate-200 dark:border-[var(--card-border)] shadow-2xs flex flex-col transition-colors">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[var(--accent-fg)]" />
                Comparativa Mes Actual vs. Anterior
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Montos discriminados por categoría con valores directos
              </p>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-xs"
                  style={{ backgroundColor: theme.accentFg }}
                />
                Mes Actual
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-xs"
                  style={{ backgroundColor: theme.chartSecondary }}
                />
                Mes Anterior
              </span>
            </div>
          </div>

          {stats?.comparativaCategorias && stats.comparativaCategorias.length > 0 ? (
            <div className="space-y-4">
              <div style={{ height: `${comparativaHeight}px` }} className="w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.comparativaCategorias}
                    layout="vertical"
                    margin={{ top: 6, right: 60, left: 6, bottom: 6 }}
                    barGap={4}
                    barCategoryGap="24%"
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.chartGrid} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10, fill: theme.chartTick }}
                      tickFormatter={formatCompactAxisCOP}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="categoria"
                      width={165}
                      tick={<SingleLineCategoryTick fillColor={isDark ? '#E2E8F0' : '#334155'} />}
                      interval={0}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(val: any, name: any) => [
                        formatCOP(Number(val)),
                        name === 'mesActual' ? 'Mes Actual' : 'Mes Anterior',
                      ]}
                      contentStyle={tooltipStyle}
                      itemStyle={{ color: isDark ? '#F1F5F9' : '#0F172A' }}
                      cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.03)' }}
                    />
                    <Bar
                      dataKey="mesActual"
                      fill={theme.accentFg}
                      radius={[0, 4, 4, 0]}
                      barSize={13}
                      name="mesActual"
                    >
                      <LabelList
                        dataKey="mesActual"
                        position="right"
                        formatter={(val: any) =>
                          Number(val) > 0 ? formatCompactAxisCOP(Number(val)) : ''
                        }
                        style={{ fill: isDark ? '#E2E8F0' : '#334155', fontSize: 10, fontWeight: 600 }}
                      />
                    </Bar>
                    <Bar
                      dataKey="mesAnterior"
                      fill={theme.chartSecondary}
                      radius={[0, 4, 4, 0]}
                      barSize={13}
                      name="mesAnterior"
                    >
                      <LabelList
                        dataKey="mesAnterior"
                        position="right"
                        formatter={(val: any) =>
                          Number(val) > 0 ? formatCompactAxisCOP(Number(val)) : ''
                        }
                        style={{ fill: theme.chartTick, fontSize: 10 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Resumen tabular compacto para lectura exacta */}
              <div className="pt-3 border-t border-slate-100 dark:border-[var(--card-border)] space-y-1.5">
                {stats.comparativaCategorias.map((row) => {
                  const diff = row.mesActual - row.mesAnterior;
                  const diffPct =
                    row.mesAnterior > 0
                      ? (diff / row.mesAnterior) * 100
                      : row.mesActual > 0
                      ? 100
                      : 0;
                  return (
                    <div
                      key={row.categoria}
                      className="flex flex-wrap items-center justify-between gap-2 text-xs px-2.5 py-1.5 rounded bg-slate-50/70 dark:bg-[var(--card-muted)]/70"
                    >
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {row.categoria}
                      </span>
                      <div className="flex items-center gap-3 font-mono text-[11px]">
                        <span className="text-slate-900 dark:text-slate-100 font-semibold">
                          Actual: {formatCOP(row.mesActual)}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          Ant: {formatCOP(row.mesAnterior)}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded font-medium ${
                            diff <= 0
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                          }`}
                        >
                          {diff > 0 ? '+' : ''}
                          {diffPct.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-xs text-slate-400">
              Sin datos comparativos suficientes
            </div>
          )}
        </div>
      </div>

      {/* Chart 3: Evolución del gasto en los últimos 12 meses */}
      <div className="bg-white dark:bg-[var(--card-bg)] p-6 rounded-lg border border-slate-200 dark:border-[var(--card-border)] shadow-2xs transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[var(--accent-fg)]" />
              Evolución del Gasto (Últimos 12 Meses)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tendencia histórica de desembolsos mensuales
            </p>
          </div>

          {activeMonths.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="px-2.5 py-1 rounded-md bg-slate-50 dark:bg-[var(--card-muted)] border border-slate-200 dark:border-[var(--card-border)] text-slate-600 dark:text-slate-300">
                Promedio mensual:{' '}
                <strong className="text-slate-900 dark:text-slate-100 font-mono">
                  {formatCOP(averageMonthlySpend)}
                </strong>
              </span>
              {peakMonth && (
                <span className="px-2.5 py-1 rounded-md bg-[var(--accent-tint)] border border-[var(--accent-border)] text-slate-700 dark:text-slate-200">
                  Mes pico ({peakMonth.mes}):{' '}
                  <strong className="text-[var(--accent-fg)] font-mono">
                    {formatCOP(peakMonth.total)}
                  </strong>
                </span>
              )}
            </div>
          )}
        </div>

        <div className="h-72 w-full">
          {stats?.evolucion12Meses && stats.evolucion12Meses.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={stats.evolucion12Meses}
                margin={{ top: 12, right: 20, left: 8, bottom: 12 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.chartGrid} />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 11, fill: theme.chartTick }}
                  minTickGap={22}
                  tickMargin={8}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  width={56}
                  tick={{ fontSize: 11, fill: theme.chartTick }}
                  tickFormatter={formatCompactAxisCOP}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val: any) => [formatCOP(Number(val)), 'Total Gastado']}
                  labelFormatter={(label: any, payload: any) => {
                    const count = payload?.[0]?.payload?.facturas ?? 0;
                    return `${label} (${count} factura${count === 1 ? '' : 's'})`;
                  }}
                  contentStyle={tooltipStyle}
                  itemStyle={{ color: isDark ? '#F1F5F9' : '#0F172A' }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke={theme.accentFg}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: theme.accentFg, stroke: theme.cardBg, strokeWidth: 1.5 }}
                  activeDot={{ r: 6, stroke: theme.cardBg, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Aún no hay suficientes registros históricos
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
