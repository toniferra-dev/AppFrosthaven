/* ==========================================================================
   Frosthaven — panel de campaña
   Autor: Toni Ferrà — https://toniferra.com

   La vista de antes de partida: estado de Frosthaven, recursos del grupo,
   personajes y escenarios disponibles.
   ========================================================================== */
(function () {
  "use strict";

  var contenedores = {
    momento: document.querySelector("[data-panel='momento']"),
    conexion: document.querySelector("[data-panel='conexion']"),
    error: document.querySelector("[data-panel='error']"),
    errorTexto: document.querySelector("[data-panel='error-texto']"),
    ciudad: document.querySelector("[data-panel='ciudad']"),
    recursos: document.querySelector("[data-panel='recursos']"),
    personajes: document.querySelector("[data-panel='personajes']"),
    escenarios: document.querySelector("[data-panel='escenarios']")
  };

  // Guarda: este script solo actúa en la página del panel.
  if (!contenedores.ciudad) return;

  function mostrarError(mensaje) {
    contenedores.errorTexto.textContent = mensaje;
    contenedores.error.hidden = false;
  }

  function crear(etiqueta, clase, texto) {
    var nodo = document.createElement(etiqueta);
    if (clase) nodo.className = clase;
    if (texto !== undefined) nodo.textContent = texto;
    return nodo;
  }

  function dato(etiqueta, valor, apunte, modificador) {
    var caja = crear("div", "dato" + (modificador ? " " + modificador : ""));
    caja.appendChild(crear("span", "dato__etiqueta", etiqueta));
    caja.appendChild(crear("span", "dato__valor", valor));
    if (apunte) caja.appendChild(crear("span", "dato__apunte", apunte));
    return caja;
  }

  /* ---------- Bloques ---------- */

  function pintarCiudad(campana, personajes) {
    var contenedor = contenedores.ciudad;
    contenedor.replaceChildren();

    var modificador = window.Reglas.modificadorDeMoral(campana.moral);
    var defensa = window.Reglas.defensaEfectiva(campana);
    var signo = modificador >= 0 ? "+" : "";
    var nivelSugerido = window.Reglas.nivelEscenarioRecomendado(personajes);

    contenedor.appendChild(
      dato("Prosperidad", "Nv " + campana.prosperidad_nivel, campana.prosperidad_casillas + " casillas")
    );
    contenedor.appendChild(
      dato("Moral", String(campana.moral), "Defensa " + signo + modificador)
    );
    contenedor.appendChild(
      dato("Defensa efectiva", String(defensa), "Base " + campana.defensa_total, "dato--destacado")
    );
    contenedor.appendChild(dato("Inspiración", String(campana.inspiracion)));
    contenedor.appendChild(
      dato(
        "Soldados",
        (campana.soldados || []).length + "/" + (campana.soldados_maximo || 0),
        (campana.soldados || []).join(", ")
      )
    );
    contenedor.appendChild(
      dato(
        "Nivel de escenario",
        nivelSugerido === null ? "—" : String(nivelSugerido),
        "Recomendado"
      )
    );
  }

  function pintarRecursos(campana, personajes, catalogoReglas) {
    var tabla = contenedores.recursos;
    tabla.replaceChildren();

    var materiales = catalogoReglas.recursos.materiales;
    var nombres = catalogoReglas.recursos.nombres;
    var activos = personajes.filter(function (p) {
      return !p.retirado;
    });
    var total = window.Reglas.totalDelGrupo(campana, personajes);

    var cabecera = crear("thead");
    var filaCabecera = crear("tr");
    filaCabecera.appendChild(crear("th", null, "Reserva"));
    filaCabecera.appendChild(crear("th", "tabla__numero", "Oro"));
    materiales.forEach(function (material) {
      filaCabecera.appendChild(crear("th", "tabla__numero", nombres[material]));
    });
    cabecera.appendChild(filaCabecera);
    tabla.appendChild(cabecera);

    var cuerpo = crear("tbody");

    function fila(titulo, fuente, esTotal) {
      var tr = crear("tr");
      var th = crear("th", null, titulo);
      th.scope = "row";
      if (esTotal) th.style.fontWeight = "700";
      tr.appendChild(th);
      tr.appendChild(crear("td", "tabla__numero", String(fuente.oro || 0)));
      materiales.forEach(function (material) {
        tr.appendChild(crear("td", "tabla__numero", String(fuente[material] || 0)));
      });
      return tr;
    }

    cuerpo.appendChild(fila("Frosthaven", campana));
    activos.forEach(function (personaje) {
      cuerpo.appendChild(fila(personaje.nombre || "Sin nombre", personaje));
    });
    tabla.appendChild(cuerpo);

    var pie = crear("tfoot");
    pie.appendChild(fila("Total del grupo", total, true));
    tabla.appendChild(pie);
  }

  function pintarPersonajes(personajes, clases) {
    var contenedor = contenedores.personajes;
    contenedor.replaceChildren();

    var activos = personajes.filter(function (p) {
      return !p.retirado;
    });

    if (!activos.length) {
      contenedor.appendChild(crear("p", "pagina__subtitulo", "No hay personajes activos."));
      return;
    }

    activos.forEach(function (personaje) {
      var clase = clases[personaje.clase] || {};
      var tarjeta = crear("article", "tarjeta tarjeta--clase");
      if (clase.color) tarjeta.style.setProperty("--color-clase", clase.color);

      var cabecera = crear("div", "tarjeta__cabecera");
      var titulos = crear("div");
      titulos.appendChild(crear("h3", "tarjeta__titulo", personaje.nombre || "Sin nombre"));
      titulos.appendChild(crear("p", "pagina__subtitulo", clase.nombre || personaje.clase));
      cabecera.appendChild(titulos);

      var nivel = crear("span", "chip chip--info", "Nv " + personaje.nivel);
      nivel.style.marginInlineStart = "auto";
      cabecera.appendChild(nivel);
      tarjeta.appendChild(cabecera);

      var cuerpo = crear("div", "tarjeta__cuerpo ficha-resumen");

      // Experiencia hacia el siguiente nivel
      var restante = window.Reglas.experienciaRestante(personaje);
      var siguiente = window.Reglas.experienciaParaNivel(personaje.nivel + 1);
      var progreso = crear("div", "progreso");
      var pista = crear("div", "progreso__pista");
      var relleno = crear("div", "progreso__relleno");
      var porcentaje = siguiente ? Math.min(100, (personaje.xp / siguiente) * 100) : 100;
      relleno.style.width = porcentaje + "%";
      if (restante === 0) relleno.classList.add("is-completo");
      pista.appendChild(relleno);
      progreso.appendChild(pista);
      progreso.appendChild(
        crear("span", "progreso__texto", siguiente ? personaje.xp + "/" + siguiente : personaje.xp + " XP")
      );
      cuerpo.appendChild(progreso);

      // Avisos accionables
      var avisos = crear("div", "ficha-resumen__chips");
      if (restante === 0) {
        avisos.appendChild(crear("span", "chip chip--ok", "Sube de nivel"));
      }
      avisos.appendChild(crear("span", "chip", personaje.pv_max + " PV"));
      avisos.appendChild(crear("span", "chip", personaje.marcas + "/18 marcas"));
      cuerpo.appendChild(avisos);

      // Misión personal
      if (personaje.mision_personal && personaje.mision_personal.nombre) {
        var mision = personaje.mision_personal;
        var bloque = crear("div", "ficha-resumen__mision");
        bloque.appendChild(crear("span", "dato__etiqueta", "Misión personal"));
        bloque.appendChild(crear("p", null, mision.nombre));
        if (mision.total) {
          var barra = crear("div", "progreso");
          var pistaMision = crear("div", "progreso__pista");
          var rellenoMision = crear("div", "progreso__relleno");
          rellenoMision.style.width = Math.min(100, ((mision.progreso || 0) / mision.total) * 100) + "%";
          pistaMision.appendChild(rellenoMision);
          barra.appendChild(pistaMision);
          barra.appendChild(crear("span", "progreso__texto", (mision.progreso || 0) + "/" + mision.total));
          bloque.appendChild(barra);
        }
        cuerpo.appendChild(bloque);
      }

      tarjeta.appendChild(cuerpo);
      contenedor.appendChild(tarjeta);
    });
  }

  function pintarEscenarios(escenarios, catalogoEscenarios) {
    var lista = contenedores.escenarios;
    lista.replaceChildren();

    var etiquetas = catalogoEscenarios.leyenda.requisitos;
    var disponibles = escenarios.filter(function (e) {
      return e.estado === "disponible";
    });

    if (!disponibles.length) {
      lista.appendChild(crear("li", "pagina__subtitulo", "No hay escenarios disponibles."));
      return;
    }

    disponibles.forEach(function (escenario) {
      var elemento = crear("li", "listado__fila");
      elemento.appendChild(crear("span", "listado__numero", "E" + escenario.numero));
      elemento.appendChild(crear("span", "listado__nombre", escenario.nombre));

      var marcas = crear("span", "listado__marcas");
      (escenario.requiere || []).forEach(function (requisito) {
        marcas.appendChild(crear("span", "chip", etiquetas[requisito] || requisito));
      });
      if (escenario.fallidos > 0) {
        marcas.appendChild(
          crear("span", "chip chip--peligro", escenario.fallidos === 1 ? "1 intento fallido" : escenario.fallidos + " intentos fallidos")
        );
      }
      elemento.appendChild(marcas);
      lista.appendChild(elemento);
    });
  }

  /* ---------- Arranque ---------- */

  function arrancar() {
    contenedores.conexion.textContent = window.Almacen.conectado
      ? "Datos compartidos"
      : "Modo local (sin Supabase configurado)";

    return window.Reglas.iniciar().then(function (catalogoReglas) {
      return Promise.all([
        window.Almacen.obtenerCampana(),
        window.Almacen.obtenerPersonajes(),
        window.Almacen.obtenerEscenarios(),
        window.Almacen.cargarCatalogo("clases"),
        window.Almacen.cargarCatalogo("escenarios")
      ]).then(function (resultados) {
        var campana = resultados[0];
        var personajes = resultados[1];
        var escenarios = resultados[2];
        var clases = resultados[3];
        var catalogoEscenarios = resultados[4];

        if (!campana) {
          return window.Almacen.sembrarEnLocal().then(arrancar);
        }

        var estacion = campana.estacion === "invierno" ? "Invierno" : "Verano";
        contenedores.momento.textContent =
          estacion + (campana.semana ? " · semana " + campana.semana : "");

        pintarCiudad(campana, personajes);
        pintarRecursos(campana, personajes, catalogoReglas);
        pintarPersonajes(personajes, clases);
        pintarEscenarios(escenarios, catalogoEscenarios);
      });
    });
  }

  arrancar().catch(function (error) {
    mostrarError("No se han podido cargar los datos: " + error.message);
    contenedores.momento.textContent = "Sin datos";
  });
})();
