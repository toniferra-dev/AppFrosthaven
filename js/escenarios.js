/* ==========================================================================
   Frosthaven — escenarios
   Autor: Toni Ferrà — https://toniferra.com

   Listado con el estado de cada escenario. El estado y los intentos
   fallidos se editan en la propia tabla y se guardan al cambiarlos.
   ========================================================================== */
(function () {
  "use strict";

  var tabla = document.querySelector("[data-tabla='escenarios']");
  var resumen = document.querySelector("[data-estado='resumen']");
  var estadoGuardado = document.querySelector("[data-estado='guardado']");
  var aviso = document.querySelector("[data-estado='error']");
  var avisoTexto = document.querySelector("[data-estado='error-texto']");

  // Guarda: este script solo actúa en la página de escenarios.
  if (!tabla) return;

  var escenarios = [];
  var etiquetasRequisito = {};

  var ESTADOS = [
    { valor: "superado", texto: "Superado", chip: "chip--ok" },
    { valor: "disponible", texto: "Disponible", chip: "chip--info" },
    { valor: "bloqueado", texto: "Bloqueado", chip: "" }
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

  function guardar(escenario, cambios) {
    Object.assign(escenario, cambios);
    return window.Almacen
      .guardarEscenario(escenario.numero, cambios)
      .then(anunciarGuardado)
      .catch(function (error) {
        mostrarError("No se ha podido guardar: " + error.message);
      });
  }

  function pintarResumen() {
    var cuenta = { superado: 0, disponible: 0, bloqueado: 0 };
    escenarios.forEach(function (escenario) {
      cuenta[escenario.estado] = (cuenta[escenario.estado] || 0) + 1;
    });
    resumen.textContent =
      cuenta.superado + " superados · " + cuenta.disponible + " disponibles · " +
      cuenta.bloqueado + " bloqueados";
  }

  function selectorEstado(escenario) {
    var control = document.createElement("select");
    control.className = "campo__control campo__control--compacto";
    control.setAttribute("aria-label", "Estado del escenario " + escenario.numero);

    ESTADOS.forEach(function (estado) {
      var opcion = document.createElement("option");
      opcion.value = estado.valor;
      opcion.textContent = estado.texto;
      opcion.selected = escenario.estado === estado.valor;
      control.appendChild(opcion);
    });

    control.addEventListener("change", function () {
      guardar(escenario, { estado: control.value }).then(function () {
        pintarResumen();
        pintarTabla();
      });
    });

    return control;
  }

  function pintarTabla() {
    tabla.replaceChildren();

    var cabecera = crear("thead");
    var filaCabecera = crear("tr");
    ["Nº", "Escenario", "Estado", "Requisitos", "Fallidos"].forEach(function (titulo, indice) {
      var celda = crear("th", indice === 4 ? "tabla__numero" : null, titulo);
      filaCabecera.appendChild(celda);
    });
    cabecera.appendChild(filaCabecera);
    tabla.appendChild(cabecera);

    var cuerpo = crear("tbody");

    var orden = { disponible: 0, superado: 1, bloqueado: 2 };
    escenarios
      .slice()
      .sort(function (a, b) {
        var porEstado = orden[a.estado] - orden[b.estado];
        return porEstado !== 0 ? porEstado : a.numero - b.numero;
      })
      .forEach(function (escenario) {
        var fila = crear("tr");
        if (escenario.estado === "bloqueado") fila.classList.add("is-atenuada");

        var numero = crear("th", null, "E" + escenario.numero);
        numero.scope = "row";
        fila.appendChild(numero);

        fila.appendChild(crear("td", null, escenario.nombre));

        var celdaEstado = crear("td");
        celdaEstado.appendChild(selectorEstado(escenario));
        fila.appendChild(celdaEstado);

        var celdaRequisitos = crear("td");
        var marcas = crear("div", "listado__marcas");
        (escenario.requiere || []).forEach(function (requisito) {
          marcas.appendChild(crear("span", "chip", etiquetasRequisito[requisito] || requisito));
        });
        if (escenario.mision) {
          marcas.appendChild(crear("span", "chip chip--aviso", "Misión personal"));
        }
        celdaRequisitos.appendChild(marcas);
        fila.appendChild(celdaRequisitos);

        var celdaFallidos = crear("td", "tabla__numero");
        var control = document.createElement("input");
        control.type = "number";
        control.min = 0;
        control.className = "campo__control campo__control--compacto";
        control.value = escenario.fallidos || 0;
        control.setAttribute("aria-label", "Intentos fallidos del escenario " + escenario.numero);
        control.addEventListener("change", function () {
          guardar(escenario, { fallidos: Number(control.value) || 0 });
        });
        celdaFallidos.appendChild(control);
        fila.appendChild(celdaFallidos);

        cuerpo.appendChild(fila);
      });

    tabla.appendChild(cuerpo);
  }

  /* ---------- Arranque ---------- */

  Promise.all([
    window.Almacen.obtenerEscenarios(),
    window.Almacen.cargarCatalogo("escenarios")
  ])
    .then(function (resultados) {
      escenarios = resultados[0];
      etiquetasRequisito = resultados[1].leyenda.requisitos;

      if (!escenarios.length) {
        return window.Almacen.sembrarEnLocal().then(function () {
          return window.Almacen.obtenerEscenarios().then(function (sembrados) {
            escenarios = sembrados;
          });
        });
      }
    })
    .then(function () {
      pintarResumen();
      pintarTabla();
    })
    .catch(function (error) {
      mostrarError("No se han podido cargar los escenarios: " + error.message);
    });
})();
