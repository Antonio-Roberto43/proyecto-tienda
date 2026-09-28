/* ============================================================
   ProductNova · conexion_db.js
   ------------------------------------------------------------
   Este es el archivo que login.html, cuenta.html y pagos.html
   ya estaban intentando cargar.

   Se carga DESPUÉS de la librería de Supabase:

       <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
       <script src="conexion_db.js"></script>

   PASO OBLIGATORIO: rellena las dos constantes de abajo con los
   datos de tu proyecto (Supabase → Settings → API).
   ============================================================ */


/* ------------------------------------------------------------
   1. CONFIGURACIÓN
   ------------------------------------------------------------ */

const SUPABASE_URL      = "https://zadvjnjujkmfytscjobd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_48Du1jwTvTOzuFrUrJ9uBA_qDKu3VVG";

/*  La clave "anon" es pública y puede ir en el navegador:
    quien protege los datos es RLS (04_seguridad.sql).
    NUNCA pongas aquí la clave "service_role".                */


/* ------------------------------------------------------------
   2. CLIENTE
   Se llama _supabase porque es el nombre que ya usaban tus
   páginas. La librería ocupa la variable global `supabase`,
   por eso el cliente necesita otro nombre.
   ------------------------------------------------------------ */

const _supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


/* ------------------------------------------------------------
   3. API DE LA WEB
   Todo lo que las páginas necesitan, en un único objeto DB.
   ------------------------------------------------------------ */

const DB = {

    /* ---------- SESIÓN ---------- */

    /**
     * Comprueba usuario y contraseña contra la base de datos.
     * @returns {Promise<{id,usuario,nombre,rol}|null>}
     */
    async login(usuario, password) {

        const { data, error } = await _supabase.rpc("fn_login", {
            p_usuario:  usuario,
            p_password: password
        });

        if (error) {
            console.error("Error de login:", error);
            throw new Error("No se ha podido conectar con el servidor.");
        }

        // La función devuelve 0 filas si las credenciales no son válidas
        return (data && data.length > 0) ? data[0] : null;
    },


    async registrar(usuario, password, email, nombre) {

        const { data, error } = await _supabase.rpc("fn_registrar_usuario", {
            p_usuario:  usuario,
            p_password: password,
            p_email:    email  || null,
            p_nombre:   nombre || null
        });

        if (error) throw new Error(error.message);
        return data;
    },


    async cambiarPassword(usuario, actual, nueva) {

        const { data, error } = await _supabase.rpc("fn_cambiar_password", {
            p_usuario:      usuario,
            p_password_old: actual,
            p_password_new: nueva
        });

        if (error) throw new Error(error.message);
        return data === true;
    },


    /** Guarda la sesión en el navegador (mismas claves de siempre). */
    guardarSesion(datosUsuario, recordar) {

        sessionStorage.setItem("usuarioLogueado", datosUsuario.usuario);
        localStorage.setItem("sesionIniciada", "true");

        // Guardamos nombre y rol para pintarlos en cuenta.html
        localStorage.setItem("perfilUsuario", JSON.stringify({
            id:      datosUsuario.id,
            usuario: datosUsuario.usuario,
            nombre:  datosUsuario.nombre,
            rol:     datosUsuario.rol
        }));

        if (recordar) {
            localStorage.setItem("usuarioRecordado", datosUsuario.usuario);
        } else {
            localStorage.removeItem("usuarioRecordado");
        }
    },


    cerrarSesion() {
        sessionStorage.removeItem("usuarioLogueado");
        localStorage.removeItem("sesionIniciada");
        localStorage.removeItem("perfilUsuario");
    },


    /** Nombre del usuario activo, o "Invitado". */
    usuarioActual() {
        return sessionStorage.getItem("usuarioLogueado")
            || localStorage.getItem("usuarioRecordado")
            || "Invitado";
    },


    perfil() {
        try {
            return JSON.parse(localStorage.getItem("perfilUsuario")) || null;
        } catch (e) {
            return null;
        }
    },


    /* ---------- CATÁLOGO ---------- */

    /**
     * Devuelve el catálogo.
     * @param {"producto"|"servicio"|null} tipo
     */
    async productos(tipo = null) {

        let consulta = _supabase.from("vista_catalogo").select("*");

        if (tipo) consulta = consulta.eq("tipo", tipo);

        const { data, error } = await consulta;

        if (error) {
            console.error("Error al leer el catálogo:", error);
            return [];
        }

        return data;
    },


    /* ---------- PEDIDOS ---------- */

    /**
     * Crea el pedido completo (cabecera + líneas + pago) en una
     * sola operación. El precio final lo calcula el servidor.
     *
     * @param {Array} items  [{nombre, precio, cantidad}, ...]
     * @returns {Promise<{id,total,estado}>}
     */
    async crearPedido({ usuario, nombre, direccion, metodo, items, telefono }) {

        const { data, error } = await _supabase.rpc("fn_crear_pedido", {
            p_usuario:      usuario,
            p_nombre_envio: nombre,
            p_direccion:    direccion,
            p_metodo_pago:  metodo,
            p_items:        items,
            p_telefono:     telefono || null
        });

        if (error) {
            console.error("Error al crear el pedido:", error);
            throw new Error(error.message || "Error interno al registrar el pedido.");
        }

        return Array.isArray(data) ? data[0] : data;
    },


    /** Histórico de pedidos para el panel de cuenta.html. */
    async pedidosDe(usuario) {

        const { data, error } = await _supabase.rpc("fn_pedidos_usuario", {
            p_usuario: usuario
        });

        if (error) {
            console.error("Error al leer los pedidos:", error);
            return [];
        }

        return data || [];
    },


    /* ---------- CARRITO EN SERVIDOR (opcional) ---------- */

    async guardarCarrito(usuario, items) {
        if (!usuario || usuario === "Invitado") return;

        const { error } = await _supabase.rpc("fn_guardar_carrito", {
            p_usuario: usuario,
            p_items:   items
        });

        if (error) console.warn("No se pudo sincronizar el carrito:", error.message);
    },


    async leerCarrito(usuario) {
        if (!usuario || usuario === "Invitado") return [];

        const { data, error } = await _supabase.rpc("fn_leer_carrito", {
            p_usuario: usuario
        });

        if (error) return [];
        return data || [];
    },


    /* ---------- UTILIDADES ---------- */

    euros(valor) {
        return Number(valor).toFixed(2).replace(".", ",") + " €";
    },

    fecha(iso) {
        return new Date(iso).toLocaleDateString("es-ES", {
            day: "2-digit", month: "short", year: "numeric"
        });
    }
};


/* ------------------------------------------------------------
   4. AVISO SI FALTA LA CONFIGURACIÓN
   ------------------------------------------------------------ */

if (SUPABASE_URL.includes("TU-PROYECTO")) {
    console.warn(
        "[ProductNova] Falta configurar conexion_db.js: " +
        "pon la URL y la clave anon de tu proyecto."
    );
}
