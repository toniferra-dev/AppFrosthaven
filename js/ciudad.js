/* ==========================================================================
   Frosthaven — ciudad
   Autor: Toni Ferrà — https://toniferra.com

   Reserva de Frosthaven (oro, materiales y plantas) y edificios con su nivel
   y estado. Todo editable, guardando al cambiar cada campo.
   ========================================================================== */
(function () {
  "use strict";

  var contenedorReserva = document.querySelector("[data-ciudad='reserva']");
  var contenedorPlantas = document.querySelector("[data-ciudad='plantas']");
  var tablaEdificios = document.querySelector("[data-ciudad='edificios']");
  var estadoGuardado = document.querySelector("[data-estado='guardado']");
  var aviso = document.querySelector("[data-estado='error']");
  var avisoTexto = document.querySelector("[data-estado='error-texto']");

  // Guarda: este script solo actúa en la página de ciudad.
  if (!contenedorReserva) return;

  var campana = null;
  var edificios = [];
  var catalogoReglas = null;

  var ESTADOS_EDIFICIO = [
    { valor: "normal", texto: "Normal" },
    { valor: "danado", texto: "Dañado" },
    { valor: "arrasado", texto: "Arrasado" }
  ];

  function crear(etiqueta, clase, texto) {
    var nodo = document.createElement(etiqueta);
    if (clase) nodo.className = clase;
    if (texto !== undefined) nodo.textContent = texto;
    return nodo;
  }

  function mostrarError(mensaje) {
    avisoTexto.textContent = mensaje;
    aviso.hidden = false;
  }

  var temporizador = null;
  function anunciarGuardado() {
    estadoGuardado.textContent = "Guardado";
    clearTimeout(temporizador);
    temporizador = setTimeout(function () {
      estadoGuardado.textContent = "";
    }, 2000);
  }

  function fallo(error) {
    mostrarError("No se ha podido guardar: " + error.message);
  }

  function campoNumero(etiqueta, valor, alCambiar) {
    var envoltorio = crear("div", "campo");
    var id = "campo-" + etiqueta.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    var control = document.createElement("input");

    control.type = "number";
    control.min = 0;
    control.className = "campo__control campo__control--numero";
    control.id = id;
    control.value = valor || 0;
    control.addEventListener("change", function () {
      alCambiar(Number(control.value) || 0);
    });

    var etiquetaNodo = crear("label", "campo__etiqueta", etiqueta);
    etiquetaNodo.setAttribute("for", id);
    envoltorio.appendChild(etiquetaNodo);
    envoltorio.appendChild(control);
    return envoltorio;
  }

  function pintarReserva() {
    contenedorReserva.replaceChildren();

    [
      { clave: "oro", etiqueta: "Oro" },
      { clave: "madera", etiqueta: "Madera" },
      { clave: "metal", etiqueta: "Metal" },
      { clave: "piel", etiqueta: "Piel" },
      { clave: "inspiracion", etiqueta: "Inspiración" },
      { clave: "defensa_total", etiqueta: "Defensa base" },
      { clave: "moral", etiqueta: "Moral" },
      { clave: "prosperidad_nivel", etiqueta: "Prosperidad" }
    ].forEach(function (dato) {
      contenedorReserva.appendChild(
        campoNumero(dato.etiqueta, campana[dato.clave], function (valor) {
          var cambio = {};
          cambio[dato.clave] = valor;
          campana[dato.clave] = valor;
          window.Almacen.guardarCampana(cambio).then(anunciarGuardado).catch(fallo);
        })
      );
    });
  }

  function pintarPlantas() {
    contenedorPlantas.replaceChildren();
    var nombres = catalogoReglas.recursos.nombres;

    catalogoReglas.recursos.plantas.forEach(function (planta) {
      var valor = (campana.plantas || {})[planta] || 0;
      contenedorPlantas.appendChild(
        campoNumero(nombres[planta] || planta, valor, function (nuevo) {
          var plantas = Object.assign({}, campana.plantas);
          plantas[planta] = nuevo;
          campana.plantas = plantas;
          window.Almacen.guardarCampana({ plantas: plantas }).then(anunciarGuardado).catch(fallo);
        })
      );
    });
  }

  function pintarEdificios() {
    tablaEdificios.replaceChildren();

    var cabecera = crear("thead");
    var filaCabecera = crear("tr");
    ["Edificio", "Nivel", "Estado"].forEach(function (titulo) {
      filaCabecera.appendChild(crear("th", null, titulo));
    });
    cabecera.appendChild(filaCabecera);
    tablaEdificios.appendChild(cabecera);

    var cuerpo = crear("tbody");

    edificios.forEach(function (edificio) {
      var fila = crear("tr");

      var celdaNombre = crear("th");
      celdaNombre.scope = "row";
      celdaNombre.appendChild(crear("span", "edificio__nombre", edificio.nombre));
      if (edificio.detalle) {
        celdaNombre.appendChild(crear("span", "edificio__detalle", edificio.detalle));
      }
      fila.appendChild(celdaNombre);

      var celdaNivel = crear("td");
      var nivel = document.createElement("input");
      nivel.type = "number";
      nivel.min = 1;
      nivel.className = "campo__control campo__control--compacto";
      nivel.value = edificio.nivel;
      nivel.setAttribute("aria-label", "Nivel de " + edificio.nombre);
      nivel.addEventListener("change", function () {
        var valor = Number(nivel.value) || 1;
        edificio.nivel = valor;
        window.Almacen
          .guardarEdificio(edificio.id, { nivel: valor })
          .then(anunciarGuardado)
          .catch(fallo);
      });
      celdaNivel.appendChild(nivel);
      fila.appendChild(celdaNivel);

      var celdaEstado = crear("td");
      var estado = document.createElement("select");
      estado.className = "campo__control campo__control--compacto";
      estado.setAttribute("aria-label", "Estado de " + edificio.nombre);
      ESTADOS_EDIFICIO.forEach(function (opcion) {
        var nodo = document.createElement("option");
        nodo.value = opcion.valor;
        nodo.textContent = opcion.texto;
        nodo.selected = edificio.estado === opcion.valor;
        estado.appendChild(nodo);
      });
      estado.addEventListener("change", function () {
        edificio.estado = estado.value;
        window.Almacen
          .guardarEdificio(edificio.id, { estado: estado.value })
          .then(anunciarGuardado)
          .catch(fallo);
      });
      celdaEstado.appendChild(estado);
      fila.appendChild(celdaEstado);

      cuerpo.appendChild(fila);
    });

    tablaEdificios.appendChild(cuerpo);
  }

  /* ---------- Arranque ---------- */

  window.Reglas
    .iniciar()
    .then(function (reglas) {
      catalogoReglas = reglas;
      return Promise.all([
        window.Almacen.obtenerCampana(),
        window.Almacen.obtenerEdificios()
      ]);
    })
    .then(function (resultados) {
      campana = resultados[0];
      edificios = resultados[1];

      if (!campana) {
        return window.Almacen.sembrarEnLocal().then(function () {
          return Promise.all([
            window.Almacen.obtenerCampana(),
            window.Almacen.obtenerEdificios()
          ]).then(function (sembrados) {
            campana = sembrados[0];
            edificios = sembrados[1];
          });
        });
      }
    })
    .then(function () {
      pintarReserva();
      pintarPlantas();
      pintarEdificios();
    })
    .catch(function (error) {
      mostrarError("No se han podido cargar los datos de la ciudad: " + error.message);
    });
})();
