/* ==========================================================================
   Frosthaven — capa de datos
   Autor: Toni Ferrà — https://toniferra.com

   Expone window.Almacen con la misma interfaz tanto si hay Supabase
   configurado como si no. Sin configurar, guarda en localStorage: así se
   puede probar la app en local sin tocar la base de datos compartida.
   ========================================================================== */
(function () {
  "use strict";

  var config = window.FROSTHAVEN_CONFIG || {};
  var haySupabase = Boolean(config.supabaseUrl && config.supabaseAnonKey && window.supabase);
  var cliente = haySupabase
    ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey)
    : null;

  var CLAVE_LOCAL = "frosthaven:estado";

  /* ---------- Respaldo en el navegador ---------- */

  function leerLocal() {
    try {
      return JSON.parse(localStorage.getItem(CLAVE_LOCAL)) || {};
    } catch (error) {
      return {};
    }
  }

  function escribirLocal(estado) {
    localStorage.setItem(CLAVE_LOCAL, JSON.stringify(estado));
  }

  /* ---------- Catálogo estático ---------- */

  var catalogoCache = {};

  function cargarCatalogo(nombre) {
    if (catalogoCache[nombre]) return catalogoCache[nombre];
    catalogoCache[nombre] = fetch("datos/" + nombre + ".json").then(function (respuesta) {
      if (!respuesta.ok) throw new Error("No se pudo cargar datos/" + nombre + ".json");
      return respuesta.json();
    });
    return catalogoCache[nombre];
  }

  /* ---------- Lectura ---------- */

  function obtenerCampana() {
    if (!cliente) {
      return Promise.resolve(leerLocal().campana || null);
    }
    return cliente
      .from("campana")
      .select("*")
      .eq("id", 1)
      .maybeSingle()
      .then(function (r) {
        if (r.error) throw r.error;
        return r.data;
      });
  }

  function obtenerPersonajes() {
    if (!cliente) {
      return Promise.resolve(leerLocal().personajes || []);
    }
    return cliente
      .from("personajes")
      .select("*")
      .order("retirado", { ascending: true })
      .order("orden", { ascending: true })
      .then(function (r) {
        if (r.error) throw r.error;
        return r.data || [];
      });
  }

  function obtenerEscenarios() {
    if (!cliente) {
      return Promise.resolve(leerLocal().escenarios || []);
    }
    return cliente
      .from("escenarios")
      .select("*")
      .order("numero", { ascending: true })
      .then(function (r) {
        if (r.error) throw r.error;
        return r.data || [];
      });
  }

  function obtenerEdificios() {
    if (!cliente) {
      return Promise.resolve(leerLocal().edificios || []);
    }
    return cliente
      .from("edificios")
      .select("*")
      .order("orden", { ascending: true })
      .then(function (r) {
        if (r.error) throw r.error;
        return r.data || [];
      });
  }

  /* ---------- Escritura ---------- */

  function guardarCampana(cambios) {
    if (!cliente) {
      var estado = leerLocal();
      estado.campana = Object.assign({}, estado.campana, cambios);
      escribirLocal(estado);
      return Promise.resolve(estado.campana);
    }
    return cliente
      .from("campana")
      .update(cambios)
      .eq("id", 1)
      .select()
      .maybeSingle()
      .then(function (r) {
        if (r.error) throw r.error;
        return r.data;
      });
  }

  function guardarPersonaje(id, cambios) {
    if (!cliente) {
      var estado = leerLocal();
      estado.personajes = (estado.personajes || []).map(function (p) {
        return p.id === id ? Object.assign({}, p, cambios) : p;
      });
      escribirLocal(estado);
      return Promise.resolve(cambios);
    }
    return cliente
      .from("personajes")
      .update(cambios)
      .eq("id", id)
      .select()
      .maybeSingle()
      .then(function (r) {
        if (r.error) throw r.error;
        return r.data;
      });
  }

  function guardarEscenario(numero, cambios) {
    if (!cliente) {
      var estado = leerLocal();
      estado.escenarios = (estado.escenarios || []).map(function (e) {
        return e.numero === numero ? Object.assign({}, e, cambios) : e;
      });
      escribirLocal(estado);
      return Promise.resolve(cambios);
    }
    return cliente
      .from("escenarios")
      .update(cambios)
      .eq("numero", numero)
      .select()
      .maybeSingle()
      .then(function (r) {
        if (r.error) throw r.error;
        return r.data;
      });
  }

  function guardarEdificio(id, cambios) {
    if (!cliente) {
      var estado = leerLocal();
      estado.edificios = (estado.edificios || []).map(function (e) {
        return e.id === id ? Object.assign({}, e, cambios) : e;
      });
      escribirLocal(estado);
      return Promise.resolve(cambios);
    }
    return cliente
      .from("edificios")
      .update(cambios)
      .eq("id", id)
      .select()
      .maybeSingle()
      .then(function (r) {
        if (r.error) throw r.error;
        return r.data;
      });
  }

  function anotar(tipo, texto, datos) {
    var entrada = {
      tipo: tipo,
      texto: texto || "",
      datos: datos || {}
    };
    if (!cliente) {
      var estado = leerLocal();
      estado.bitacora = estado.bitacora || [];
      estado.bitacora.unshift(Object.assign({ creado_en: new Date().toISOString() }, entrada));
      escribirLocal(estado);
      return Promise.resolve(entrada);
    }
    return cliente
      .from("bitacora")
      .insert(entrada)
      .then(function (r) {
        if (r.error) throw r.error;
        return entrada;
      });
  }

  /* ---------- Sembrado inicial ---------- */

  // La semilla está escrita en camelCase por legibilidad; la app trabaja con
  // los nombres de columna de Supabase. Aquí se traduce para que el modo local
  // y el conectado manejen exactamente la misma forma de datos.
  function normalizarCampana(c) {
    return {
      id: 1,
      estacion: c.estacion,
      semana: c.semana,
      oro: c.oro,
      inspiracion: c.inspiracion,
      defensa_total: c.defensaTotal,
      moral: c.moral,
      prosperidad_nivel: c.prosperidadNivel,
      prosperidad_casillas: c.prosperidadCasillas,
      madera: c.madera,
      metal: c.metal,
      piel: c.piel,
      plantas: c.plantas || {},
      soldados: c.soldados || [],
      soldados_maximo: c.soldadosMaximo || 0,
      futuros_fichajes: c.futurosFichajes || [],
      pegatinas: [],
      notas: ""
    };
  }

  function normalizarPersonaje(p, indice) {
    return {
      id: "local-" + indice,
      orden: indice,
      nombre: p.nombre || "",
      clase: p.clase,
      nivel: p.nivel,
      pv_max: p.pvMax || 0,
      xp: p.xp || 0,
      retirado: Boolean(p.retirado),
      oro: p.oro || 0,
      madera: p.madera || 0,
      metal: p.metal || 0,
      piel: p.piel || 0,
      plantas: p.plantas || {},
      marcas: p.marcas || 0,
      mision_personal: p.misionPersonal || null,
      objetos: p.objetos || [],
      pericias: p.pericias || [],
      maestrias: p.maestrias || [],
      notas: p.notas || ""
    };
  }

  function sembrarEnLocal() {
    return cargarCatalogo("semilla").then(function (semilla) {
      return cargarCatalogo("escenarios").then(function (catalogoEscenarios) {
        var estado = {
          campana: normalizarCampana(semilla.campana),
          personajes: semilla.personajes.map(normalizarPersonaje),
          edificios: semilla.edificios.map(function (e, indice) {
            return {
              id: "local-" + indice,
              orden: indice,
              nombre: e.nombre,
              nivel: e.nivel,
              estado: e.estado,
              detalle: e.detalle || ""
            };
          }),
          escenarios: catalogoEscenarios.escenarios.map(function (e) {
            return {
              numero: e.n,
              nombre: e.nombre,
              estado: e.estado,
              fallidos: e.fallidos || 0,
              requiere: e.requiere || [],
              mision: e.mision || null,
              notas: ""
            };
          }),
          bitacora: []
        };
        escribirLocal(estado);
        return estado;
      });
    });
  }

  window.Almacen = {
    conectado: haySupabase,
    cargarCatalogo: cargarCatalogo,
    obtenerCampana: obtenerCampana,
    obtenerPersonajes: obtenerPersonajes,
    obtenerEscenarios: obtenerEscenarios,
    obtenerEdificios: obtenerEdificios,
    guardarCampana: guardarCampana,
    guardarPersonaje: guardarPersonaje,
    guardarEscenario: guardarEscenario,
    guardarEdificio: guardarEdificio,
    anotar: anotar,
    sembrarEnLocal: sembrarEnLocal
  };
})();
