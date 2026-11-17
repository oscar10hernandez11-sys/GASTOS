import { AppChangelogEntry } from '../types/database';

export const CURRENT_APP_VERSION = 'v1.12';

export const APP_CHANGELOG_HISTORY: AppChangelogEntry[] = [
  {
    version: 'v1.12',
    fecha: '2026-11-16',
    cambios: [
      'Integración de flujo completo de confirmación por correo y reenvío: detección de enlaces de verificación caducados o ya usados en la URL con botón "Reenviar correo de confirmación" hacia el dominio activo (window.location.origin).',
      'Botón de reenvío disponible tanto tras el registro ("Revisa tu correo electrónico") como al intentar iniciar sesión con una cuenta pendiente de confirmación.',
      'Compatibilidad automática con proyectos de Supabase con confirmación activada o desactivada, conservando los mensajes de error en español ("Correo o contraseña incorrectos").'
    ]
  },
  {
    version: 'v1.11',
    fecha: '2026-11-16',
    cambios: [
      'Corrección de validación en montos de Deudas y Abonos: la combinación de min="1" y step="1000" hacía que el navegador solo aceptara montos terminados en 001 (como 5499001 o 5500001) y rechazara valores exactos como 5500000; se cambió a step="any" para admitir cualquier valor válido.',
      'Corrección preventiva en el precio unitario de ítems de Facturas (step="any" en lugar de step="100") para permitir precios exactos no múltiplos de 100.'
    ]
  },
  {
    version: 'v1.10',
    fecha: '2026-11-16',
    cambios: [
      'Corrección de reinicio al cambiar de pestaña: Supabase emitía el evento SIGNED_IN al recuperar el foco de la ventana y la aplicación activaba la pantalla de carga desmontando las vistas; ahora la sesión se valida en segundo plano sin recargar ni perder el estado ni la pestaña activa.',
      'Persistencia de la sección activa (Dashboard, Facturas, Productos, Deudas, Categorías o Integración) durante la sesión para evitar volver al inicio si el navegador suspende la pestaña.',
      'Ajuste en el registro de cuentas para ingreso directo sin exigir confirmación por correo desde la interfaz y mensajes claros en español si el proyecto de Supabase aún tiene activa la verificación por correo o el límite de envío.'
    ]
  },
  {
    version: 'v1.9',
    fecha: '2026-11-16',
    cambios: [
      'Nuevo Modo Oscuro completo integrado armónicamente con los 5 temas globales (Petróleo Clásico, Bosque & Salvia, Índigo Editorial, Terracota & Arena y Grafito Ejecutivo) y cualquier color personalizado.',
      'Selector de apariencia Claro / Oscuro dentro del panel de Tema y botón de cambio rápido (Sol / Luna) en el encabezado y pantalla de acceso con persistencia automática.',
      'Adaptación de contraste en tarjetas, tablas, formularios, modales y gráficas del Dashboard (rejillas, ejes, tooltips y tokens luminosos --accent-fg) para máxima legibilidad en fondo oscuro.'
    ]
  },
  {
    version: 'v1.8',
    fecha: '2026-11-16',
    cambios: [
      'Sistema de temas globales (Petróleo Clásico, Bosque & Salvia, Índigo Editorial, Terracota & Arena, Grafito Ejecutivo o color libre) que aplica simultáneamente a toda la interfaz (navegación, botones, fondos y tarjetas) y a las gráficas del Dashboard.',
      'Corrección de legibilidad en el gráfico de pastel: nombres completos de categorías sin cortes abruptos ("Alimentació..."), total exacto centrado y barras proporcionales por categoría.',
      'Mejora de la comparativa mensual y evolución a 12 meses: etiquetas de una sola línea sin saltos cortados, valores directos sobre las barras, resumen tabular con variación % e indicadores de promedio mensual y mes pico.'
    ]
  },
  {
    version: 'v1.7',
    fecha: '2026-11-16',
    cambios: [
      'Selector interactivo de colores en el Dashboard para personalizar cada categoría del gráfico de pastel o aplicar paletas armónicas con un clic (guardado automático en Supabase).',
      'Rediseño del gráfico de distribución con dona centrada y leyenda lateral detallada (monto en COP y %) para evitar cualquier superposición de etiquetas.',
      'Gráfico comparativo mensual convertido a barras horizontales con leyenda superior fija y mejora de márgenes y espaciado de ejes en la evolución a 12 meses.'
    ]
  },
  {
    version: 'v1.6',
    fecha: '2026-11-16',
    cambios: [
      'Corrección en confirmación de registro: los correos de verificación redirigían por defecto a localhost:3000 generando ERR_CONNECTION_REFUSED; ahora signUp envía dinámicamente window.location.origin en emailRedirectTo para apuntar al dominio activo (AI Studio o Netlify).'
    ]
  },
  {
    version: 'v1.5',
    fecha: '2026-11-16',
    cambios: [
      'Se restringió el acceso a la sección de Integración, Script SQL y Estado del Backend exclusivamente para usuarios con rol Administrador.',
      'Se ocultaron las herramientas técnicas y referencias internas en la pantalla de inicio de sesión, encabezado y pie de página para usuarios finales y Modo Demo.',
      'Validación de rol administrador basada en metadatos de sesión de Supabase o variable de entorno VITE_ADMIN_EMAIL sin credenciales hardcodeadas.'
    ]
  },
  {
    version: 'v1.4',
    fecha: '2026-11-16',
    cambios: [
      'Nueva vista dedicada de Integración Supabase & Netlify accesible desde el menú lateral con diagnóstico en vivo de tablas y políticas RLS.',
      'Botón "Probar Conexión" en el modal de Integración (disponible también antes de iniciar sesión) para verificar tablas y vista_deudas_saldo.',
      'Botones de Integración y Script SQL visibles en todas las resoluciones de pantalla desde el encabezado inicial.'
    ]
  },
  {
    version: 'v1.3',
    fecha: '2026-11-16',
    cambios: [
      'Auditoría AppSec completa: eliminación de cualquier referencia o respaldo de URLs y credenciales en el código fuente y modales.',
      'Validación estricta de sesión con supabase.auth.getUser() y limpieza total del estado en memoria de React y almacenamiento al cerrar sesión.',
      'Actualización de .env.example con placeholders genéricos y .gitignore con exclusión explícita de todos los archivos de entorno.',
      'Modo Demo aislado exclusivamente en memoria y pantalla informativa de configuración pendiente cuando faltan variables de entorno.'
    ]
  },
  {
    version: 'v1.2',
    fecha: '2026-11-16',
    cambios: [
      'Conexión activa configurada con el backend de Supabase mediante variables de entorno Vite.',
      'Verificación de tablas (categorias, productos, facturas, items_factura, deudas, pagos_deuda) y vista vista_deudas_saldo.'
    ]
  },
  {
    version: 'v1.1',
    fecha: '2026-11-16',
    cambios: [
      'Normalización automática de la URL de Supabase para aceptar rutas con sufijos REST sin romper las consultas del SDK.',
      'Soporte explícito para llaves publicables de Supabase y prevención de uso accidental de llaves privadas de servidor en el navegador.'
    ]
  },
  {
    version: 'v1.0',
    fecha: '2026-11-10',
    cambios: [
      'Lanzamiento inicial de la plataforma multiusuario de finanzas personales Kakebo.',
      'Soporte completo de autenticación y aislamiento multiusuario con Supabase RLS y Modo Demo interactivo.',
      'Escáner OCR local en el navegador con Tesseract.js (español) para facturas, con descarte inmediato de la imagen sin subirla al servidor.',
      'Tres métodos de captura de facturas: formulario manual con autocompletado, escáner OCR y carga/pegado de CSV/TXT.',
      'Dashboard analítico con KPIs, gráfica de dona por categorías, evolución a 12 meses y comparativa mes actual vs. anterior.',
      'Módulo de catálogo de productos con comparador de precios históricos y variaciones porcentuales (↑/↓).',
      'Gestión de deudas y abonos con vista de saldo pendiente en tiempo real y barra de progreso minimalista.',
      'Esquema SQL de Supabase documentado y exportable con trigger de categorías por defecto y netlify.toml listo para despliegue.'
    ]
  }
];
