# Seguimiento de campaña de Frosthaven

Aplicación web privada para llevar la campaña de *Frosthaven* del grupo: consultar el estado antes
de la partida y registrar lo ocurrido después. Sustituye a las hojas de cálculo, que se
desincronizaban al repetir el mismo dato en varios sitios.

## Cómo funciona

- **HTML, CSS y JavaScript vanilla.** Sin framework, sin dependencias y sin proceso de compilación:
  los archivos se sirven tal cual.
- **Supabase** guarda el estado compartido. Mientras no esté configurado, la app funciona contra el
  navegador (`localStorage`), lo que permite probarla sin tocar la base de datos.
- **Sin cuentas ni login.** Una URL no pública compartida con el grupo.

## Estructura

```
index.html         Panel: estado de Frosthaven, recursos, personajes y escenarios disponibles
personajes.html    Fichas de personaje completas y editables
escenarios.html    Estado de los escenarios
ciudad.html        Reserva de Frosthaven y edificios
css/base.css       Design tokens, reset y utilidades
css/bloques.css    Bloques compartidos entre páginas
css/<pagina>.css   Bloques propios de cada página
js/almacen.js      Capa de datos (Supabase o navegador)
js/reglas.js       Cálculos del reglamento
datos/             Catálogo del juego en JSON
supabase/          Esquema SQL
vendor/            supabase-js auto-alojado
```

El **catálogo** (`datos/`) es lo que no cambia durante la campaña: pericias y maestrías por clase,
tablas de experiencia y de nivel de escenario, escenarios y recursos. El **estado** vive en
Supabase. Esa separación es lo que evita repetir la lista de pericias en cada ficha.

## Puesta en marcha

1. Crear un proyecto en Supabase y ejecutar `supabase/esquema.sql` en su editor SQL.
2. Copiar la URL del proyecto y la clave anónima en `js/config.js`.
3. Cargar el estado inicial desde `datos/semilla.json`.

Para probar en local, cualquier servidor estático sirve:

```bash
python3 -m http.server 4173
```

## Despliegue

El repositorio está conectado a Vercel: **cada `git push` publica**. `vercel.json` añade la cabecera
`X-Robots-Tag: noindex` a todo el sitio.

## Privacidad y acceso

La tipografía Poppins y el cliente de Supabase se sirven desde el propio dominio: ninguna petición
sale a terceros, así que no hay cookies ni banner de consentimiento.

Sin login, la clave anónima viaja en el código de la página y las políticas permiten leer y escribir
a quien llegue. **Cualquiera con la URL puede modificar la campaña.** Es una decisión consciente
para un grupo de tres personas con una URL que no se publica.

## Pendiente

- Confirmar la reserva de Frosthaven: la hoja de campaña y la de recursos del grupo no coinciden
  (ver `_conflicto` en `datos/semilla.json`).
- Rellenar `pvPorNivel` en `datos/clases.json` desde las tarjetas de personaje.
- Completar la clase Puño Helado, sin ficha entre el material de partida.
- Flujo guiado de registro posterior a la partida, que hoy se hace editando cada página.

## Autor

Todo el código y el contenido son de **Toni Ferrà** — [toniferra.com](https://toniferra.com).

*Frosthaven* es un juego de mesa de Cephalofair Games. Esta herramienta es privada, de uso del
grupo, y no guarda relación con la editorial.
