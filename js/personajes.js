/* ==========================================================================
   Frosthaven — fichas de personaje
   Autor: Toni Ferrà — https://toniferra.com

   Lista de personajes y ficha completa editable. Cada campo guarda al perder
   el foco; las casillas de pericia y maestría guardan al pulsarlas.
   ========================================================================== */
(function () {
  "use strict";

  var lista = document.querySelector("[data-lista='personajes']");
  var detalle = document.querySelector("[data-detalle='ficha']");
  var estadoGuardado = document.querySelector("[data-estado='guardado']");
  var aviso = document.querySelector("[data-estado='error']");
  var avisoTexto = document.querySelector("[data-estado='error-texto']");

  // Guarda: este script solo actúa en la página de personajes.
  if (!lista || !detalle) return;

  var personajes = [];
  var clases = {};
  var seleccionado = null;

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

  var temporizadorEstado = null;
  function anunciarGuardado() {
    estadoGuardado.textContent = "Guardado";
    clearTimeout(temporizadorEstado);
    temporizadorEstado = setTimeout(function () {
      estadoGuardado.textContent = "";
    }, 2000);
  }

  function guardar(personaje, cambios) {
    Object.assign(personaje, cambios);
    return window.Almacen
      .guardarPersonaje(personaje.id, cambios)
      .then(anunciarGuardado)
      .catch(function (error) {
        mostrarError("No se ha podido guardar: " + error.message);
      });
  }

  /* ---------- Lista lateral ---------- */

  function pintarLista() {
    lista.replaceChildren();

    [
      { titulo: "Activos", filtro: false },
      { titulo: "Retirados", filtro: true }
    ].forEach(function (grupo) {
      var delGrupo = personajes.filter(function (p) {
        return Boolean(p.retirado) === grupo.filtro;
      });
      if (!delGrupo.length) return;

      var encabezado = crear("li", "personajes__grupo", grupo.titulo);
      encabezado.setAttribute("role", "presentation");
      lista.appendChild(encabezado);

      delGrupo.forEach(function (personaje) {
        var clase = clases[personaje.clase] || {};
        var elemento = crear("li");
        var boton = crear("button", "personajes__enlace");
        boton.type = "button";
        if (clase.color) boton.style.setProperty("--color-clase", clase.color);
        if (seleccionado && personaje.id === seleccionado.id) {
          boton.classList.add("is-activa");
          boton.setAttribute("aria-current", "true");
        }

        boton.appendChild(crear("span", "personajes__nombre", personaje.nombre || "Sin nombre"));
        boton.appendChild(
          crear("span", "personajes__clase", (clase.nombre || personaje.clase) + " · Nv " + personaje.nivel)
        );

        boton.addEventListener("click", function () {
          seleccionado = personaje;
          pintarLista();
          pintarFicha();
          detalle.focus();
        });

        elemento.appendChild(boton);
        lista.appendChild(elemento);
      });
    });
  }

  /* ---------- Campos editables ---------- */

  function campoNumero(etiqueta, valor, alCambiar, opciones) {
    var envoltorio = crear("div", "campo");
    var id = "campo-" + etiqueta.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    var control = document.createElement("input");

    control.type = "number";
    control.className = "campo__control campo__control--numero";
    control.id = id;
    control.value = valor === null || valor === undefined ? "" : valor;
    if (opciones && opciones.min !== undefined) control.min = opciones.min;
    if (opciones && opciones.max !== undefined) control.max = opciones.max;

    control.addEventListener("change", function () {
      var numero = control.value === "" ? 0 : Number(control.value);
      if (Number.isNaN(numero)) return;
      alCambiar(numero);
    });

    var etiquetaNodo = crear("label", "campo__etiqueta", etiqueta);
    etiquetaNodo.setAttribute("for", id);
    envoltorio.appendChild(etiquetaNodo);
    envoltorio.appendChild(control);
    return envoltorio;
  }

  function campoTexto(etiqueta, valor, alCambiar, multilinea) {
    var envoltorio = crear("div", "campo");
    var id = "campo-" + etiqueta.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    var control = document.createElement(multilinea ? "textarea" : "input");

    control.className = "campo__control";
    control.id = id;
    control.value = valor || "";
    if (multilinea) control.rows = 3;

    control.addEventListener("change", function () {
      alCambiar(control.value);
    });

    var etiquetaNodo = crear("label", "campo__etiqueta", etiqueta);
    etiquetaNodo.setAttribute("for", id);
    envoltorio.appendChild(etiquetaNodo);
    envoltorio.appendChild(control);
    return envoltorio;
  }

  /* ---------- Ficha ---------- */

  function bloqueCasillas(total, marcadas, enlazadas, alCambiar, nombreAccesible) {
    var grupo = crear("div", "casillas" + (enlazadas ? " casillas--enlazadas" : ""));
    grupo.setAttribute("role", "group");
    grupo.setAttribute("aria-label", nombreAccesible);

    for (var indice = 0; indice < total; indice += 1) {
      (function (posicion) {
        var casilla = crear("button", "casillas__casilla");
        casilla.type = "button";
        var activa = posicion < marcadas;
        casilla.classList.toggle("is-marcada", activa);
        casilla.setAttribute("aria-pressed", String(activa));
        casilla.setAttribute(
          "aria-label", nombreAccesible + ", casilla " + (posicion + 1) + " de " + total
        );
        casilla.addEventListener("click", function () {
          // Al pulsar una casilla se marca hasta ella; si ya era la última
          // marcada, se desmarca.
          alCambiar(posicion + 1 === marcadas ? posicion : posicion + 1);
        });
        grupo.appendChild(casilla);
      })(indice);
    }

    return grupo;
  }

  function seccionFicha(titulo, contenido) {
    var seccion = crear("section", "ficha__seccion");
    seccion.appendChild(crear("h3", "ficha__seccion-titulo", titulo));
    seccion.appendChild(contenido);
    return seccion;
  }

  function pintarFicha() {
    detalle.replaceChildren();

    if (!seleccionado) {
      detalle.appendChild(
        crear("p", "pagina__subtitulo", "Elige un personaje de la lista para ver su ficha.")
      );
      return;
    }

    var personaje = seleccionado;
    var clase = clases[personaje.clase] || { pericias: [], maestrias: [] };
    var ficha = crear("article", "tarjeta tarjeta--clase ficha");
    if (clase.color) ficha.style.setProperty("--color-clase", clase.color);

    /* Cabecera */
    var cabecera = crear("div", "tarjeta__cabecera");
    var titulos = crear("div");
    titulos.appendChild(crear("h2", "tarjeta__titulo", personaje.nombre || "Sin nombre"));
    var subtitulo = clase.nombre || personaje.clase;
    if (clase.mano) subtitulo += " · mano de " + clase.mano + " cartas";
    titulos.appendChild(crear("p", "pagina__subtitulo", subtitulo));
    cabecera.appendChild(titulos);
    if (personaje.retirado) {
      var retirado = crear("span", "chip", "Retirada");
      retirado.style.marginInlineStart = "auto";
      cabecera.appendChild(retirado);
    }
    ficha.appendChild(cabecera);

    var cuerpo = crear("div", "tarjeta__cuerpo ficha__cuerpo");

    /* Datos básicos */
    var basicos = crear("div", "rejilla rejilla--estrecha");
    basicos.appendChild(
      campoTexto("Nombre", personaje.nombre, function (valor) {
        guardar(personaje, { nombre: valor }).then(pintarLista);
      })
    );
    basicos.appendChild(
      campoNumero("Nivel", personaje.nivel, function (valor) {
        guardar(personaje, { nivel: valor }).then(function () {
          pintarLista();
          pintarFicha();
        });
      }, { min: 1, max: 9 })
    );
    basicos.appendChild(
      campoNumero("Puntos de vida", personaje.pv_max, function (valor) {
        guardar(personaje, { pv_max: valor });
      }, { min: 0 })
    );
    basicos.appendChild(
      campoNumero("Experiencia", personaje.xp, function (valor) {
        guardar(personaje, { xp: valor }).then(pintarFicha);
      }, { min: 0 })
    );
    cuerpo.appendChild(basicos);

    /* Progreso de experiencia */
    var siguiente = window.Reglas.experienciaParaNivel(personaje.nivel + 1);
    var restante = window.Reglas.experienciaRestante(personaje);
    var progreso = crear("div", "progreso");
    var pista = crear("div", "progreso__pista");
    var relleno = crear("div", "progreso__relleno");
    relleno.style.width = (siguiente ? Math.min(100, (personaje.xp / siguiente) * 100) : 100) + "%";
    if (restante === 0) relleno.classList.add("is-completo");
    pista.appendChild(relleno);
    progreso.appendChild(pista);
    progreso.appendChild(
      crear(
        "span",
        "progreso__texto",
        siguiente === null
          ? "Nivel máximo"
          : restante === 0
            ? "Puede subir a nivel " + (personaje.nivel + 1)
            : "Faltan " + restante + " XP para el nivel " + (personaje.nivel + 1)
      )
    );
    cuerpo.appendChild(progreso);

    /* Recursos */
    var recursos = crear("div", "rejilla rejilla--estrecha");
    [
      { clave: "oro", etiqueta: "Oro" },
      { clave: "madera", etiqueta: "Madera" },
      { clave: "metal", etiqueta: "Metal" },
      { clave: "piel", etiqueta: "Piel" }
    ].forEach(function (recurso) {
      recursos.appendChild(
        campoNumero(recurso.etiqueta, personaje[recurso.clave], function (valor) {
          var cambio = {};
          cambio[recurso.clave] = valor;
          guardar(personaje, cambio);
        }, { min: 0 })
      );
    });
    cuerpo.appendChild(seccionFicha("Recursos", recursos));

    /* Misión personal */
    var mision = personaje.mision_personal || {};
    var bloqueMision = crear("div", "ficha__mision");
    bloqueMision.appendChild(
      campoTexto("Misión", mision.nombre, function (valor) {
        guardar(personaje, {
          mision_personal: Object.assign({}, mision, { nombre: valor })
        });
      })
    );
    var progresoMision = crear("div", "rejilla rejilla--estrecha");
    progresoMision.appendChild(
      campoNumero("Progreso", mision.progreso || 0, function (valor) {
        guardar(personaje, {
          mision_personal: Object.assign({}, mision, { progreso: valor })
        }).then(pintarFicha);
      }, { min: 0 })
    );
    progresoMision.appendChild(
      campoNumero("Total", mision.total || 0, function (valor) {
        guardar(personaje, {
          mision_personal: Object.assign({}, mision, { total: valor })
        }).then(pintarFicha);
      }, { min: 0 })
    );
    bloqueMision.appendChild(progresoMision);
    if (mision.descripcion) {
      bloqueMision.appendChild(crear("p", "ficha__nota", mision.descripcion));
    }
    cuerpo.appendChild(seccionFicha("Misión personal", bloqueMision));

    /* Marcas de pericia */
    var bloqueMarcas = crear("div");
    bloqueMarcas.appendChild(
      bloqueCasillas(18, personaje.marcas, false, function (valor) {
        guardar(personaje, { marcas: valor }).then(pintarFicha);
      }, "Marcas de pericia")
    );
    bloqueMarcas.appendChild(
      crear(
        "p",
        "ficha__nota",
        personaje.marcas + " de 18 · " + window.Reglas.periciasGanadas(personaje.marcas) +
          " pericias por conjuntos completos de 3"
      )
    );
    cuerpo.appendChild(seccionFicha("Marcas de pericia", bloqueMarcas));

    /* Pericias de la clase */
    if (clase.pericias && clase.pericias.length) {
      var listaPericias = crear("ul", "pericias");
      clase.pericias.forEach(function (pericia, indice) {
        var marcadas = (personaje.pericias && personaje.pericias[indice]) || 0;
        var fila = crear("li", "pericias__fila");
        fila.appendChild(
          bloqueCasillas(pericia.casillas, marcadas, pericia.enlazadas, function (valor) {
            var actualizadas = (personaje.pericias || []).slice();
            while (actualizadas.length < clase.pericias.length) actualizadas.push(0);
            actualizadas[indice] = valor;
            guardar(personaje, { pericias: actualizadas }).then(pintarFicha);
          }, "Pericia " + (indice + 1))
        );
        fila.appendChild(crear("span", "pericias__texto", pericia.texto));
        listaPericias.appendChild(fila);
      });
      cuerpo.appendChild(seccionFicha("Pericias", listaPericias));
    }

    /* Maestrías */
    if (clase.maestrias && clase.maestrias.length) {
      var listaMaestrias = crear("ul", "pericias");
      clase.maestrias.forEach(function (texto, indice) {
        var conseguida = Boolean(personaje.maestrias && personaje.maestrias[indice]);
        var fila = crear("li", "pericias__fila");
        fila.appendChild(
          bloqueCasillas(1, conseguida ? 1 : 0, false, function (valor) {
            var actualizadas = (personaje.maestrias || []).slice();
            while (actualizadas.length < clase.maestrias.length) actualizadas.push(false);
            actualizadas[indice] = valor > 0;
            guardar(personaje, { maestrias: actualizadas }).then(pintarFicha);
          }, "Maestría " + (indice + 1))
        );
        fila.appendChild(crear("span", "pericias__texto", texto));
        listaMaestrias.appendChild(fila);
      });
      cuerpo.appendChild(seccionFicha("Maestrías", listaMaestrias));
    }

    /* Objetos */
    var objetos = (personaje.objetos || []).join("\n");
    cuerpo.appendChild(
      seccionFicha(
        "Objetos",
        campoTexto("Uno por línea", objetos, function (valor) {
          guardar(personaje, {
            objetos: valor.split("\n").map(function (linea) {
              return linea.trim();
            }).filter(Boolean)
          });
        }, true)
      )
    );

    /* Notas */
    cuerpo.appendChild(
      seccionFicha(
        "Notas",
        campoTexto("Notas", personaje.notas, function (valor) {
          guardar(personaje, { notas: valor });
        }, true)
      )
    );

    ficha.appendChild(cuerpo);
    detalle.appendChild(ficha);
  }

  /* ---------- Arranque ---------- */

  detalle.setAttribute("tabindex", "-1");

  window.Reglas
    .iniciar()
    .then(function () {
      return Promise.all([
        window.Almacen.obtenerPersonajes(),
        window.Almacen.cargarCatalogo("clases")
      ]);
    })
    .then(function (resultados) {
      personajes = resultados[0];
      clases = resultados[1];

      if (!personajes.length) {
        return window.Almacen.sembrarEnLocal().then(function () {
          return window.Almacen.obtenerPersonajes().then(function (sembrados) {
            personajes = sembrados;
          });
        });
      }
    })
    .then(function () {
      seleccionado = personajes.find(function (p) {
        return !p.retirado;
      }) || personajes[0] || null;
      pintarLista();
      pintarFicha();
    })
    .catch(function (error) {
      mostrarError("No se han podido cargar los personajes: " + error.message);
    });
})();
