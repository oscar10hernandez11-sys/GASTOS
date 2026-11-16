export interface ParsedCsvItem {
  nombre: string;
  categoriaNombre?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  isValid: boolean;
  error?: string;
}

/**
 * Parsea un archivo o texto plano CSV / TXT con el formato:
 * producto,categoria,cantidad,precio_unitario
 */
export function parseItemsCsv(csvText: string): {
  items: ParsedCsvItem[];
  validCount: number;
  totalSum: number;
} {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const items: ParsedCsvItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Si la primera línea es un encabezado común, omitirla
    if (i === 0 && (line.toLowerCase().includes('producto') || line.toLowerCase().includes('precio'))) {
      continue;
    }

    // Dividir por coma o punto y coma
    const delimiter = line.includes(';') ? ';' : ',';
    const cols = line.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));

    if (cols.length < 2) {
      continue;
    }

    let nombre = '';
    let categoriaNombre = '';
    let cantidad = 1;
    let precio_unitario = 0;

    if (cols.length >= 4) {
      nombre = cols[0];
      categoriaNombre = cols[1];
      cantidad = parseFloat(cols[2].replace(',', '.')) || 1;
      precio_unitario = parseFloat(cols[3].replace(/[^\d.]/g, '')) || 0;
    } else if (cols.length === 3) {
      // Formato: producto, cantidad, precio
      nombre = cols[0];
      cantidad = parseFloat(cols[1].replace(',', '.')) || 1;
      precio_unitario = parseFloat(cols[2].replace(/[^\d.]/g, '')) || 0;
    } else if (cols.length === 2) {
      // Formato: producto, precio
      nombre = cols[0];
      cantidad = 1;
      precio_unitario = parseFloat(cols[1].replace(/[^\d.]/g, '')) || 0;
    }

    const isValid = nombre.length > 0 && precio_unitario > 0 && cantidad > 0;
    const subtotal = cantidad * precio_unitario;

    items.push({
      nombre,
      categoriaNombre: categoriaNombre || undefined,
      cantidad,
      precio_unitario,
      subtotal,
      isValid,
      error: !isValid ? 'Nombre o precio no válido' : undefined,
    });
  }

  const validCount = items.filter((it) => it.isValid).length;
  const totalSum = items
    .filter((it) => it.isValid)
    .reduce((acc, curr) => acc + curr.subtotal, 0);

  return {
    items,
    validCount,
    totalSum,
  };
}
