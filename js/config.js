/* ==========================================================================
   Frosthaven — configuración de conexión
   Autor: Toni Ferrà — https://toniferra.com
   ==========================================================================

   Rellena estos dos valores con los del proyecto de Supabase
   (Project Settings → API). La clave anónima es pública por diseño: viaja en
   el código de la página. Lo que mantiene privada la campaña es no publicar
   la URL de la app.

   Mientras estén vacíos, la app funciona contra el navegador (localStorage),
   lo que permite probarla sin tocar la base de datos.
   ========================================================================== */

window.FROSTHAVEN_CONFIG = {
  supabaseUrl: "",
  supabaseAnonKey: ""
};
