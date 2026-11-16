import { createWorker } from 'tesseract.js';

export interface ExtractedItem {
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface OcrResult {
  proveedor?: string;
  fecha?: string;
  total?: number;
  items: ExtractedItem[];
  rawText: string;
}

export type OcrProgressCallback = (progress: number, status: string) => void;

/**
 * Procesa una imagen de factura 100% en el navegador utilizando Tesseract.js (español).
 * La imagen se procesa en memoria y se descarta de inmediato sin guardarla ni subirla a ningún servidor.
 */
export async function processInvoiceImage(
  imageSource: File | Blob | string,
  onProgress?: OcrProgressCallback
): Promise<OcrResult> {
  onProgress?.(10, 'Iniciando motor OCR local...');

  const worker = await createWorker('spa');

  try {
    onProgress?.(30, 'Analizando imagen en español...');

    // Escanear la imagen
    const { data } = await worker.recognize(imageSource);
    const rawText = data.text || '';

    onProgress?.(80, 'Extrayendo productos, fecha y totales...');

    const result = parseInvoiceText(rawText);

    onProgress?.(100, 'Escaneo finalizado con éxito');

    return {
      ...result,
      rawText,
    };
  } finally {
    // Terminar el worker y liberar memoria de inmediato
    await worker.terminate();
  }
}

/**
 * Extrae proveedor, fecha, ítems y total usando expresiones regulares y heurísticas de facturas colombianas.
 */
export function parseInvoiceText(text: string): {
  proveedor: string;
  fecha: string;
  total: number;
  items: ExtractedItem[];
} {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // 1. Detectar Proveedor
  let proveedor = '';
  const knownProviders = [
    'Éxito',
    'Exito',
    'Carulla',
    'D1',
    'Tiendas D1',
    'Ara',
    'Jerónimo Martins',
    'Oxxo',
    'Farmatodo',
    'Cruz Verde',
    'Drogas La Rebaja',
    'Jumbo',
    'Metro',
    'Alkosto',
    'Ktronix',
    'Homecenter',
    'Terpel',
    'Texaco',
    'Primax',
    'Cine Colombia',
    'Procinal',
    'Cinemark',
    'Crepes & Waffles',
    'El Corral',
    'Frisby',
    'Juan Valdez',
    'Tostao',
    'Starbucks',
  ];

  for (const kp of knownProviders) {
    const regex = new RegExp(`\\b${kp}\\b`, 'i');
    if (regex.test(text)) {
      proveedor = kp;
      break;
    }
  }

  // Si no coincide con marcas conocidas, tomar una de las primeras 3 líneas no vacías válidas
  if (!proveedor) {
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const line = lines[i];
      // Ignorar líneas cortas o que parezcan números / NIT / fechas
      if (
        line.length > 3 &&
        !line.toLowerCase().includes('nit') &&
        !line.toLowerCase().includes('rut') &&
        !line.toLowerCase().includes('factura') &&
        !/\d{4,}/.test(line)
      ) {
        proveedor = line.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s&.-]/g, '').trim();
        if (proveedor.length > 3) break;
      }
    }
  }

  if (!proveedor) {
    proveedor = 'Proveedor Comercial';
  }

  // 2. Detectar Fecha (formatos: DD/MM/AAAA, DD-MM-AAAA, AAAA-MM-DD, DD/MM/AA)
  let fecha = new Date().toISOString().split('T')[0];
  const dateRegex = /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/;
  const matchDate = text.match(dateRegex);

  if (matchDate) {
    let day = parseInt(matchDate[1], 10);
    let month = parseInt(matchDate[2], 10);
    let year = parseInt(matchDate[3], 10);

    if (year < 100) year += 2000;
    // Si el día y mes están invertidos (ej. mes > 12)
    if (month > 12 && day <= 12) {
      const temp = day;
      day = month;
      month = temp;
    }

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 2000 && year <= 2035) {
      fecha = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // 3. Extraer Ítems de productos
  const items: ExtractedItem[] = [];

  // Expresiones regulares para reconocer filas de ítems
  // Ejemplos comunes:
  // "LECHE DESLACTOSADA 2 x 5000 10000"
  // "ARROZ DIANA 1KG 4.800"
  // "2 CAFE JUAN VALDEZ 24000"
  // "POLLO PECHUGA $ 21.500"
  for (const line of lines) {
    const lower = line.toLowerCase();
    // Saltar encabezados y pies de página
    if (
      lower.includes('total') ||
      lower.includes('subtotal') ||
      lower.includes('iva') ||
      lower.includes('cambio') ||
      lower.includes('efectivo') ||
      lower.includes('tarjeta') ||
      lower.includes('resolucion') ||
      lower.includes('dian') ||
      lower.includes('cajero') ||
      lower.includes('propina') ||
      lower.includes('descuento')
    ) {
      continue;
    }

    // Patrón 1: Nombre + Cantidad + "x" o "*" + Precio
    const patternQtyMultiplier = /^(.*?)\s+(\d+)\s*[xX\*]\s*[\$]?\s*([\d\.,]+)/;
    const match1 = line.match(patternQtyMultiplier);
    if (match1) {
      const name = cleanProductName(match1[1]);
      const qty = parseFloat(match1[2]) || 1;
      const unitPrice = parseAmount(match1[3]);
      if (name.length > 2 && unitPrice > 0) {
        items.push({
          nombre: name,
          cantidad: qty,
          precio_unitario: unitPrice,
          subtotal: qty * unitPrice,
        });
        continue;
      }
    }

    // Patrón 2: Cantidad al inicio + Nombre + Precio al final
    const patternLeadingQty = /^(\d+)\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ\s\d\.\-]{3,})\s+[\$]?\s*([\d\.,]{3,})$/;
    const match2 = line.match(patternLeadingQty);
    if (match2) {
      const qty = parseFloat(match2[1]) || 1;
      const name = cleanProductName(match2[2]);
      const unitPrice = parseAmount(match2[3]);
      if (name.length > 2 && unitPrice > 0) {
        items.push({
          nombre: name,
          cantidad: qty,
          precio_unitario: unitPrice,
          subtotal: qty * unitPrice,
        });
        continue;
      }
    }

    // Patrón 3: Nombre + Precio al final
    const patternSimpleLine = /^([a-zA-ZáéíóúÁÉÍÓÚñÑ\s\.\-]{3,}?)\s+[\$]?\s*([\d]{1,3}(?:[\.,]\d{3})*(?:[\.,]\d{2})?|\d{3,})$/;
    const match3 = line.match(patternSimpleLine);
    if (match3) {
      const name = cleanProductName(match3[1]);
      const price = parseAmount(match3[2]);
      if (name.length >= 3 && price >= 500 && price <= 20000000) {
        items.push({
          nombre: name,
          cantidad: 1,
          precio_unitario: price,
          subtotal: price,
        });
        continue;
      }
    }
  }

  // 4. Detectar Total general
  let total = 0;
  const totalRegex = /(?:total|total a pagar|total pagar|valor total)[\s\:\$]*([\d\.,]+)/i;
  const matchTotal = text.match(totalRegex);
  if (matchTotal) {
    total = parseAmount(matchTotal[1]);
  }

  // Si no se detectó el total o la suma de ítems es mayor, calcular del acumulado
  const sumItems = items.reduce((acc, curr) => acc + curr.subtotal, 0);
  if (total === 0 || Math.abs(total - sumItems) > sumItems * 0.5) {
    total = sumItems;
  }

  // Si aún no hay ítems detectados pero hay texto con números, crear al menos un ítem sugerido
  if (items.length === 0 && total > 0) {
    items.push({
      nombre: 'Compra general ' + proveedor,
      cantidad: 1,
      precio_unitario: total,
      subtotal: total,
    });
  }

  return {
    proveedor,
    fecha,
    total,
    items,
  };
}

