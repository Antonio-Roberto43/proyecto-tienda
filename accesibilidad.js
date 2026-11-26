/* ============================================================
   ProductNova · accesibilidad.js
   ------------------------------------------------------------
   Tres ayudas de accesibilidad para toda la web, en todos los
   idiomas de idioma.js (siguen a su selector de idioma):

   1) NARRADOR DE VOZ  (Web Speech API del navegador)
      - Lee en voz alta lo que se enfoca con el teclado (Tab) y lo
        que se señala con el ratón, con su tipo y estado:
        "Correo electrónico, campo de correo, obligatorio".
      - Anuncia solo los mensajes de error/éxito, los cambios de
        método de pago, el botón "Añadido ✓", etc.
      - Alt+Mayús+N  activa/desactiva · Alt+Mayús+L lee la página
        entera resaltando lo que va leyendo · Esc detiene la voz.
      - Se recuerda entre páginas. Un primer Tab siempre llega a
        "Activar el narrador de voz" (enlace de salto oculto).
      - Si la persona ya usa un lector de pantalla (NVDA, JAWS,
        VoiceOver) no lo necesita: las páginas ya llevan etiquetas
        ARIA, avisos role="alert" y navegación por teclado.

   2) MODO DALTÓNICO
      - Paleta azul/naranja segura para protanopia, deuteranopia y
        tritanopia, y los estados dejan de depender solo del color:
        iconos ✔ ✖, bordes continuos / discontinuos / punteados,
        enlaces subrayados y foco del teclado más grueso.

   Se carga DESPUÉS de idioma.js y ANTES de conexion_db.js:

       <script src="idioma.js"></script>
       <script src="accesibilidad.js"></script>
       <script src="conexion_db.js"></script>

   API por si otra página la necesita:
       Accesibilidad.decir("texto")    → lo dice si el narrador está activo
       Accesibilidad.activo            → true / false
   ============================================================ */

