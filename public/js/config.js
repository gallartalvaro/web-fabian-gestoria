// ============================================================
// Valentramites — Configuración común del sitio
// ------------------------------------------------------------
// PENDIENTE: rellenar con los datos reales del despacho.
// Todo lo que dependa de un dato de contacto se lee de aquí,
// así no hay que buscarlo repartido por varios archivos.
// ============================================================

window.SITE_CONFIG = {
  // Email del despacho.
  email: "hola@valentramites.com",

  // Teléfono para mostrar.
  telefono: "+34 615 78 08 36",

  // WhatsApp en formato internacional SIN signos ni espacios.
  // Ej.: "34600000000". Si se deja vacío, no se muestra el botón.
  whatsapp: "34615780836",

  // Dónde se registran los contactos del test de subvenciones.
  // Lo habitual aquí es el receptor que crea la oportunidad en el
  // CRM de Odoo: ver backend/README.md para desplegarlo.
  // Ej.: "https://gestoria-leads.xxxx.workers.dev"
  //
  // Vacío = los envíos caen al método alternativo (WhatsApp / correo
  // ya redactado + copiar al portapapeles), sin perder el contacto.
  formEndpoint: "https://valentramites-leads.gallart-alvaro.workers.dev",
};
