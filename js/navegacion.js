/* ==========================================================================
   Frosthaven — navegación
   Autor: Toni Ferrà — https://toniferra.com

   Marca el enlace de la página en curso. Compartido por todas las páginas,
   con guarda por si alguna no tiene navegación.
   ========================================================================== */
(function () {
  "use strict";

  var enlaces = document.querySelectorAll("[data-nav]");
  if (!enlaces.length) return;

  var archivo = window.location.pathname.split("/").pop() || "index.html";

  enlaces.forEach(function (enlace) {
    var destino = enlace.getAttribute("href");
    var esActiva = destino === archivo || (archivo === "" && destino === "index.html");
    enlace.classList.toggle("is-activa", esActiva);
    if (esActiva) {
      enlace.setAttribute("aria-current", "page");
    } else {
      enlace.removeAttribute("aria-current");
    }
  });
})();
