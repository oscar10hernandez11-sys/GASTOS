import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Receipt,
  Camera,
  FileText,
  Upload,
  Search,
  Trash2,
  Calendar,
  DollarSign,
  AlertCircle,
  Eye,
  X,
  FileSpreadsheet,
  CheckCircle2,
  ScanLine,
} from 'lucide-react';
import {
  getFacturas,
  getCategorias,
  getProductos,
  createFacturaWithItems,
  updateFacturaCategoria,
  updateProductoCategoria,
  assignCategoryToFacturaAndItems,
  deleteFactura,
} from '../../services/dataService';
import { Factura, Categoria, Producto } from '../../types/database';
import { formatCOP, formatDateCO } from '../../lib/formatters';
import { processInvoiceImage } from '../../lib/ocrService';
import { parseItemsCsv } from '../../lib/csvParser';

interface FormItem {
  productoNombre: string;
  categoriaId: string;
  cantidad: number;
  precio_unitario: number;
}

export const FacturasView: React.FC = () => {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');

  // Modal de nueva factura
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [registerMode, setRegisterMode] = useState<'manual' | 'ocr' | 'csv'>('manual');

  // Estado del formulario
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [proveedor, setProveedor] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [nota, setNota] = useState('');
  const [items, setItems] = useState<FormItem[]>([
    { productoNombre: '', categoriaId: '', cantidad: 1, precio_unitario: 0 },
  ]);

  // Estado del escáner OCR
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState('');
  const [ocrNotice, setOcrNotice] = useState<string | null>(null);

  // Estado de importación CSV/TXT
  const [csvText, setCsvText] = useState('');
  const [csvNotice, setCsvNotice] = useState<string | null>(null);

  // Modal para ver detalle de factura
  const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null);
  const [updatingCatFacturaId, setUpdatingCatFacturaId] = useState<string | null>(null);
  const [updatingItemProdId, setUpdatingItemProdId] = useState<string | null>(null);
  const [categorySavedMsg, setCategorySavedMsg] = useState<string | null>(null);

  // Envío del formulario
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [facs, cats, prods] = await Promise.all([
        getFacturas(),
        getCategorias(),
        getProductos(),
      ]);
      setFacturas(facs);
      setCategorias(cats);
      setProductos(prods);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setFecha(new Date().toISOString().split('T')[0]);
    setProveedor('');
    setCategoriaId('');
    setNota('');
    setItems([{ productoNombre: '', categoriaId: '', cantidad: 1, precio_unitario: 0 }]);
    setOcrProgress(0);
    setOcrStatus('');
    setOcrNotice(null);
    setCsvText('');
    setCsvNotice(null);
    setFormError(null);
    setRegisterMode('manual');
  };

  // Manejador de filas de ítems
  const handleItemChange = (index: number, field: keyof FormItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    // Si el usuario cambia el nombre del producto y coincide con uno existente, autocompletar su categoría
    if (field === 'productoNombre' && typeof value === 'string') {
      const existing = productos.find(
        (p) => p.nombre.toLowerCase() === value.trim().toLowerCase()
      );
      if (existing && existing.categoria_id) {
        updated[index].categoriaId = existing.categoria_id;
      }
    }

    setItems(updated);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      { productoNombre: '', categoriaId: categoriaId || '', cantidad: 1, precio_unitario: 0 },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum, it) => sum + (it.cantidad * it.precio_unitario || 0), 0);
  };

  // Procesar archivo con OCR
  const handleProcessOcr = async (file: File) => {
    if (!file) return;
    setOcrLoading(true);
    setOcrProgress(0);
    setOcrStatus('Preparando imagen...');
    setOcrNotice(null);
    setFormError(null);

    try {
      const result = await processInvoiceImage(file, (progress, status) => {
        setOcrProgress(progress);
        setOcrStatus(status);
      });

      if (result.proveedor) {
        setProveedor(result.proveedor);
      }
      if (result.fecha) {
        setFecha(result.fecha);
      }

      if (result.items && result.items.length > 0) {
        const mappedItems: FormItem[] = result.items.map((it) => {
          // Buscar categoría coincidente por nombre de producto
          const existing = productos.find(
            (p) => p.nombre.toLowerCase() === it.nombre.toLowerCase()
          );
          return {
            productoNombre: it.nombre,
            categoriaId: existing?.categoria_id || '',
            cantidad: it.cantidad,
            precio_unitario: it.precio_unitario,
          };
        });
        setItems(mappedItems);
        setOcrNotice(
          `¡Escaneo exitoso! Se detectaron ${mappedItems.length} producto(s). La imagen fue descartada inmediatamente de la memoria para proteger tu privacidad.`
        );
      } else {
        setOcrNotice(
          'El OCR procesó el texto, pero no identificó patrones exactos de ítems. Puedes completar los valores manualmente en la tabla inferior.'
        );
      }
    } catch (err: any) {
      console.error('Error OCR:', err);
      setFormError('Hubo un inconveniente al procesar la imagen con OCR local.');
    } finally {
      setOcrLoading(false);
    }
  };

  // Procesar CSV / TXT
  const handleApplyCsv = () => {
    if (!csvText.trim()) return;
    const { items: parsed, validCount, totalSum } = parseItemsCsv(csvText);

    if (validCount === 0) {
      setFormError('No se encontraron líneas válidas con el formato producto,categoria,cantidad,precio_unitario');
      return;
    }

    const newFormItems: FormItem[] = parsed
      .filter((p) => p.isValid)
      .map((p) => {
        // Enlazar categoría si el nombre coincide
        let matchedCatId = '';
        if (p.categoriaNombre) {
          const cat = categorias.find(
            (c) => c.nombre.toLowerCase() === p.categoriaNombre?.toLowerCase()
          );
          if (cat) matchedCatId = cat.id;
        }
        return {
          productoNombre: p.nombre,
          categoriaId: matchedCatId,
          cantidad: p.cantidad,
          precio_unitario: p.precio_unitario,
        };
      });

    setItems(newFormItems);
    setCsvNotice(`Se importaron ${validCount} producto(s) por un valor de ${formatCOP(totalSum)}.`);
    setFormError(null);
  };

  // Guardar factura
  const handleSubmitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!proveedor.trim()) {
      setFormError('Por favor ingresa el nombre del proveedor o comercio.');
      return;
    }

    const validItems = items.filter(
      (it) => it.productoNombre.trim().length > 0 && it.precio_unitario > 0
    );

    if (validItems.length === 0) {
      setFormError('Debes agregar al menos un producto con nombre y precio unitario.');
      return;
    }

    setSubmitting(true);
    try {
      await createFacturaWithItems({
        fecha,
        proveedor: proveedor.trim(),
        categoria_id: categoriaId || null,
        nota: nota.trim() || null,
        items: validItems.map((it) => ({
          productoNombre: it.productoNombre.trim(),
          categoriaId: it.categoriaId || null,
          cantidad: Number(it.cantidad) || 1,
          precio_unitario: Number(it.precio_unitario) || 0,
        })),
      });

      setIsModalOpen(false);
      resetForm();
      await loadData();
    } catch (err: any) {
      console.error(err);
      setFormError(err?.message || 'Error al guardar la factura.');
    } finally {
      setSubmitting(false);
    }
  };

  // Eliminar factura
  const handleDeleteFactura = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta factura y sus ítems asociados?')) {
      try {
        await deleteFactura(id);
        await loadData();
      } catch (err) {
        console.error('Error eliminando factura:', err);
      }
    }
  };

  // Asignar / actualizar categoría de una factura ya subida
  const handleChangeFacturaCategoria = async (
    facturaId: string,
    newCategoriaId: string,
    applyAllItems: boolean = false
  ) => {
    const catIdOrNull = newCategoriaId || null;
    setUpdatingCatFacturaId(facturaId);
    setCategorySavedMsg(null);
    try {
      if (applyAllItems) {
        await assignCategoryToFacturaAndItems(facturaId, catIdOrNull);
      } else {
        await updateFacturaCategoria(facturaId, catIdOrNull, true);
      }
      const updatedFacs = await getFacturas();
      setFacturas(updatedFacs);
      if (selectedFactura && selectedFactura.id === facturaId) {
        const refreshed = updatedFacs.find((f) => f.id === facturaId) || null;
        setSelectedFactura(refreshed);
        setCategorySavedMsg(
          applyAllItems
            ? 'Categoría aplicada a la factura y a todos sus ítems.'
            : 'Categoría de la factura actualizada.'
        );
        setTimeout(() => setCategorySavedMsg(null), 2500);
      }
    } catch (err) {
      console.error('Error actualizando categoría de factura:', err);
    } finally {
      setUpdatingCatFacturaId(null);
    }
  };

  // Asignar / actualizar categoría de un producto/ítem desde el detalle de factura
  const handleChangeItemProductoCategoria = async (
    facturaId: string,
    productoId: string,
    newCategoriaId: string
  ) => {
    const catIdOrNull = newCategoriaId || null;
    setUpdatingItemProdId(productoId);
    setCategorySavedMsg(null);
    try {
      await updateProductoCategoria(productoId, catIdOrNull);
      const updatedFacs = await getFacturas();
      setFacturas(updatedFacs);
      const refreshed = updatedFacs.find((f) => f.id === facturaId) || null;
      setSelectedFactura(refreshed);
      setCategorySavedMsg('Categoría del producto actualizada.');
      setTimeout(() => setCategorySavedMsg(null), 2500);
    } catch (err) {
      console.error('Error actualizando categoría del producto:', err);
    } finally {
      setUpdatingItemProdId(null);
    }
  };

  // Filtrado de lista
  const filteredFacturas = facturas.filter((f) => {
    const matchesSearch =
      f.proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.nota && f.nota.toLowerCase().includes(searchTerm.toLowerCase())) ||
      f.items?.some((it) => it.producto?.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCat = !filterCategoria || f.categoria_id === filterCategoria;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Actions & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por proveedor, producto o nota..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-white dark:bg-[#121B24] border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent-fg)] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          <select
            value={filterCategoria}
            onChange={(e) => setFilterCategoria(e.target.value)}
            className="text-xs bg-white dark:bg-[#121B24] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--accent-fg)]"
          >
            <option value="">Todas las categorías</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-md text-xs font-medium transition-colors shadow-2xs flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Factura</span>
        </button>
      </div>

      {/* Facturas Table Card */}
      <div className="bg-white dark:bg-[#121B24] rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
            Cargando facturas...
          </div>
        ) : filteredFacturas.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-3">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              No hay facturas registradas
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Empieza registrando una factura manualmente, escaneando una foto con OCR local o importando un CSV.
            </p>
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="mt-4 px-3.5 py-1.5 bg-[var(--accent)] text-white rounded-md text-xs font-medium hover:bg-[var(--accent-hover)] transition-colors"
            >
              Nueva Factura
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Proveedor</th>
                  <th className="py-3 px-4">Categoría Principal</th>
                  <th className="py-3 px-4">Ítems</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredFacturas.map((fac) => (
                  <tr key={fac.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {formatDateCO(fac.fecha)}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                      <div>{fac.proveedor}</div>
                      {fac.nota && (
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-xs">
                          {fac.nota}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            backgroundColor: fac.categoria?.color || '#94A3B8',
                          }}
                        />
                        <select
                          aria-label={`Categoría de factura ${fac.proveedor}`}
                          value={fac.categoria_id || ''}
                          disabled={updatingCatFacturaId === fac.id}
                          onChange={(e) => handleChangeFacturaCategoria(fac.id, e.target.value, false)}
                          className="text-[11px] font-medium px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[var(--accent-fg)] cursor-pointer disabled:opacity-50 max-w-[190px]"
                          title="Asignar o cambiar la categoría de esta factura"
                        >
                          <option value="">Sin categoría (Varios)</option>
                          {categorias.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-mono text-[11px]">
                        {fac.items?.length || 0} prod.
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-900 dark:text-slate-100">
                      {formatCOP(fac.total)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => {
                            setCategorySavedMsg(null);
                            setSelectedFactura(fac);
                          }}
                          className="p-1.5 text-slate-400 hover:text-[var(--accent-fg)] hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                          title="Ver detalle de factura"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFactura(fac.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                          title="Eliminar factura"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Nueva Factura con 3 métodos */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-3xl bg-white dark:bg-[#121B24] rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#0E161E]">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] text-[var(--accent-fg)] flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Registrar Factura de Gastos
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ninguna imagen se sube ni se guarda en el servidor
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

            {/* Selector de modo de registro */}
            <div className="p-4 bg-slate-100/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setRegisterMode('manual')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  registerMode === 'manual'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-[var(--accent-fg)]" />
                <span>1. Formulario Manual</span>
              </button>
              <button
                type="button"
                onClick={() => setRegisterMode('ocr')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  registerMode === 'ocr'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Camera className="w-3.5 h-3.5 text-[var(--accent-fg)]" />
                <span>2. Escáner OCR Local (Gratis)</span>
              </button>
              <button
                type="button"
                onClick={() => setRegisterMode('csv')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  registerMode === 'csv'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[var(--accent-fg)]" />
                <span>3. Importar CSV / TXT</span>
              </button>
            </div>

            {/* Form scrollable container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {formError && (
                <div className="p-3 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Panel específico según modo */}
              {registerMode === 'ocr' && (
                <div className="p-4 rounded-lg border border-dashed border-[var(--accent-border)] bg-[var(--accent-tint)] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <ScanLine className="w-4 h-4 text-[var(--accent-fg)]" />
                        Escaneo OCR en el navegador (Tesseract.js en español)
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Procesa la imagen 100% en memoria en tu dispositivo y la desecha de inmediato. No se almacena ninguna foto.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleProcessOcr(file);
                      }}
                    />
                    <input
                      type="file"
                      ref={cameraInputRef}
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleProcessOcr(file);
                      }}
                    />

                    <button
                      type="button"
                      disabled={ocrLoading}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-[var(--accent-fg)] text-slate-700 dark:text-slate-200 text-xs font-medium rounded-md flex items-center gap-1.5 shadow-2xs transition-colors disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span>Elegir foto del recibo</span>
                    </button>

                    <button
                      type="button"
                      disabled={ocrLoading}
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-[var(--accent-fg)] text-slate-700 dark:text-slate-200 text-xs font-medium rounded-md flex items-center gap-1.5 shadow-2xs transition-colors disabled:opacity-50"
                    >
                      <Camera className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span>Abrir cámara</span>
                    </button>
                  </div>

                  {ocrLoading && (
                    <div className="pt-2 space-y-1.5">
                      <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300">
                        <span>{ocrStatus}</span>
                        <span className="font-mono">{ocrProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[var(--accent)] h-full transition-all duration-200"
                          style={{ width: `${ocrProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {ocrNotice && (
                    <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{ocrNotice}</span>
                    </div>
                  )}
                </div>
              )}

              {registerMode === 'csv' && (
                <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-3">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-[var(--accent-fg)]" />
                      Importación directa de productos
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Pega texto con formato: <code className="text-slate-800 dark:text-slate-200 font-mono">producto,categoria,cantidad,precio_unitario</code>
                    </p>
                  </div>

                  <textarea
                    rows={4}
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    placeholder={`Leche Alquería 1.1L,Alimentación y Supermercado,4,5200\nArroz Diana 1kg,Alimentación y Supermercado,2,4900\nGasolina Corriente,Transporte,5,16200`}
                    className="w-full text-xs font-mono p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent-fg)] text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                  />

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleApplyCsv}
                      className="px-3 py-1.5 bg-[var(--accent)] text-white rounded text-xs font-medium hover:bg-[var(--accent-hover)] transition-colors shadow-2xs"
                    >
                      Poblar tabla de ítems
                    </button>
                    {csvNotice && (
                      <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                        {csvNotice}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Datos generales de la factura */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Fecha de compra
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent-fg)] text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Proveedor o Comercio
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Éxito, Tiendas D1, Terpel..."
                    value={proveedor}
                    onChange={(e) => setProveedor(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent-fg)] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Categoría General (Opcional)
                  </label>
                  <select
                    value={categoriaId}
                    onChange={(e) => setCategoriaId(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent-fg)] text-slate-900 dark:text-slate-100"
                  >
                    <option value="">Detectar por ítems / Varias</option>
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nota / Observaciones (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Mercado quincenal, compra con descuento, etc."
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent-fg)] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>

              {/* Tabla de Ítems */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Detalle de Productos / Ítems
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Autocompleta productos existentes del usuario y calcula subtotales
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="px-2.5 py-1 text-xs text-[var(--accent-fg)] hover:bg-[var(--accent-soft)] rounded font-medium transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Ítem</span>
                  </button>
                </div>

                {/* Datalist para autocompletar productos */}
                <datalist id="user-products-list">
                  {productos.map((prod) => (
                    <option key={prod.id} value={prod.nombre} />
                  ))}
                </datalist>

                <div className="border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                      <tr>
                        <th className="py-2 px-3">Producto</th>
                        <th className="py-2 px-3">Categoría</th>
                        <th className="py-2 px-3 w-20">Cant.</th>
                        <th className="py-2 px-3 w-32">Precio Unit. (COP)</th>
                        <th className="py-2 px-3 w-28 text-right">Subtotal</th>
                        <th className="py-2 px-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              list="user-products-list"
                              required
                              placeholder="Nombre del producto"
                              value={it.productoNombre}
                              onChange={(e) => handleItemChange(idx, 'productoNombre', e.target.value)}
                              className="w-full text-xs px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-[var(--accent-fg)] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={it.categoriaId}
                              onChange={(e) => handleItemChange(idx, 'categoriaId', e.target.value)}
                              className="w-full text-xs px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-[var(--accent-fg)] text-slate-900 dark:text-slate-100"
                            >
                              <option value="">Por defecto</option>
                              {categorias.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.nombre}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0.1"
                              step="any"
                              value={it.cantidad}
                              onChange={(e) => handleItemChange(idx, 'cantidad', parseFloat(e.target.value) || 0)}
                              className="w-full text-xs px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-[var(--accent-fg)] text-slate-900 dark:text-slate-100 font-mono text-center"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={it.precio_unitario || ''}
                              onChange={(e) => handleItemChange(idx, 'precio_unitario', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              className="w-full text-xs px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-[var(--accent-fg)] text-slate-900 dark:text-slate-100 font-mono text-right"
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-medium text-slate-800 dark:text-slate-200">
                            {formatCOP(it.cantidad * it.precio_unitario)}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeItemRow(idx)}
                              disabled={items.length <= 1}
                              className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-30 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Total Summary */}
                <div className="flex justify-end pt-2">
                  <div className="bg-slate-50 dark:bg-slate-900/70 px-4 py-2.5 rounded-md border border-slate-200 dark:border-slate-800 text-right">
                    <span className="text-xs text-slate-500 dark:text-slate-400 mr-3">Total Calculado:</span>
                    <span className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {formatCOP(calculateTotal())}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-[#0E161E] border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Total ítems: <strong className="text-slate-800 dark:text-slate-200">{items.length}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSubmitInvoice}
                  className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded text-xs font-medium transition-colors shadow-2xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Guardar Factura</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Ver Detalle de Factura */}
      {selectedFactura && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#121B24] rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#0E161E]">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] text-[var(--accent-fg)] flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {selectedFactura.proveedor}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDateCO(selectedFactura.fecha)}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFactura(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Asignar categoría principal después de subir la factura */}
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Categoría Principal de la Factura
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Asigna o cambia la categoría en cualquier momento
                    </p>
                  </div>
                  {selectedFactura.categoria_id && (
                    <button
                      type="button"
                      disabled={updatingCatFacturaId === selectedFactura.id}
                      onClick={() =>
                        handleChangeFacturaCategoria(
                          selectedFactura.id,
                          selectedFactura.categoria_id || '',
                          true
                        )
                      }
                      className="text-[11px] px-2.5 py-1 rounded bg-[var(--accent-soft)] text-[var(--accent-fg)] hover:opacity-90 font-medium transition-opacity disabled:opacity-50 self-start sm:self-auto"
                    >
                      Aplicar a todos los ítems
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: selectedFactura.categoria?.color || '#94A3B8',
                    }}
                  />
                  <select
                    value={selectedFactura.categoria_id || ''}
                    disabled={updatingCatFacturaId === selectedFactura.id}
                    onChange={(e) =>
                      handleChangeFacturaCategoria(selectedFactura.id, e.target.value, false)
                    }
                    className="flex-1 text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent-fg)] text-slate-900 dark:text-slate-100 disabled:opacity-50"
                  >
                    <option value="">Sin categoría (Varios)</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {categorySavedMsg && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{categorySavedMsg}</span>
                  </p>
                )}
              </div>

              {selectedFactura.nota && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-md text-xs text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                  <span className="font-medium text-slate-700 dark:text-slate-200">Nota:</span> {selectedFactura.nota}
                </div>
              )}

              <div>
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Ítems Comprados
                </h4>
                <div className="border border-slate-200 dark:border-slate-800 rounded-md divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedFactura.items?.map((it) => (
                    <div key={it.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                          {it.producto?.nombre || 'Producto'}
                        </p>
                        <p className="text-slate-400 dark:text-slate-500 text-[11px]">
                          {it.cantidad} {it.producto?.unidad_medida || 'unid.'} × {formatCOP(it.precio_unitario)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                        {it.producto?.id && (
                          <select
                            aria-label={`Categoría de ${it.producto.nombre}`}
                            value={it.producto.categoria_id || ''}
                            disabled={updatingItemProdId === it.producto.id}
                            onChange={(e) =>
                              handleChangeItemProductoCategoria(
                                selectedFactura.id,
                                it.producto!.id,
                                e.target.value
                              )
                            }
                            className="text-[11px] px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[var(--accent-fg)] max-w-[155px] disabled:opacity-50"
                          >
                            <option value="">Sin categoría</option>
                            {categorias.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.nombre}
                              </option>
                            ))}
                          </select>
                        )}
                        <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                          {formatCOP(it.subtotal || it.cantidad * it.precio_unitario)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center text-sm font-semibold border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Total Factura:</span>
                <span className="text-lg text-slate-900 dark:text-slate-100 font-mono">
                  {formatCOP(selectedFactura.total)}
                </span>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 dark:bg-[#0E161E] border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedFactura(null)}
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
