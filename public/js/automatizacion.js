/* Página de automatización: red de seguridad de la cabecera. */
(function () {
  "use strict";

  /* Red de seguridad de la cabecera.
     Sus elementos empiezan invisibles para poder aparecer. Si el
     navegador no ejecuta la animación —pestaña en segundo plano,
     ahorro de energía, una extensión que las bloquea—, se quedarían
     en blanco y la cabecera saldría vacía. Pasado el tiempo que dura
     la secuencia entera, se fuerza el estado final. Si la animación
     corrió, a estas alturas ya ha terminado y no se nota nada. */
  var cabecera = document.querySelector(".iahero");
  if (cabecera) {
    setTimeout(function () {
      cabecera.classList.add("entrada-hecha");
    }, 6000);
  }
})();