(function () {
    "use strict";

    var CLAVE_NARRADOR = "pn_narrador";
    var CLAVE_VELOCIDAD = "pn_narrador_vel";
    var CLAVE_DALTONICO = "pn_daltonico";

    var VELOCIDADES = { lenta: 0.8, normal: 1, rapida: 1.35 };
    var ORDEN = ["es", "en", "zh"];
    var LOCALES = { es: "es-ES", en: "en-US", zh: "zh-CN" };
    var VOZ_BASE = { es: "es", en: "en", zh: "zh" };

    var synth = ("speechSynthesis" in window) ? window.speechSynthesis : null;

    function leer(clave, defecto) {
        try { var v = localStorage.getItem(clave); return v === null ? defecto : v; } catch (e) { return defecto; }
    }
    function guardar(clave, valor) {
        try { localStorage.setItem(clave, valor); } catch (e) { }
    }

    var activo = leer(CLAVE_NARRADOR, "0") === "1" && !!synth;
    var daltonico = leer(CLAVE_DALTONICO, "0") === "1";
    var velocidad = VELOCIDADES[leer(CLAVE_VELOCIDAD, "normal")] ? leer(CLAVE_VELOCIDAD, "normal") : "normal";


    /* ============================================================
       TEXTOS   clave: [español, English, 中文]
       ============================================================ */

    var D = {
        boton:        ["Accesibilidad", "Accessibility", "无障碍"],
        titulo:       ["Accesibilidad", "Accessibility", "无障碍"],
        narrador:     ["Narrador de voz", "Voice narrator", "语音朗读"],
        narradorAyuda:["Lee en voz alta lo que seleccionas con el teclado o señalas con el ratón. Si ya usas un lector de pantalla (NVDA, JAWS, VoiceOver), déjalo desactivado.",
                       "Reads aloud what you select with the keyboard or point at with the mouse. If you already use a screen reader (NVDA, JAWS, VoiceOver), leave it off.",
                       "朗读您用键盘选中或用鼠标指向的内容。如果您已在使用读屏软件（NVDA、JAWS、VoiceOver），请保持关闭。"],
        velocidad:    ["Velocidad de la voz", "Voice speed", "语速"],
        lenta:        ["Lenta", "Slow", "慢"],
        normal:       ["Normal", "Normal", "正常"],
        rapida:       ["Rápida", "Fast", "快"],
        leerPagina:   ["Leer la página", "Read the page", "朗读本页"],
        parar:        ["Detener la voz", "Stop the voice", "停止朗读"],
        dalto:        ["Modo daltónico", "Colour-blind mode", "色盲模式"],
        daltoAyuda:   ["Paleta azul y naranja apta para daltonismo, con iconos y bordes además del color.",
                       "Blue and orange colour-blind-safe palette, with icons and borders as well as colour.",
                       "采用蓝色与橙色的色盲友好配色，除颜色外还配有图标和边框。"],
        atajos:       ["Atajos: Alt+Mayús+N activa el narrador · Alt+Mayús+L lee la página · Esc detiene la voz.",
                       "Shortcuts: Alt+Shift+N toggles the narrator · Alt+Shift+L reads the page · Esc stops the voice.",
                       "快捷键：Alt+Shift+N 开关朗读 · Alt+Shift+L 朗读本页 · Esc 停止朗读。"],
        sinVoz:       ["Tu navegador no admite voz sintetizada.", "Your browser does not support speech synthesis.", "您的浏览器不支持语音合成。"],
        saltarOn:     ["Desactivar el narrador de voz (Alt+Mayús+N)", "Turn off the voice narrator (Alt+Shift+N)", "关闭语音朗读 (Alt+Shift+N)"],
        saltarOff:    ["Activar el narrador de voz (Alt+Mayús+N)", "Turn on the voice narrator (Alt+Shift+N)", "开启语音朗读 (Alt+Shift+N)"],
        narradorOn:   ["Narrador activado.", "Narrator on.", "朗读已开启。"],
        narradorOff:  ["Narrador desactivado.", "Narrator off.", "朗读已关闭。"],
        intro:        ["{titulo}. Narrador activado. Pulsa Alt, Mayúsculas y L para leer la página, o Escape para detener la voz.",
                       "{titulo}. Narrator on. Press Alt, Shift and L to read the page, or Escape to stop the voice.",
                       "{titulo}。朗读已开启。按 Alt、Shift 加 L 朗读本页，按 Esc 停止朗读。"],
        daltoOn:      ["Modo daltónico activado.", "Colour-blind mode on.", "色盲模式已开启。"],
        daltoOff:     ["Modo daltónico desactivado.", "Colour-blind mode off.", "色盲模式已关闭。"],
        idiomaCambiado:["Idioma cambiado a español.", "Language changed to English.", "语言已切换为中文。"],
        finPagina:    ["Fin de la página.", "End of the page.", "页面结束。"],
        panelAbierto: ["Panel de accesibilidad.", "Accessibility panel.", "无障碍面板。"],

        /* roles y estados que se dicen al leer un elemento */
        rEnlace:      ["enlace", "link", "链接"],
        rBoton:       ["botón", "button", "按钮"],
        rTexto:       ["campo de texto", "text field", "文本框"],
        rPassword:    ["campo de contraseña", "password field", "密码框"],
        rEmail:       ["campo de correo", "email field", "邮箱输入框"],
        rTel:         ["campo de teléfono", "phone field", "电话输入框"],
        rCasilla:     ["casilla", "checkbox", "复选框"],
        rOpcion:      ["opción", "radio button", "单选项"],
        rLista:       ["lista desplegable", "dropdown list", "下拉列表"],
        rImagen:      ["imagen", "image", "图片"],
        rVideo:       ["vídeo", "video", "视频"],
        rTitulo:      ["encabezado nivel {n}", "heading level {n}", "{n}级标题"],
        eMarcada:     ["marcada", "checked", "已勾选"],
        eSinMarcar:   ["sin marcar", "not checked", "未勾选"],
        eSeleccionada:["seleccionada", "selected", "已选择"],
        eNoSel:       ["no seleccionada", "not selected", "未选择"],
        eObligatorio: ["obligatorio", "required", "必填"],
        eDesactivado: ["desactivado", "disabled", "已禁用"],
        eExpandido:   ["desplegado", "expanded", "已展开"],
        eContraido:   ["plegado", "collapsed", "已收起"],
        eVacio:       ["vacío", "empty", "空"],
        eContiene:    ["contiene {v}", "contains {v}", "内容：{v}"]
    };

    function idioma() {
        if (window.I18N && I18N.idioma) return I18N.idioma;
        var l = (document.documentElement.lang || "es").toLowerCase();
        for (var i = 0; i < ORDEN.length; i++) { if (l.indexOf(ORDEN[i]) === 0) return ORDEN[i]; }
        return "es";
    }

    function T(clave, vars) {
        var fila = D[clave];
        var i = ORDEN.indexOf(idioma());
        var txt = fila ? (fila[i] || fila[0]) : clave;
        if (vars) Object.keys(vars).forEach(function (k) { txt = txt.split("{" + k + "}").join(vars[k]); });
        return txt;
    }


    var finNarrador = 0;


    /* ============================================================
       ESTILOS (se inyectan al instante para que el modo daltónico
       no parpadee al cargar la página)
       ============================================================ */

    var CSS = [
        /* --- botón y panel --- */
        '#selector-a11y{position:relative;display:inline-block;font-family:Arial,Helvetica,sans-serif;z-index:2000}',
        '#selector-a11y.flotante{position:fixed;top:14px;right:112px}',
        'nav > #selector-a11y{margin-left:14px;flex-shrink:0}',
        '#a11y-boton{display:flex;align-items:center;justify-content:center;width:42px;height:42px;padding:0;border:1px solid var(--borde,#e2e8f0);',
        '  border-radius:10px;background:var(--blanco,#fff);color:var(--azul-oscuro,#0f172a);cursor:pointer;transition:.2s;font-family:inherit}',
        '#a11y-boton:hover,#a11y-boton:focus-visible,#a11y-boton[aria-expanded="true"]{background:var(--azul-claro,#eff6ff);border-color:#bfdbfe;outline:none}',
        '#a11y-boton svg{width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
        '#a11y-boton .a11y-punto{position:absolute;top:5px;right:5px;width:9px;height:9px;border-radius:50%;background:var(--azul,#2563eb);border:2px solid var(--blanco,#fff);display:none}',
        'html.pn-narrador #a11y-boton .a11y-punto{display:block}',
        '#a11y-panel{position:absolute;top:calc(100% + 8px);right:0;width:310px;max-width:calc(100vw - 24px);padding:16px;text-align:left;',
        '  background:var(--blanco,#fff);color:var(--texto,#1e293b);border:1px solid var(--borde,#e2e8f0);border-radius:12px;',
        '  box-shadow:0 10px 30px rgba(15,23,42,.14);font-size:14px;line-height:1.45;max-height:calc(100vh - 90px);overflow-y:auto}',
        '#a11y-panel[hidden]{display:none}',
        '#a11y-panel h2{font-size:16px;margin:0 0 12px;color:var(--azul-oscuro,#0f172a)}',
        '#a11y-panel .a11y-fila{padding:10px 0;border-top:1px solid var(--borde,#e2e8f0)}',
        '#a11y-panel .a11y-fila:first-of-type{border-top:0;padding-top:0}',
        '#a11y-panel .a11y-sw{display:flex;align-items:center;gap:10px;font-weight:700;cursor:pointer}',
        '#a11y-panel .a11y-sw input{width:20px;height:20px;accent-color:var(--azul,#2563eb);flex-shrink:0;cursor:pointer}',
        '#a11y-panel .a11y-ayuda{margin:6px 0 0 30px;font-size:12px;color:var(--texto-secundario,#64748b)}',
        '#a11y-panel label.a11y-lbl{display:block;font-weight:700;margin-bottom:6px}',
        '#a11y-panel select{width:100%;padding:9px 10px;border:1px solid var(--borde,#e2e8f0);border-radius:8px;font:inherit;background:#fff;color:inherit}',
        '#a11y-panel .a11y-botones{display:flex;gap:8px;margin-top:10px}',
        '#a11y-panel .a11y-botones button{flex:1;padding:9px 8px;border:1px solid var(--borde,#e2e8f0);border-radius:8px;background:var(--azul-claro,#eff6ff);',
        '  color:var(--azul,#2563eb);font:700 13px Arial,Helvetica,sans-serif;cursor:pointer}',
        '#a11y-panel .a11y-botones button:hover,#a11y-panel .a11y-botones button:focus-visible{background:var(--azul,#2563eb);color:#fff;outline:none}',
        '#a11y-panel .a11y-atajos{margin:12px 0 0;padding-top:10px;border-top:1px solid var(--borde,#e2e8f0);font-size:12px;color:var(--texto-secundario,#64748b)}',
        '#a11y-panel .a11y-aviso{margin:8px 0 0;font-size:12px;color:#b45309}',
        '#a11y-panel .a11y-aviso.ok{color:var(--texto-secundario,#64748b)}',
        '#a11y-panel .a11y-botones[hidden]{display:none}',
        '#a11y-panel select:disabled{opacity:.55;cursor:not-allowed}',
        '@media (max-width:600px){#a11y-boton{width:38px;height:38px}#selector-a11y.flotante{top:10px;right:92px}',
        '  #a11y-panel{position:fixed;left:12px;right:12px;width:auto;max-width:none}}',

        /* --- enlace de salto: primer Tab de cada página --- */
        '.pn-saltar{position:absolute;left:8px;top:-90px;z-index:3000;padding:10px 14px;background:#0f172a;color:#fff;border:2px solid #fff;',
        '  border-radius:8px;font:700 14px Arial,Helvetica,sans-serif;cursor:pointer}',
        '.pn-saltar:focus{top:8px;outline:3px solid #2563eb;outline-offset:2px}',

        /* --- resaltado de lo que se está leyendo --- */
        '.pn-leyendo{outline:3px solid #2563eb !important;outline-offset:3px !important;background-image:linear-gradient(rgba(37,99,235,.10),rgba(37,99,235,.10)) !important;border-radius:6px}',

        /* ============ MODO DALTÓNICO ============
           Paleta Okabe-Ito (segura para los tres tipos de daltonismo):
           azul #0072B2 = correcto/positivo · naranja-rojizo #D55E00 = error/negativo */
        'html.pn-daltonico{--verde:#0072B2;--rojo:#D55E00;--exito-texto:#00578a;--exito-bg:#e5f1f9;--exito-border:#0072B2;',
        '  --error-texto:#8a3600;--error-bg:#fff1e3;--error-border:#D55E00}',

        /* mensajes de éxito / error (login, registro y pago): color + borde + icono */
        'html.pn-daltonico .mensaje.exito,html.pn-daltonico .alerta.exito{color:#00456e !important;background:#e5f1f9 !important;border:2px solid #0072B2 !important}',
        'html.pn-daltonico .mensaje.error,html.pn-daltonico .alerta.error{color:#7a2f00 !important;background:#fff1e3 !important;border:2px dashed #D55E00 !important}',
        'html.pn-daltonico .mensaje.exito::before,html.pn-daltonico .alerta.exito::before{content:"\\2714\\00a0";content:"\\2714\\00a0" / ""}',
        'html.pn-daltonico .mensaje.error::before,html.pn-daltonico .alerta.error::before{content:"\\2716\\00a0";content:"\\2716\\00a0" / ""}',

        /* estados de pedido (cuenta): color + borde distinto + icono */
        'html.pn-daltonico .estado{border:2px solid currentColor}',
        'html.pn-daltonico .estado-completado{background:#e5f1f9 !important;color:#00456e !important;border-style:solid}',
        'html.pn-daltonico .estado-pendiente{background:#fff6d6 !important;color:#6b4e00 !important;border-style:dotted}',
        'html.pn-daltonico .estado-cancelado{background:#fff1e3 !important;color:#7a2f00 !important;border-style:dashed}',
        'html.pn-daltonico .estado-completado::before{content:"\\2714\\00a0";content:"\\2714\\00a0" / ""}',
        'html.pn-daltonico .estado-pendiente::before{content:"\\25F7\\00a0";content:"\\25F7\\00a0" / ""}',
        'html.pn-daltonico .estado-cancelado::before{content:"\\2716\\00a0";content:"\\2716\\00a0" / ""}',

        /* enlaces reconocibles sin depender del color, y foco bien visible */
        'html.pn-daltonico a:not(nav a):not([role="button"]){text-decoration:underline;text-underline-offset:3px}',
        'html.pn-daltonico :focus-visible{outline:3px solid #0072B2 !important;outline-offset:3px !important;box-shadow:0 0 0 6px #fff !important}',
        'html.pn-daltonico .pn-leyendo{outline-color:#D55E00 !important}'
    ].join("\n");

    var estilo = document.createElement("style");
    estilo.id = "pn-a11y-css";
    estilo.textContent = CSS;
    (document.head || document.documentElement).appendChild(estilo);

    document.documentElement.classList.toggle("pn-daltonico", daltonico);
    document.documentElement.classList.toggle("pn-narrador", activo);


    /* ============================================================
       VOZ
       ============================================================ */

    var ficha = 0;                 // invalida lecturas antiguas al cortar la voz
    var ultimoTexto = "";
    var ultimoMomento = 0;
    var ultimaIntro = 0;
    var esperandoGesto = false;
    var resaltado = null;
    var enEspera = false;          // hay una lectura nueva esperando su turno (40 ms tras cortar la voz)
    var colaEspera = [];           // lecturas "en cola" que deben ir detrás de ella

    function limpiar(t) {
        return String(t == null ? "" : t).replace(/\s+/g, " ").trim();
    }

    function trocear(t) {
        // Chrome corta las frases largas: se envían en trozos de ~170 caracteres
        t = t.replace(/(^|\s)(\d{1,2})\.\s/g, "$1$2, ");   // "1. Entra..." no es un fin de frase
        var frases = (t.match(/[^.!?。！？\n]+[.!?。！？]*/g) || [t]).map(function (x) { return x.trim(); }).filter(Boolean);
        var salida = [];
        frases.forEach(function (f) {
            while (f.length > 170) {
                var i = f.lastIndexOf(" ", 170);
                if (i < 60) i = 170;
                salida.push(f.slice(0, i));
                f = f.slice(i).trim();
            }
            if (f) salida.push(f);
        });
        return salida;
    }

    function elegirVoz() {
        if (!synth) return null;
        var voces = synth.getVoices() || [];
        var l = VOZ_BASE[idioma()] || "es";
        var completa = (LOCALES[idioma()] || "es-ES").toLowerCase();
        var candidatas = voces.filter(function (v) {
            var vl = String(v.lang || "").replace("_", "-").toLowerCase();
            return vl === completa || vl.indexOf(l) === 0;
        });
        candidatas.sort(function (a, b) {
            var ea = String(a.lang).replace("_", "-").toLowerCase() === completa ? 0 : 1;
            var eb = String(b.lang).replace("_", "-").toLowerCase() === completa ? 0 : 1;
            if (ea !== eb) return ea - eb;
            return (a.localService === b.localService) ? 0 : (a.localService ? -1 : 1);
        });
        return candidatas[0] || null;
    }

    function resaltar(el) {
        quitarResaltado();
        if (!el || !el.classList) return;
        el.classList.add("pn-leyendo");
        resaltado = el;
    }

    function quitarResaltado() {
        if (resaltado) { resaltado.classList.remove("pn-leyendo"); resaltado = null; }
    }

    function esperarGesto() {
        // Los navegadores no dejan hablar hasta que la persona toca la página:
        // al primer Tab, clic o toque se anuncia la página.
        if (esperandoGesto) return;
        esperandoGesto = true;
        var eventos = ["keydown", "pointerdown", "touchstart"];
        function disparar() {
            eventos.forEach(function (ev) { document.removeEventListener(ev, disparar, true); });
            esperandoGesto = false;
            if (activo) introPagina();
        }
        eventos.forEach(function (ev) { document.addEventListener(ev, disparar, true); });
    }

    /* Dice un texto.
       opciones.cola     → no interrumpe lo que se está diciendo
       opciones.forzar   → habla aunque el narrador esté desactivado (avisos de activar/desactivar)
       opciones.inmediato→ sin la pequeña espera tras cortar la voz (aviso inicial de página)
       opciones.elemento → se resalta mientras suena
       opciones.alTerminar → función al acabar */
    function hablar(texto, opciones) {

        opciones = opciones || {};
        if (!synth) return;
        if (!activo && !opciones.forzar) return;

        texto = limpiar(texto);
        if (!texto) return;

        var ahora = Date.now();
        if (texto === ultimoTexto && ahora - ultimoMomento < 500) return;   // evita repetir foco + cambio
        ultimoTexto = texto;
        ultimoMomento = ahora;

        var miFicha;
        if (!opciones.cola) {
            ficha++;
            miFicha = ficha;
            colaEspera = [];
            synth.cancel();
        } else {
            miFicha = ficha;
        }

        var partes = trocear(texto);
        var voz = elegirVoz();

        function lanzar() {
            if (miFicha !== ficha) return;       // otra lectura más nueva ha tomado el relevo
            partes.forEach(function (parte, i) {
                var u = new SpeechSynthesisUtterance(parte);
                u.lang = LOCALES[idioma()];
                if (voz) u.voice = voz;
                u.rate = VELOCIDADES[velocidad] || 1;
                u.onstart = function () {
                    if (miFicha !== ficha) return;
                    if (i === 0 && opciones.elemento) resaltar(opciones.elemento);
                };
                u.onend = function () {
                    finNarrador = Date.now();
                    if (i === partes.length - 1) {
                        if (opciones.alTerminar) opciones.alTerminar();
                    }
                };
                u.onerror = function (e) {
                    finNarrador = Date.now();
                    if (e && e.error === "not-allowed") esperarGesto();
                };
                synth.speak(u);
            });
        }

        if (opciones.cola) {
            if (enEspera) colaEspera.push(lanzar); else lanzar();
        } else if (opciones.inmediato) {
            enEspera = false;
            lanzar();
        } else {
            enEspera = true;
            setTimeout(function () {
                if (miFicha === ficha) {
                    enEspera = false;
                    lanzar();
                    var pendientes = colaEspera;
                    colaEspera = [];
                    pendientes.forEach(function (f) { f(); });
                }
            }, 40);
        }
    }

    function detener() {
        ficha++;
        finNarrador = Date.now();
        if (synth) synth.cancel();
        quitarResaltado();
    }


    /* ============================================================
       DESCRIBIR UN ELEMENTO (nombre + tipo + estado)
       ============================================================ */

    function textoDe(n) {
        return limpiar((n.innerText !== undefined ? n.innerText : n.textContent) || n.textContent);
    }

    function nombreAccesible(el) {

        var lb = el.getAttribute("aria-labelledby");
        if (lb) {
            var t = lb.split(/\s+/).map(function (id) {
                var x = document.getElementById(id);
                return x ? textoDe(x) : "";
            }).join(" ").trim();
            if (t) return t;
        }

        var al = el.getAttribute("aria-label");
        if (al) return limpiar(al);

        var tag = el.tagName.toLowerCase();

        if (tag === "input" || tag === "select" || tag === "textarea") {
            if (el.labels && el.labels.length) {
                var l = Array.prototype.map.call(el.labels, function (x) { return textoDe(x); }).join(" ").trim();
                if (l) return l;
            }
            return limpiar(el.getAttribute("placeholder") || el.title || "");
        }

        if (tag === "img") return limpiar(el.alt || el.title || "");
        if (tag === "iframe") return limpiar(el.title || "");

        var texto = textoDe(el);
        if (texto.length > 300) texto = texto.slice(0, 300) + "…";

        // "Comprar" suelto no dice nada: se añade el producto de la tarjeta
        if (tag === "button" && el.closest) {
            var tarjeta = el.closest(".card");
            var titulo = tarjeta && tarjeta.querySelector("h3");
            if (titulo) texto = (texto ? texto + ": " : "") + textoDe(titulo);
        }

        return texto || limpiar(el.title || "");
    }

    function describir(el) {

        var tag = el.tagName.toLowerCase();
        var nombre = nombreAccesible(el);
        var rol = "";
        var estados = [];
        var rolAria = el.getAttribute("role");

        if (tag === "a") {
            rol = T("rEnlace");
        } else if (tag === "button" || rolAria === "button") {
            rol = T("rBoton");
        } else if (tag === "input") {
            var tipo = (el.type || "text").toLowerCase();
            if (tipo === "checkbox") {
                rol = rolAria === "switch" ? "" : T("rCasilla");
                estados.push(el.checked ? T("eMarcada") : T("eSinMarcar"));
            } else if (tipo === "radio") {
                rol = T("rOpcion");
                estados.push(el.checked ? T("eSeleccionada") : T("eNoSel"));
            } else if (tipo === "submit" || tipo === "button" || tipo === "reset") {
                rol = T("rBoton");
                nombre = nombre || limpiar(el.value);
            } else {
                rol = tipo === "password" ? T("rPassword") : tipo === "email" ? T("rEmail") : tipo === "tel" ? T("rTel") : T("rTexto");
                if (tipo !== "password") {
                    estados.push(el.value ? T("eContiene", { v: el.value }) : T("eVacio"));
                }
            }
        } else if (tag === "select") {
            rol = T("rLista");
            var op = el.options && el.options[el.selectedIndex];
            if (op) estados.push(limpiar(op.text));
        } else if (tag === "textarea") {
            rol = T("rTexto");
            estados.push(el.value ? T("eContiene", { v: el.value }) : T("eVacio"));
        } else if (/^h[1-6]$/.test(tag)) {
            rol = T("rTitulo", { n: tag.charAt(1) });
        } else if (tag === "img") {
            if (!nombre) return "";
            rol = T("rImagen");
        } else if (tag === "iframe") {
            rol = T("rVideo");
        } else {
            return nombre;
        }

        if (el.required || el.getAttribute("aria-required") === "true") estados.push(T("eObligatorio"));
        if (el.disabled || el.getAttribute("aria-disabled") === "true") estados.push(T("eDesactivado"));

        var exp = el.getAttribute("aria-expanded");
        if (exp === "true") estados.push(T("eExpandido"));
        if (exp === "false") estados.push(T("eContraido"));

        if (rolAria === "switch" && tag === "input") {
            estados.unshift(el.checked ? T("eMarcada") : T("eSinMarcar"));
        }

        nombre = nombre.replace(/\s*[:：]\s*$/, "");

        return [nombre, rol].concat(estados).filter(Boolean).join(", ");
    }

    var SEL_INTERACTIVO = 'a[href],button,input:not([type="hidden"]),select,textarea';
    var SEL_PASAR_RATON = 'a,button,input:not([type="hidden"]),select,textarea,label,h1,h2,h3,h4,h5,h6,p,li,img[alt],iframe,.precio,[role="button"]';
    var SEL_LEER = 'h1,h2,h3,h4,p,li,label,a[href],button,input:not([type="hidden"]),select,textarea,img[alt],iframe,.precio';

    function hablarElemento(el, opciones) {
        if (el.tagName === "LABEL" && el.control) el = el.control;
        hablar(describir(el), opciones);
    }

    function visible(el) {
        if (!el.getClientRects().length) return false;
        var cs = window.getComputedStyle(el);
        return cs.visibility !== "hidden" && cs.display !== "none";
    }

    function excluido(el) {
        return !!(el.closest("#selector-a11y, #selector-idioma, .pn-saltar, [aria-hidden='true'], script, style, noscript"));
    }


    /* ============================================================
       LEER LA PÁGINA ENTERA
       ============================================================ */

    function leerPagina() {

        if (!synth) return;

        var items = Array.prototype.filter.call(document.body.querySelectorAll(SEL_LEER), function (el) {
            if (excluido(el) || !visible(el)) return false;
            var tag = el.tagName.toLowerCase();
            // texto que contiene controles: se leen los controles por separado
            if (/^(h[1-4]|p|li|label)$/.test(tag) && el.querySelector(SEL_INTERACTIVO)) return false;
            // imagen dentro de un enlace o botón: ya se lee el enlace
            if (tag === "img" && el.closest("a,button")) return false;
            return true;
        });

        var lineas = items.map(function (el) {
            return { el: (el.tagName === "LABEL" && el.control) ? el.control : el, texto: describir((el.tagName === "LABEL" && el.control) ? el.control : el) };
        }).filter(function (x) { return x.texto; });

        detener();
        var miFicha = ficha;

        var reducido = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
        var i = 0;

        function siguiente() {
            if (miFicha !== ficha) return;
            if (i >= lineas.length) {
                quitarResaltado();
                hablar(T("finPagina"), { cola: true, forzar: true });
                return;
            }
            var linea = lineas[i++];
            try { linea.el.scrollIntoView({ block: "center", behavior: reducido ? "auto" : "smooth" }); } catch (e) { }
            ultimoTexto = "";   // permite leer dos líneas iguales seguidas
            hablar(linea.texto, { cola: true, forzar: true, elemento: linea.el, alTerminar: siguiente });
        }

        siguiente();
    }


    /* ============================================================
       ACTIVAR / DESACTIVAR
       ============================================================ */

    var ui = {};

    function introPagina() {
        ultimaIntro = Date.now();
        hablar(T("intro", { titulo: limpiar(document.title) || "ProductNova" }), { forzar: true, inmediato: true });
    }

    function activarNarrador(on, desdeUsuario) {

        if (!synth) {
            if (ui.aviso) ui.aviso.hidden = false;
            if (ui.narrador) ui.narrador.checked = false;
            return;
        }

        activo = !!on;
        guardar(CLAVE_NARRADOR, activo ? "1" : "0");
        document.documentElement.classList.toggle("pn-narrador", activo);

        if (ui.narrador) ui.narrador.checked = activo;
        refrescarTextos();

        if (activo) {
            if (desdeUsuario) hablar(T("narradorOn"), { forzar: true });
            else introPagina();
        } else {
            detener();
            hablar(T("narradorOff"), { forzar: true });
        }
    }

    function activarDaltonico(on, desdeUsuario) {
        daltonico = !!on;
        guardar(CLAVE_DALTONICO, daltonico ? "1" : "0");
        document.documentElement.classList.toggle("pn-daltonico", daltonico);
        if (ui.dalto) ui.dalto.checked = daltonico;
        if (desdeUsuario) hablar(daltonico ? T("daltoOn") : T("daltoOff"));
    }


    /* ============================================================
       INTERFAZ: botón en la barra (junto al selector de idioma) y panel
       ============================================================ */

    var ICONO =
        '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="7.2" r="1.2"></circle>' +
        '<path d="M7 10.2l5 .9 5-.9"></path><path d="M12 11.1V15"></path><path d="M12 15l-2.4 4.2"></path><path d="M12 15l2.4 4.2"></path></svg>';

    function crearInterfaz() {

        if (document.getElementById("selector-a11y")) return;

        /* enlace de salto: primer elemento al que llega Tab */
        var saltar = document.createElement("button");
        saltar.type = "button";
        saltar.className = "pn-saltar";
        saltar.id = "pn-saltar";
        saltar.addEventListener("click", function () { activarNarrador(!activo, true); });
        document.body.insertBefore(saltar, document.body.firstChild);
        ui.saltar = saltar;

        var caja = document.createElement("div");
        caja.id = "selector-a11y";

        caja.innerHTML =
            '<button type="button" id="a11y-boton" aria-haspopup="dialog" aria-expanded="false" aria-controls="a11y-panel">' +
                ICONO + '<span class="a11y-punto" aria-hidden="true"></span></button>' +
            '<div id="a11y-panel" role="dialog" aria-labelledby="a11y-titulo" hidden>' +
                '<h2 id="a11y-titulo"></h2>' +

                '<div class="a11y-fila">' +
                    '<label class="a11y-sw"><input type="checkbox" role="switch" id="a11y-narrador" aria-describedby="a11y-narrador-ayuda"><span id="a11y-narrador-txt"></span></label>' +
                    '<p class="a11y-ayuda" id="a11y-narrador-ayuda"></p>' +
                    '<p class="a11y-aviso" id="a11y-aviso" role="alert" hidden></p>' +
                '</div>' +

                '<div class="a11y-fila">' +
                    '<label class="a11y-lbl" for="a11y-vel" id="a11y-vel-txt"></label>' +
                    '<select id="a11y-vel"></select>' +
                    '<div class="a11y-botones">' +
                        '<button type="button" id="a11y-leer"></button>' +
                        '<button type="button" id="a11y-parar"></button>' +
                    '</div>' +
                '</div>' +

                '<div class="a11y-fila">' +
                    '<label class="a11y-sw"><input type="checkbox" role="switch" id="a11y-dalto" aria-describedby="a11y-dalto-ayuda"><span id="a11y-dalto-txt"></span></label>' +
                    '<p class="a11y-ayuda" id="a11y-dalto-ayuda"></p>' +
                '</div>' +

                '<p class="a11y-atajos" id="a11y-atajos"></p>' +
            '</div>';

        // Dentro de la barra de navegación (junto al idioma) o, si no hay barra, flotante arriba a la derecha
        var idiomaCaja = document.getElementById("selector-idioma");
        var nav = document.querySelector("nav");

        if (nav) {
            if (idiomaCaja && idiomaCaja.parentNode === nav) nav.insertBefore(caja, idiomaCaja);
            else nav.appendChild(caja);
        } else {
            caja.classList.add("flotante");
            document.body.appendChild(caja);
        }

        ui.caja = caja;
        ui.boton = caja.querySelector("#a11y-boton");
        ui.panel = caja.querySelector("#a11y-panel");
        ui.narrador = caja.querySelector("#a11y-narrador");
        ui.dalto = caja.querySelector("#a11y-dalto");
        ui.vel = caja.querySelector("#a11y-vel");
        ui.aviso = caja.querySelector("#a11y-aviso");

        ["lenta", "normal", "rapida"].forEach(function (v) {
            var o = document.createElement("option");
            o.value = v;
            ui.vel.appendChild(o);
        });
        ui.vel.value = velocidad;

        ui.narrador.checked = activo;
        ui.dalto.checked = daltonico;

        if (!synth) {
            ui.narrador.disabled = true;
            ui.vel.disabled = true;
            caja.querySelector("#a11y-leer").disabled = true;
            caja.querySelector("#a11y-parar").disabled = true;
            ui.aviso.hidden = false;
        }

        ui.narrador.addEventListener("change", function () { activarNarrador(ui.narrador.checked, true); });
        ui.dalto.addEventListener("change", function () { activarDaltonico(ui.dalto.checked, true); });
        ui.vel.addEventListener("change", function () {
            velocidad = ui.vel.value;
            guardar(CLAVE_VELOCIDAD, velocidad);
            hablar(limpiar(ui.vel.options[ui.vel.selectedIndex].text), { forzar: true });
        });
        caja.querySelector("#a11y-leer").addEventListener("click", function () { cerrar(); leerPagina(); });
        caja.querySelector("#a11y-parar").addEventListener("click", detener);

        ui.boton.addEventListener("click", function (e) {
            e.stopPropagation();
            ui.panel.hidden ? abrir() : cerrar();
        });

        document.addEventListener("click", function (e) { if (!caja.contains(e.target)) cerrar(); });

        caja.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && !ui.panel.hidden) { e.stopPropagation(); cerrar(); ui.boton.focus(); }
        });

        window.addEventListener("resize", function () { if (!ui.panel.hidden) colocarPanel(); posicionarFlotante(); });

        refrescarTextos();
        posicionarFlotante();
    }

    function abrir() {
        ui.panel.hidden = false;
        ui.boton.setAttribute("aria-expanded", "true");
        colocarPanel();
        ui.narrador.focus();
    }

    function cerrar() {
        if (!ui.panel || ui.panel.hidden) return;
        ui.panel.hidden = true;
        ui.boton.setAttribute("aria-expanded", "false");
    }

    function colocarPanel() {
        // En móvil el panel es fijo: se alinea justo bajo el botón
        if (window.matchMedia && matchMedia("(max-width:600px)").matches) {
            ui.panel.style.top = (ui.boton.getBoundingClientRect().bottom + 8) + "px";
        } else {
            ui.panel.style.top = "";
        }
    }

    function posicionarFlotante() {
        // Sin barra de navegación, se coloca a la izquierda del selector de idioma
        if (!ui.caja || !ui.caja.classList.contains("flotante")) return;
        var idiomaCaja = document.getElementById("selector-idioma");
        if (!idiomaCaja) return;
        var derecha = parseFloat(window.getComputedStyle(idiomaCaja).right) || 16;
        ui.caja.style.right = (derecha + idiomaCaja.offsetWidth + 8) + "px";
    }

    function refrescarTextos() {

        if (!ui.caja) return;

        ui.boton.setAttribute("aria-label", T("boton"));
        ui.boton.setAttribute("title", T("boton"));
        ui.caja.querySelector("#a11y-titulo").textContent = T("titulo");
        ui.caja.querySelector("#a11y-narrador-txt").textContent = T("narrador");
        ui.caja.querySelector("#a11y-narrador-ayuda").textContent = T("narradorAyuda");
        ui.caja.querySelector("#a11y-vel-txt").textContent = T("velocidad");
        ui.caja.querySelector("#a11y-leer").textContent = T("leerPagina");
        ui.caja.querySelector("#a11y-parar").textContent = T("parar");
        ui.caja.querySelector("#a11y-dalto-txt").textContent = T("dalto");
        ui.caja.querySelector("#a11y-dalto-ayuda").textContent = T("daltoAyuda");
        ui.caja.querySelector("#a11y-atajos").textContent = T("atajos");
        ui.aviso.textContent = T("sinVoz");

        Array.prototype.forEach.call(ui.vel.options, function (o) { o.textContent = T(o.value); });

        if (ui.saltar) ui.saltar.textContent = activo ? T("saltarOn") : T("saltarOff");

        posicionarFlotante();
    }


    /* ============================================================
       EVENTOS DEL NARRADOR
       ============================================================ */

    var temporizadorRaton = null;
    var ultimoRaton = null;

    function engancharEventos() {

        // Teclado: lo que recibe el foco
        document.addEventListener("focusin", function (e) {
            if (!activo) return;
            var el = e.target;
            if (!el || el === document.body || el === document.documentElement || el.nodeType !== 1) return;
            if (el.id === "pn-saltar") { hablar(textoDe(el)); return; }
            // justo después del aviso inicial se encadena en vez de cortarlo
            hablarElemento(el, { cola: Date.now() - ultimaIntro < 2500 });
        }, true);

        // Casillas, opciones y listas: nuevo estado
        document.addEventListener("change", function (e) {
            if (!activo) return;
            var el = e.target;
            if (el && el.matches && el.matches('input[type="checkbox"],input[type="radio"],select')) hablarElemento(el);
        }, true);

        // Botones que cambian de texto al pulsarlos ("Comprar" → "Añadido ✓")
        document.addEventListener("click", function (e) {
            if (!activo) return;
            var b = e.target.closest ? e.target.closest("button") : null;
            if (!b || b.closest("#selector-a11y") || b.closest("#selector-idioma") || b.id === "pn-saltar") return;
            var antes = describir(b);
            setTimeout(function () {
                var despues = describir(b);
                if (despues !== antes) hablar(despues);
            }, 150);
        }, true);

        // Ratón: lo que se señala (con una pequeña espera para no hablar al pasar de largo)
        document.addEventListener("mouseover", function (e) {
            if (!activo) return;
            var el = e.target.closest ? e.target.closest(SEL_PASAR_RATON) : null;
            clearTimeout(temporizadorRaton);
            if (!el) { ultimoRaton = null; return; }
            if (el === ultimoRaton || excluido(el)) return;
            temporizadorRaton = setTimeout(function () {
                ultimoRaton = el;
                var tag = el.tagName;
                if (tag === "LABEL" && el.control) el = el.control;
                hablar(describir(el), { elemento: el });
            }, 450);
        });

        // Avisos (errores, éxito...) que aparecen en regiones aria-live / role="alert" / role="status"
        var observador = new MutationObserver(function (cambios) {
            if (!activo) return;
            var regiones = [];
            cambios.forEach(function (c) {
                // el resaltado de lectura cambia clases: no es un aviso
                if (c.type === "attributes" && (c.target === resaltado || c.target.classList.contains("pn-leyendo"))) return;
                var n = c.target.nodeType === 3 ? c.target.parentElement : c.target;
                var r = n && n.closest ? n.closest('[role="alert"],[role="status"],[aria-live]') : null;
                if (r && regiones.indexOf(r) < 0 && !r.closest("#selector-a11y")) regiones.push(r);
            });
            regiones.forEach(function (r) {
                if (!visible(r)) return;
                var t = textoDe(r);
                if (t) hablar(t, { cola: r.getAttribute("aria-live") === "polite" });
            });
        });
        observador.observe(document.body, {
            subtree: true, childList: true, characterData: true,
            attributes: true, attributeFilter: ["class"]
        });

        // Atajos de teclado
        document.addEventListener("keydown", function (e) {

            if (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey) {
                if (e.code === "KeyN") { e.preventDefault(); activarNarrador(!activo, true); return; }
                if (e.code === "KeyL") {
                    e.preventDefault();
                    if (!activo) activarNarrador(true, true);
                    leerPagina();
                    return;
                }
            }

            if (e.key === "Escape" && synth && (synth.speaking || synth.pending)) detener();
        });

        // Cambio de idioma: se avisa en el idioma nuevo (no al cargar ni al actualizar el cambio de moneda)
        var primera = true;
        document.addEventListener("idiomaCambiado", function (e) {
            refrescarTextos();
            if (e && e.detail && e.detail.soloTasas) return;
            if (primera) { primera = false; return; }
            hablar(T("idiomaCambiado"));
        });
    }


    /* ============================================================
       INICIO
       ============================================================ */

    window.Accesibilidad = {
        decir: function (texto) { hablar(texto, { cola: true }); },
        leerPagina: leerPagina,
        detener: detener,
        get activo() { return activo; },
        get daltonico() { return daltonico; }
    };

    function iniciar() {
        crearInterfaz();
        engancharEventos();
        if (synth) { try { synth.getVoices(); } catch (e) { } }   // Chrome las carga en la primera consulta
        if (activo) introPagina();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar);
    } else {
        iniciar();
    }

})();
