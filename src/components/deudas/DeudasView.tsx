import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Trash2,
  DollarSign,
  Calendar,
  Percent,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  History,
  Coins,
} from 'lucide-react';
import {
  getDeudas,
  createDeuda,
  deleteDeuda,
  createPagoDeuda,
  deletePagoDeuda,
  getPagosDeuda,
} from '../../services/dataService';
import { VistaDeudaSaldo, PagoDeuda } from '../../types/database';
import { formatCOP, formatDateCO } from '../../lib/formatters';

export const DeudasView: React.FC = () => {
  const [deudas, setDeudas] = useState<VistaDeudaSaldo[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal nueva deuda
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [acreedor, setAcreedor] = useState('');
  const [montoTotal, setMontoTotal] = useState<number | ''>('');
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaLimite, setFechaLimite] = useState('');
  const [tasaInteres, setTasaInteres] = useState<number | ''>('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Modal registrar y ver abonos
  const [selectedDeudaForPayment, setSelectedDeudaForPayment] = useState<VistaDeudaSaldo | null>(null);
  const [pagosList, setPagosList] = useState<PagoDeuda[]>([]);
  const [pagosLoading, setPagosLoading] = useState(false);
  const [pagoMonto, setPagoMonto] = useState<number | ''>('');
  const [pagoFecha, setPagoFecha] = useState(new Date().toISOString().split('T')[0]);
  const [pagoNota, setPagoNota] = useState('');
  const [pagoSubmitting, setPagoSubmitting] = useState(false);
  const [pagoError, setPagoError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getDeudas();
      setDeudas(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Abrir modal de abonos
  const handleOpenPaymentsModal = async (deuda: VistaDeudaSaldo) => {
    setSelectedDeudaForPayment(deuda);
    setPagoMonto('');
    setPagoNota('');
    setPagoFecha(new Date().toISOString().split('T')[0]);
    setPagoError(null);
    setPagosLoading(true);

    try {
      const pagos = await getPagosDeuda(deuda.id);
      setPagosList(pagos);
    } catch (err) {
      console.error('Error cargando pagos:', err);
    } finally {
      setPagosLoading(false);
    }
  };

  // Crear Deuda
  const handleCreateDeuda = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!nombre.trim() || !acreedor.trim() || !montoTotal || Number(montoTotal) <= 0) {
      setCreateError('Por favor completa el nombre, acreedor y un monto válido mayor a 0.');
      return;
    }

    setCreateSubmitting(true);
    try {
      await createDeuda({
        nombre: nombre.trim(),
        acreedor: acreedor.trim(),
        monto_total: Number(montoTotal),
        fecha_inicio: fechaInicio,
        fecha_limite: fechaLimite || null,
        tasa_interes: tasaInteres ? Number(tasaInteres) : 0,
      });

      setIsCreateModalOpen(false);
      setNombre('');
      setAcreedor('');
      setMontoTotal('');
      setFechaLimite('');
      setTasaInteres('');
      await loadData();
    } catch (err: any) {
      console.error(err);
      setCreateError(err?.message || 'Error al registrar la deuda.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Registrar Abono
  const handleCreatePago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeudaForPayment) return;
    setPagoError(null);

    const montoNum = Number(pagoMonto);
    if (!montoNum || montoNum <= 0) {
      setPagoError('Ingresa un monto de abono válido mayor a 0.');
      return;
    }

    setPagoSubmitting(true);
    try {
      await createPagoDeuda({
        deuda_id: selectedDeudaForPayment.id,
        fecha_pago: pagoFecha,
        monto: montoNum,
        nota: pagoNota.trim() || null,
      });

      // Recargar pagos de esta deuda
      const updatedPagos = await getPagosDeuda(selectedDeudaForPayment.id);
      setPagosList(updatedPagos);
      setPagoMonto('');
      setPagoNota('');

      // Recargar deudas generales para actualizar saldos y estado
      await loadData();

      // Actualizar la deuda en el modal
      const refreshedDeudas = await getDeudas();
      const refTarget = refreshedDeudas.find((d) => d.id === selectedDeudaForPayment.id);
      if (refTarget) {
        setSelectedDeudaForPayment(refTarget);
      }
    } catch (err: any) {
      console.error(err);
      setPagoError(err?.message || 'Error registrando el abono.');
    } finally {
      setPagoSubmitting(false);
    }
  };

  // Eliminar abono
  const handleDeletePago = async (pagoId: string) => {
    if (!selectedDeudaForPayment) return;
    if (window.confirm('¿Deseas anular este abono? El saldo pendiente se ajustará automáticamente.')) {
      try {
        await deletePagoDeuda(pagoId, selectedDeudaForPayment.id);
        const updatedPagos = await getPagosDeuda(selectedDeudaForPayment.id);
        setPagosList(updatedPagos);
        await loadData();
        const refreshedDeudas = await getDeudas();
        const refTarget = refreshedDeudas.find((d) => d.id === selectedDeudaForPayment.id);
        if (refTarget) setSelectedDeudaForPayment(refTarget);
      } catch (err) {
        console.error('Error eliminando pago:', err);
      }
    }
  };

  // Eliminar Deuda
  const handleDeleteDeuda = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este compromiso de deuda y todo su historial de pagos?')) {
      try {
        await deleteDeuda(id);
        await loadData();
      } catch (err) {
        console.error('Error eliminando deuda:', err);
      }
    }
  };

  // Totales generales
  const totalMontoDeudas = deudas.reduce((acc, d) => acc + d.monto_total, 0);
  const totalPagadoAcumulado = deudas.reduce((acc, d) => acc + d.total_pagado, 0);
  const totalSaldoPendiente = deudas.reduce((acc, d) => acc + d.saldo_pendiente, 0);
  const porcentajeGlobalPagado =
    totalMontoDeudas > 0 ? (totalPagadoAcumulado / totalMontoDeudas) * 100 : 0;

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#121B24] p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Monto Total Adquirido</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono mt-1">
            {formatCOP(totalMontoDeudas)}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            {deudas.length} compromiso(s) registrados
          </p>
        </div>

        <div className="bg-white dark:bg-[#121B24] p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Abonos Realizados</span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            {formatCOP(totalPagadoAcumulado)}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            {porcentajeGlobalPagado.toFixed(1)}% amortizado del total
          </p>
        </div>

        <div className="bg-white dark:bg-[#121B24] p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Saldo Pendiente por Pagar</span>
          <div className="text-2xl font-bold text-[var(--accent-fg)] font-mono mt-1">
            {formatCOP(totalSaldoPendiente)}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Restante en deudas activas
          </p>
        </div>
      </div>

      {/* Action Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Listado de Obligaciones y Créditos
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Seguimiento de amortización con vista_deudas_saldo
          </p>
        </div>

        <button
          onClick={() => {
            setCreateError(null);
            setIsCreateModalOpen(true);
          }}
          className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-md text-xs font-medium transition-colors shadow-2xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Deuda</span>
        </button>
      </div>

      {/* Deudas Cards Grid */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
          Cargando obligaciones...
        </div>
      ) : deudas.length === 0 ? (
        <div className="bg-white dark:bg-[#121B24] rounded-lg border border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-3">
            <CreditCard className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            No tienes deudas registradas
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Registra préstamos, créditos o compromisos familiares para llevar control de los abonos.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4 px-3.5 py-1.5 bg-[var(--accent)] text-white rounded-md text-xs font-medium hover:bg-[var(--accent-hover)] transition-colors"
          >
            Registrar Primera Deuda
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deudas.map((deuda) => {
            const porcentaje =
              deuda.monto_total > 0
                ? Math.min(100, (deuda.total_pagado / deuda.monto_total) * 100)
                : 100;
            const isPaid = deuda.estado === 'pagada' || deuda.saldo_pendiente <= 0;

            return (
              <div
                key={deuda.id}
                className="bg-white dark:bg-[#121B24] rounded-lg border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div>
                  {/* Top Bar with Status and Delete */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                        {deuda.nombre}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Acreedor: <strong className="text-slate-700 dark:text-slate-300">{deuda.acreedor}</strong>
                      </p>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/70">
                          <CheckCircle2 className="w-3 h-3" />
                          Pagada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/70">
                          <Clock className="w-3 h-3" />
                          Activa
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteDeuda(deuda.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
                        title="Eliminar deuda"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Monto Original:</span>
                      <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                        {formatCOP(deuda.monto_total)}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Pagado acumulado:</span>
                      <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                        {formatCOP(deuda.total_pagado)}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800 font-semibold">
                      <span className="text-slate-700 dark:text-slate-300">Saldo pendiente:</span>
                      <span className="font-mono text-[var(--accent-fg)]">
                        {formatCOP(deuda.saldo_pendiente)}
                      </span>
                    </div>
                  </div>

                  {/* Minimalist Progress Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Progreso de amortización</span>
                      <span className="font-mono font-medium">{porcentaje.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isPaid ? 'bg-emerald-500' : 'bg-[var(--accent)] dark:bg-[var(--accent-fg)]'
                        }`}
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                  </div>

                  {/* Dates and Interest info */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      <span>Inicio: {formatDateCO(deuda.fecha_inicio)}</span>
                    </div>
                    {deuda.fecha_limite && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        <span>Vence: {formatDateCO(deuda.fecha_limite)}</span>
                      </div>
                    )}
                    {deuda.tasa_interes && deuda.tasa_interes > 0 ? (
                      <div className="flex items-center gap-1">
                        <Percent className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        <span>{deuda.tasa_interes}% mensual</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Bottom Action Button */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleOpenPaymentsModal(deuda)}
                    className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-[var(--accent-soft)] text-[var(--accent-fg)] rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>Abonos e Historial</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Crear Nueva Deuda */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-[#121B24] rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#0E161E]">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] text-[var(--accent-fg)] flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Nueva Deuda u Obligación
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Registra el capital inicial y condiciones
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDeuda} className="p-6 space-y-4">
              {createError && (
                <div className="p-2.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70 text-rose-700 dark:text-rose-300 text-xs">
                  {createError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nombre o Concepto
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Crédito Vehículo, Préstamo Familiar..."
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent-fg)] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Acreedor o Entidad
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Bancolombia, Falabella, Juan Pérez..."
                  value={acreedor}
                  onChange={(e) => setAcreedor(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent-fg)] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Monto Total del Capital (COP)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1000"
                  placeholder="Ej. 5000000"
                  value={montoTotal}
                  onChange={(e) => setMontoTotal(parseFloat(e.target.value) || '')}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent-fg)] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    required
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent-fg)] text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Fecha Límite (Opcional)
                  </label>
                  <input
                    type="date"
                    value={fechaLimite}
                    onChange={(e) => setFechaLimite(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent-fg)] text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tasa de Interés Mensual % (Opcional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="Ej. 1.8"
                  value={tasaInteres}
                  onChange={(e) => setTasaInteres(parseFloat(e.target.value) || '')}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent-fg)] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 font-mono"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded text-xs font-medium transition-colors shadow-2xs disabled:opacity-50"
                >
                  {createSubmitting ? 'Guardando...' : 'Crear Deuda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Gestionar Abonos y Ver Historial */}
      {selectedDeudaForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#121B24] rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#0E161E]">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] text-[var(--accent-fg)] flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {selectedDeudaForPayment.nombre}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Abonos a favor de: <strong className="text-slate-700 dark:text-slate-300">{selectedDeudaForPayment.acreedor}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDeudaForPayment(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Balance Card */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-lg border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3 text-center">
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Total Pagado</span>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                    {formatCOP(selectedDeudaForPayment.total_pagado)}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Saldo Pendiente</span>
                  <div className="text-sm font-bold text-[var(--accent-fg)] font-mono mt-0.5">
                    {formatCOP(selectedDeudaForPayment.saldo_pendiente)}
                  </div>
                </div>
              </div>

              {/* Form Registrar Abono */}
              {selectedDeudaForPayment.saldo_pendiente > 0 ? (
                <form onSubmit={handleCreatePago} className="p-4 rounded-lg border border-[var(--accent-border)] bg-[var(--accent-tint)] space-y-3">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-[var(--accent-fg)]" />
                    Registrar nuevo abono / cuota
                  </h4>

                  {pagoError && (
                    <div className="p-2 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70 text-rose-700 dark:text-rose-300 text-xs">
                      {pagoError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Monto del abono (COP)
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        step="1000"
                        placeholder="Ej. 400000"
                        value={pagoMonto}
                        onChange={(e) => setPagoMonto(parseFloat(e.target.value) || '')}
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent-fg)] font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Fecha del abono
                      </label>
                      <input
                        type="date"
                        required
                        value={pagoFecha}
                        onChange={(e) => setPagoFecha(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent-fg)] text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Nota o número de recibo (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Cuota 3 de 12, abono prima, transferencia #8472"
                      value={pagoNota}
                      onChange={(e) => setPagoNota(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent-fg)] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={pagoSubmitting}
                      className="px-3.5 py-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded text-xs font-medium transition-colors shadow-2xs flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {pagoSubmitting ? 'Registrando...' : 'Aplicar Abono'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 text-emerald-800 dark:text-emerald-300 text-xs rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>¡Esta deuda ha sido pagada en su totalidad! Saldo pendiente: $0.</span>
                </div>
              )}

              {/* Historial de Pagos Realizados */}
              <div>
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  Historial de Abonos ({pagosList.length})
                </h4>

                {pagosLoading ? (
                  <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500">
                    Cargando pagos...
                  </div>
                ) : pagosList.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 rounded-lg">
                    Aún no has registrado abonos para esta deuda.
                  </div>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                    {pagosList.map((p) => (
                      <div key={p.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                              {formatCOP(p.monto)}
                            </span>
                            <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                              {formatDateCO(p.fecha_pago)}
                            </span>
                          </div>
                          {p.nota && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{p.nota}</p>
                          )}
                        </div>

                        <button
                          onClick={() => handleDeletePago(p.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
                          title="Anular abono"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50 dark:bg-[#0E161E] border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedDeudaForPayment(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded text-xs font-medium transition-colors"
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
