// ============================================================
// Gestoría Fabián — Configuración común del sitio
// ------------------------------------------------------------
// PENDIENTE: rellenar con los datos reales del despacho.
// Todo lo que dependa de un dato de contacto se lee de aquí,
// así no hay que buscarlo repartido por varios archivos.
// ============================================================

window.SITE_CONFIG = {
  // Email del despacho. Ej.: "info@gestoriafabian.es"
  email: "",

  // Teléfono para mostrar. Ej.: "+34 960 00 00 00"
  telefono: "",

  // WhatsApp en formato internacional SIN signos ni espacios.
  // Ej.: "34600000000". Si se deja vacío, no se muestra el botón.
  whatsapp: "",

  // Endpoint del formulario (Formspree, Netlify Forms, Make, n8n…).
  // Ej.: "https://formspree.io/f/xxxxxxx"
  // Vacío = los envíos caen al método alternativo (WhatsApp / correo
  // ya redactado + copiar al portapapeles), sin perder el contacto.
  formEndpoint: "",
};