function cleanProductName(raw: string): string {
  return raw
    .replace(/^[\d\.\-\*#\s]+/, '')
    .replace(/[\$#\*]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseAmount(val: string): number {
  if (!val) return 0;
  // Quitar símbolos y espacios
  let clean = val.replace(/[\$\s]/g, '');

  // Si contiene puntos y comas (ej: 12.500,00 o 12,500.00)
  if (clean.includes('.') && clean.includes(',')) {
    if (clean.lastIndexOf(',') > clean.lastIndexOf('.')) {
      // 12.500,00 -> 12500.00
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
      // 12,500.00 -> 12500.00
      clean = clean.replace(/,/g, '');
    }
  } else if (clean.includes('.')) {
    // Si tiene un punto como separador de miles colombiano (ej: 45.000 o 1.250.000)
    const dotParts = clean.split('.');
    if (dotParts.length > 1 && dotParts[dotParts.length - 1].length === 3) {
      clean = clean.replace(/\./g, '');
    } else if (dotParts.length === 2 && dotParts[1].length <= 2) {
      // Decimal
      clean = clean;
    } else {
      clean = clean.replace(/\./g, '');
    }
  } else if (clean.includes(',')) {
    const commaParts = clean.split(',');
    if (commaParts.length > 1 && commaParts[commaParts.length - 1].length === 3) {
      clean = clean.replace(/,/g, '');
    } else {
      clean = clean.replace(',', '.');
    }
  }

  const num = parseFloat(clean);
  return isNaN(num) ? 0 : Math.round(num);
}
