/* ==========================================================================
   Frosthaven — cálculos del reglamento
   Autor: Toni Ferrà — https://toniferra.com

   Todo lo que la app calcula sola para no tener que hacerlo a mano en la
   mesa. Las tablas vienen de datos/reglas.json.
   ========================================================================== */
(function () {
  "use strict";

  var reglas = null;

  function iniciar() {
    if (reglas) return Promise.resolve(reglas);
    return window.Almacen.cargarCatalogo("reglas").then(function (datos) {
      reglas = datos;
      return reglas;
    });
  }

  /* ---------- Experiencia ---------- */

  function experienciaParaNivel(nivel) {
    if (!reglas || nivel < 2 || nivel > 9) return null;
    return reglas.experiencia[String(nivel)] || null;
  }

  // Experiencia que le falta a un personaje para el siguiente nivel.
  // Devuelve null si ya está a nivel 9.
  function experienciaRestante(personaje) {
    var siguiente = experienciaParaNivel(personaje.nivel + 1);
    if (siguiente === null) return null;
    return Math.max(0, siguiente - personaje.xp);
  }

  function puedeSubirDeNivel(personaje) {
    var restante = experienciaRestante(personaje);
    return restante !== null && restante === 0;
  }

  /* ---------- Recursos del grupo ---------- */

  // Suma la reserva de Frosthaven y las reservas personales de los personajes
  // activos. Es el total que el grupo tiene realmente disponible.
  function totalDelGrupo(campana, personajes) {
    var total = { oro: 0, madera: 0, metal: 0, piel: 0, plantas: {} };
    var fuentes = [campana].concat(
      (personajes || []).filter(function (p) {
        return !p.retirado;
      })
    );

    fuentes.forEach(function (fuente) {
      if (!fuente) return;
      total.oro += fuente.oro || 0;
      total.madera += fuente.madera || 0;
      total.metal += fuente.metal || 0;
      total.piel += fuente.piel || 0;
      Object.keys(fuente.plantas || {}).forEach(function (planta) {
        total.plantas[planta] = (total.plantas[planta] || 0) + fuente.plantas[planta];
      });
    });

    return total;
  }

  /* ---------- Escenarios ---------- */

  // Nivel de escenario recomendado: nivel medio de los personajes dividido
  // entre 2, redondeando hacia arriba. En solitario o con información pública
  // se suma 1 antes de dividir (reglamento, pág. 69).
  function nivelEscenarioRecomendado(personajes, opciones) {
    var activos = (personajes || []).filter(function (p) {
      return !p.retirado;
    });
    if (!activos.length) return null;

    var suma = activos.reduce(function (acumulado, p) {
      return acumulado + p.nivel;
    }, 0);
    var medio = suma / activos.length;
    if (opciones && opciones.dificultadAumentada) medio += 1;

    return Math.min(7, Math.max(0, Math.ceil(medio / 2)));
  }

  function datosNivelEscenario(nivel) {
    if (!reglas || nivel === null) return null;
    return reglas.nivelEscenario[String(nivel)] || null;
  }

  /* ---------- Defensa y moral ---------- */

  // El modificador de moral no es acumulativo: solo se aplica el del tramo
  // en el que cae la moral actual (reglamento, pág. 54).
  function modificadorDeMoral(moral) {
    if (!reglas) return 0;
    var tramo = reglas.moralDefensa.tramos.find(function (t) {
      return moral >= t.desde && moral <= t.hasta;
    });
    return tramo ? tramo.modificador : 0;
  }

  function defensaEfectiva(campana) {
    if (!campana) return 0;
    return (campana.defensa_total || 0) + modificadorDeMoral(campana.moral || 0);
  }

  /* ---------- Marcas y pericias ---------- */

  // Cada 3 marcas se gana una pericia. Máximo 18 marcas.
  function periciasGanadas(marcas) {
    return Math.floor(Math.min(marcas || 0, 18) / 3);
  }

  // Casillas de pericia que el personaje tiene marcadas en su ficha.
  function periciasGastadas(personaje) {
    if (!personaje.pericias) return 0;
    return personaje.pericias.reduce(function (total, marcadas) {
      return total + (marcadas || 0);
    }, 0);
  }

  // Pendiente: avisar de las pericias sin gastar requiere sumar las cuatro
  // fuentes de marcas del reglamento (subir de nivel, completar conjuntos de 3
  // marcas, conseguir maestrías y el bonus por personajes retirados del propio
  // jugador). El bonus por retirados no está en los datos actuales, así que de
  // momento no se calcula en vez de mostrar una cifra equivocada.

  /* ---------- Calendario ---------- */

  // Una estación dura 10 semanas; al completarlas se cambia de estación.
  function avanzarSemana(campana) {
    var semanasPorEstacion = reglas ? reglas.calendario.semanasPorEstacion : 10;
    var semana = (campana.semana || 0) + 1;
    var estacion = campana.estacion;

    if (semana > semanasPorEstacion) {
      semana = 1;
      estacion = estacion === "verano" ? "invierno" : "verano";
    }

    return { semana: semana, estacion: estacion };
  }

  /* ---------- Inspiración ---------- */

  // Al completar un escenario el grupo gana 4 menos el número de personajes.
  function inspiracionPorEscenario(personajes) {
    var activos = (personajes || []).filter(function (p) {
      return !p.retirado;
    }).length;
    return Math.max(0, 4 - activos);
  }

  window.Reglas = {
    iniciar: iniciar,
    experienciaParaNivel: experienciaParaNivel,
    experienciaRestante: experienciaRestante,
    puedeSubirDeNivel: puedeSubirDeNivel,
    totalDelGrupo: totalDelGrupo,
    nivelEscenarioRecomendado: nivelEscenarioRecomendado,
    datosNivelEscenario: datosNivelEscenario,
    modificadorDeMoral: modificadorDeMoral,
    defensaEfectiva: defensaEfectiva,
    periciasGanadas: periciasGanadas,
    periciasGastadas: periciasGastadas,
    avanzarSemana: avanzarSemana,
    inspiracionPorEscenario: inspiracionPorEscenario
  };
})();
