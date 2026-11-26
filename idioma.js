/* ============================================================
   ProductNova · idioma.js
   ------------------------------------------------------------
   Sistema de idiomas de toda la web: Español · English · 中文

   - Selector de idioma arriba a la derecha (con o sin sesión).
   - Idioma automático según la ubicación del visitante
     (país por IP) y, si falla, según el idioma del navegador.
   - Si el cliente elige un idioma a mano, se respeta siempre.
   - Funciona en todas las páginas: basta con cargar este
     archivo ANTES que conexion_db.js:

         <script src="idioma.js"></script>
         <script src="conexion_db.js"></script>

   Para traducir un elemento de una página nueva:
     data-i18n="clave"              → texto
     data-i18n-html="clave"         → texto con HTML (<span>...)
     data-i18n-placeholder="clave"  → placeholder
     data-i18n-title="clave"        → atributo title
     data-i18n-alt="clave"          → atributo alt
     data-i18n-producto="Nombre ES" → nombre de producto/servicio
     data-i18n-desc="p1"            → descripción por código
   ============================================================ */

(function () {

    /* ---------- AJUSTES ---------- */

    // Pon false si NO quieres consultar el país por IP
    // (entonces solo se usa el idioma del navegador).
    const USAR_GEOLOCALIZACION_IP = true;

    const SERVICIOS_GEO = [
        { url: "https://api.country.is/",        leer: (r) => r.json().then((j) => j.country) },
        { url: "https://ipapi.co/country/",      leer: (r) => r.text().then((t) => t.trim()) }
    ];

    /* ---------- MONEDA ----------
       Los precios de la base de datos están en EUROS. Aquí solo se
       CONVIERTEN PARA MOSTRAR según el idioma:
           Español → euro (EUR) · English → dólar (USD) · 中文 → yuan (CNY)
       El pedido se sigue calculando y cobrando en euros en el servidor.

       TASAS_FIJAS son los valores de reserva (1 € = x moneda). Si
       USAR_TIPO_CAMBIO_ONLINE es true, se intenta actualizar el cambio
       una vez al día; si falla, se usan estos valores. Ajústalos a tu gusto. */

    const MONEDAS = {
        es: { codigo: "EUR", locale: "es-ES" },
        en: { codigo: "USD", locale: "en-US" },
        zh: { codigo: "CNY", locale: "zh-CN" }
    };
    const TASAS_FIJAS = { EUR: 1, USD: 1.08, CNY: 7.8 };
    const USAR_TIPO_CAMBIO_ONLINE = true;
    const URL_TIPO_CAMBIO = "https://open.er-api.com/v6/latest/EUR";
    const CLAVE_TASAS = "pn_tasas";
    const HORAS_CACHE_TASAS = 24;

    const CLAVE_MANUAL = "pn_idioma_manual";   // elección del cliente
    const CLAVE_AUTO   = "pn_idioma_auto";     // detección automática (caduca)
    const DIAS_CACHE   = 7;

    const IDIOMAS = {
        es: { nombre: "Español", corto: "ES", html: "es",    locale: "es-ES" },
        en: { nombre: "English", corto: "EN", html: "en",    locale: "en-US" },
        zh: { nombre: "中文",     corto: "中文", html: "zh-CN", locale: "zh-CN" }
    };
    const ORDEN = ["es", "en", "zh"];

    const PAISES_ZH = ["CN", "HK", "MO", "TW"];
    const PAISES_EN = ["US", "GB", "IE", "AU", "NZ", "CA", "ZA"];
    const PAISES_ES = ["ES", "MX", "AR", "CO", "CL", "PE", "VE", "EC", "GT", "CU", "BO", "DO",
                       "HN", "PY", "SV", "NI", "CR", "PA", "UY", "PR", "GQ"];


    /* ============================================================
       DICCIONARIO   clave: [español, English, 中文]
       ============================================================ */

    const K = {

        /* ---- navegación (index y cuenta) ---- */
        "nav.logoAlt":   ["Logo de la empresa", "Company logo", "公司标志"],
        "nav.sobre":     ["Sobre nosotros", "About us", "关于我们"],
        "nav.productos": ["Productos ▾", "Products ▾", "产品 ▾"],
        "nav.servicios": ["Servicios ▾", "Services ▾", "服务 ▾"],
        "nav.login":     ["Iniciar sesión", "Log in", "登录"],
        "nav.miCuenta":  ["Mi cuenta", "My account", "我的账户"],
        "gen.p1": ["Producto P1", "Product P1", "产品 P1"],
        "gen.p2": ["Producto P2", "Product P2", "产品 P2"],
        "gen.p3": ["Producto P3", "Product P3", "产品 P3"],
        "gen.p4": ["Producto P4", "Product P4", "产品 P4"],
        "gen.p5": ["Producto P5", "Product P5", "产品 P5"],
        "gen.s1": ["Servicio S1", "Service S1", "服务 S1"],
        "gen.s2": ["Servicio S2", "Service S2", "服务 S2"],
        "gen.s3": ["Servicio S3", "Service S3", "服务 S3"],
        "gen.s4": ["Servicio S4", "Service S4", "服务 S4"],
        "gen.s5": ["Servicio S5", "Service S5", "服务 S5"],

        /* ---- cesta ---- */
        "cesta.ver":      ["Ver cesta", "View cart", "查看购物车"],
        "cesta.titulo":   ["Tu cesta", "Your cart", "您的购物车"],
        "cesta.vacia":    ["Tu cesta está vacía.", "Your cart is empty.", "您的购物车是空的。"],
        "cesta.total":    ["Total", "Total", "合计"],
        "cesta.finalizar":["Finalizar compra", "Checkout", "去结算"],
        "cesta.quitar":   ["Quitar", "Remove", "移除"],

        /* ---- index ---- */
        "index.title":     ["ProductNova | Electrodomésticos y Servicios", "ProductNova | Home Appliances & Services", "ProductNova | 家用电器与服务"],
        "index.heroTag":   ["En ProductNova encontrarás:", "At ProductNova you'll find:", "在 ProductNova，您可以找到："],
        "index.heroH1":    ["Electrodomésticos para <span>cada rincón de tu hogar.</span>",
                            "Home appliances for <span>every corner of your home.</span>",
                            "家用电器，<span>为您家中的每个角落而设。</span>"],
        "index.heroP":     ["Descubre nuestra selección de electrodomésticos y servicios de instalación y mantenimiento, pensados para hacer tu día a día más cómodo y eficiente.",
                            "Discover our selection of home appliances and installation and maintenance services, designed to make your everyday life more comfortable and efficient.",
                            "探索我们精选的家用电器以及安装和保养服务，让您的日常生活更舒适、更高效。"],
        "index.secProd":   ["Productos", "Products", "产品"],
        "index.secProdP":  ["Electrodomésticos de calidad para tu cocina y tu hogar.", "Quality appliances for your kitchen and home.", "为您的厨房和家居精选的优质电器。"],
        "index.secServ":   ["Servicios", "Services", "服务"],
        "index.secServP":  ["Instalación, reparación y mantenimiento de tus electrodomésticos.", "Installation, repair and maintenance of your appliances.", "为您的电器提供安装、维修和保养服务。"],
        "index.comprar":   ["Comprar", "Buy", "立即购买"],
        "index.contratar": ["Contratar", "Order now", "立即订购"],
        "index.anadido":   ["Añadido ✓", "Added ✓", "已添加 ✓"],
        "index.alertaLogin": ["Debes iniciar sesión para añadir productos a la cesta.", "You must log in to add products to your cart.", "请先登录，才能将商品加入购物车。"],
        "index.footerP":   ["Electrodomésticos y servicio técnico para tu hogar.", "Home appliances and technical service for your home.", "为您的家提供家用电器和技术服务。"],
        "index.copy":      ["© 2026 ProductNova. Todos los derechos reservados.", "© 2026 ProductNova. All rights reserved.", "© 2026 ProductNova。保留所有权利。"],

        /* ---- sobre nosotros ---- */
        "sobre.title": ["Sobre nosotros | ProductNova", "About us | ProductNova", "关于我们 | ProductNova"],
        "sobre.navAria": ["Principal", "Main", "主导航"],
        "sobre.logoAria": ["ProductNova, inicio", "ProductNova, home", "ProductNova，返回首页"],
        "sobre.menuProductos": ["Productos", "Products", "产品"],
        "sobre.menuServicios": ["Servicios", "Services", "服务"],
        "sobre.carritoAria": ["Carrito", "Cart", "购物车"],
        "sobre.heroH1": ["Electrodomésticos y servicios para <span>tu hogar</span>", "Home appliances and services for <span>your home</span>", "为<span>您的家</span>提供家用电器与服务"],
        "sobre.heroP": ["En ProductNova vendemos electrodomésticos de calidad y nos encargamos de su instalación, reparación y mantenimiento, para que tu día a día sea más cómodo y eficiente.", "At ProductNova we sell quality home appliances and take care of their installation, repair and maintenance, so your everyday life is more comfortable and efficient.", "ProductNova 销售优质家用电器，并负责安装、维修和保养，让您的日常生活更舒适、更高效。"],
        "sobre.quienesH2": ["Quiénes somos", "Who we are", "我们是谁"],
        "sobre.quienesP1": ["ProductNova es una tienda de electrodomésticos con atención en tres sucursales: Madrid, Cádiz y Lima. Seleccionamos productos para la cocina y el hogar, y los acompañamos con servicios que cubren lo que pasa después de la compra.", "ProductNova is a home appliance store with three branches: Madrid, Cádiz and Lima. We select products for the kitchen and the home, and back them with services that cover what happens after the purchase.", "ProductNova 是一家家用电器商店，在马德里、加的斯和利马设有三家分店。我们精选厨房和家居产品，并提供覆盖购买之后各个环节的服务。"],
        "sobre.quienesP2": ["Creemos que comprar un electrodoméstico no termina al pagarlo. Por eso ofrecemos instalación a domicilio, reparación, mantenimiento anual, garantía extendida y soporte técnico 24/7.", "We believe buying an appliance doesn't end when you pay for it. That's why we offer home installation, repair, annual maintenance, extended warranty and 24/7 technical support.", "我们认为，购买电器并不会在付款之后结束。因此我们提供上门安装、维修、年度保养、延长保修和 24 小时技术支持。"],
        "sobre.verProductos": ["Ver productos", "View products", "查看产品"],
        "sobre.panelAria": ["Lo que ofrecemos", "What we offer", "我们提供的内容"],
        "sobre.fam": ["5 familias de producto", "5 product families", "5 大产品类别"],
        "sobre.famSub": ["Frigoríficos, lavadoras, hornos, microondas y lavavajillas", "Fridges, washing machines, ovens, microwaves and dishwashers", "冰箱、洗衣机、烤箱、微波炉和洗碗机"],
        "sobre.serv5": ["5 servicios a tu lado", "5 services by your side", "5 项贴心服务"],
        "sobre.serv5Sub": ["Desde la instalación hasta el soporte técnico", "From installation to technical support", "从安装到技术支持"],
        "sobre.suc3": ["3 sucursales", "3 branches", "3 家分店"],
        "sobre.suc3Sub": ["Madrid, Cádiz y Lima", "Madrid, Cádiz and Lima", "马德里、加的斯和利马"],
        "sobre.valoresH2": ["Lo que nos importa", "What matters to us", "我们重视什么"],
        "sobre.valoresSub": ["Tres ideas que guían cómo trabajamos.", "Three ideas that guide how we work.", "指引我们工作方式的三个理念。"],
        "sobre.calidad": ["Calidad", "Quality", "品质"],
        "sobre.calidadP": ["Elegimos electrodomésticos con prestaciones claras, como el motor inverter silencioso de nuestra lavadora o la tecnología No Frost de nuestro frigorífico.", "We choose appliances with clear features, such as the quiet inverter motor of our washing machine or the No Frost technology of our fridge.", "我们挑选性能明确的电器，例如洗衣机的静音变频电机和冰箱的无霜技术。"],
        "sobre.segura": ["Compra segura", "Secure purchase", "安全购物"],
        "sobre.seguraP": ["Los pagos se hacen con Stripe: tus datos de pago los procesa directamente Stripe y no pasan por nuestra tienda.", "Payments are made with Stripe: your payment details are processed directly by Stripe and never go through our store.", "付款通过 Stripe 完成：您的支付信息由 Stripe 直接处理，不会经过我们的商店。"],
        "sobre.atencion": ["Atención continua", "Ongoing support", "持续服务"],
        "sobre.atencionP": ["Tenemos soporte técnico 24/7 y servicio a domicilio, para resolver cualquier duda o avería sin que tengas que desplazarte.", "We offer 24/7 technical support and home service, to solve any question or breakdown without you having to travel.", "我们提供 24 小时技术支持和上门服务，无需您出门即可解决任何疑问或故障。"],
        "sobre.servH2": ["Nuestros servicios", "Our services", "我们的服务"],
        "sobre.servSub": ["Cuidamos tu electrodoméstico durante toda su vida útil.", "We look after your appliance throughout its whole lifespan.", "我们在电器的整个使用寿命内为您提供呵护。"],
        "sobre.dondeH2": ["Dónde estamos", "Where we are", "我们在哪里"],
        "sobre.dondeSub": ["Atendemos desde tres sucursales.", "We serve you from three branches.", "我们通过三家分店为您服务。"],
        "sobre.madrid": ["Madrid", "Madrid", "马德里"],
        "sobre.cadiz": ["Cádiz", "Cádiz", "加的斯"],
        "sobre.lima": ["Lima", "Lima", "利马"],
        "sobre.sucMadrid": ["Sucursal en Madrid.", "Branch in Madrid.", "马德里分店。"],
        "sobre.sucCadiz": ["Sucursal en Cádiz.", "Branch in Cádiz.", "加的斯分店。"],
        "sobre.sucLima": ["Sucursal en Lima.", "Branch in Lima.", "利马分店。"],
        "sobre.ctaH2": ["Encuentra el electrodoméstico que necesitas", "Find the appliance you need", "找到您需要的电器"],
        "sobre.ctaP": ["Mira el catálogo y compra con pago seguro mediante Stripe.", "Browse the catalogue and buy with secure payment through Stripe.", "浏览商品目录，并通过 Stripe 安全付款。"],
        "sobre.copy": ["© 2026 ProductNova · Todos los derechos reservados.", "© 2026 ProductNova · All rights reserved.", "© 2026 ProductNova · 保留所有权利。"],

        /* ---- login ---- */
        "login.title":     ["ProductNova | Iniciar sesión", "ProductNova | Log in", "ProductNova | 登录"],
        "login.logoAlt":   ["Logo de ProductNova", "ProductNova logo", "ProductNova 标志"],
        "login.tagline":   ["Soluciones tecnológicas para empresas", "Technology solutions for businesses", "面向企业的技术解决方案"],
        "login.bienvenido":["Bienvenido", "Welcome", "欢迎"],
        "login.sub":       ["Inicia sesión para acceder a tu cuenta", "Log in to access your account", "登录以访问您的账户"],
        "login.usuario":   ["Usuario", "Username", "用户名"],
        "login.phUsuario": ["Introduce tu usuario", "Enter your username", "请输入用户名"],
        "login.password":  ["Contraseña", "Password", "密码"],
        "login.phPassword":["Introduce tu contraseña", "Enter your password", "请输入密码"],
        "login.mostrar":   ["Mostrar", "Show", "显示"],
        "login.ocultar":   ["Ocultar", "Hide", "隐藏"],
        "login.recordarme":["Recordarme", "Remember me", "记住我"],
        "login.olvido":    ["¿Has olvidado tu contraseña?", "Forgot your password?", "忘记密码？"],
        "login.entrar":    ["Iniciar sesión", "Log in", "登录"],
        "login.o":         ["o", "or", "或"],
        "login.sinCuenta": ["¿No tienes cuenta?", "Don't have an account?", "还没有账户？"],
        "login.crearUna":  ["Crear una", "Create one", "立即注册"],
        "login.volver":    ["← Volver a la página principal", "← Back to the home page", "← 返回首页"],
        "login.regTitulo": ["Crear cuenta", "Create account", "创建账户"],
        "login.regSub":    ["Regístrate para comprar y hacer seguimiento de tus pedidos", "Sign up to shop and track your orders", "注册后即可购物并跟踪您的订单"],
        "login.phRegUsuario": ["Elige un nombre de usuario", "Choose a username", "请设置用户名"],
        "login.ayudaUsuario": ["Mínimo 3 caracteres. No podrá repetirse.", "At least 3 characters. It must be unique.", "至少 3 个字符，且不能与他人重复。"],
        "login.nombre":    ["Nombre completo", "Full name", "姓名"],
        "login.phNombre":  ["Ej: Juan Pérez García", "e.g. John Smith", "例如：张伟"],
        "login.email":     ["Correo electrónico", "Email address", "电子邮箱"],
        "login.phEmail":   ["tucorreo@ejemplo.com", "you@example.com", "name@example.com"],
        "login.phReg6":    ["Mínimo 6 caracteres", "At least 6 characters", "至少 6 个字符"],
        "login.repite":    ["Repite la contraseña", "Repeat password", "确认密码"],
        "login.phRepite":  ["Vuelve a escribirla", "Type it again", "请再次输入"],
        "login.yaCuenta":  ["¿Ya tienes cuenta?", "Already have an account?", "已有账户？"],
        "login.copy":      ["© 2026 ProductNova · Todos los derechos reservados.", "© 2026 ProductNova · All rights reserved.", "© 2026 ProductNova · 保留所有权利。"],
        "login.comprobando":["Comprobando...", "Checking...", "验证中……"],
        "login.bienvenidoNombre": ["Bienvenido, {nombre}. Accediendo...", "Welcome, {nombre}. Signing you in...", "欢迎您，{nombre}。正在登录……"],
        "login.errorCredenciales":["Usuario o contraseña incorrectos.", "Incorrect username or password.", "用户名或密码错误。"],
        "login.noCoinciden":["Las contraseñas no coinciden.", "Passwords do not match.", "两次输入的密码不一致。"],
        "login.creando":   ["Creando cuenta...", "Creating account...", "正在创建账户……"],
        "login.creadaAcceso":["Cuenta creada. Accediendo...", "Account created. Signing you in...", "账户已创建，正在登录……"],
        "login.creadaLogin":["Cuenta creada. Ya puedes iniciar sesión.", "Account created. You can now log in.", "账户已创建，现在可以登录了。"],
        "login.olvidoAlerta":["Para restablecer tu contraseña, contacta con soporte@productnova.com.\n\nUn administrador puede cambiarla con la función fn_cambiar_password.",
                              "To reset your password, contact soporte@productnova.com.\n\nAn administrator can change it using the fn_cambiar_password function.",
                              "如需重置密码，请联系 soporte@productnova.com。\n\n管理员可通过 fn_cambiar_password 函数为您修改密码。"],

        /* ---- pagos ---- */
        "pagos.title":     ["ProductNova | Checkout Seguro", "ProductNova | Secure Checkout", "ProductNova | 安全结算"],
        "pagos.seguro":    ["Pago 100% Seguro y Encriptado", "100% Secure, Encrypted Payment", "100% 安全加密支付"],
        "pagos.detalles":  ["Detalles de Envío y Pago", "Shipping and Payment Details", "收货与支付信息"],
        "pagos.nombre":    ["Nombre Completo", "Full Name", "收货人姓名"],
        "pagos.direccion": ["Dirección de Entrega", "Delivery Address", "收货地址"],
        "pagos.phDireccion":["Calle, Número, Piso, Ciudad, Código Postal", "Street, Number, Floor, City, Postcode", "街道、门牌号、楼层、城市、邮政编码"],
        "pagos.metodo":    ["Selecciona tu método de pago", "Select your payment method", "请选择支付方式"],
        "pagos.infoPaypal":["Serás redirigido a la plataforma segura de PayPal para autorizar tu compra. No almacenamos tus datos financieros.",
                            "You will be redirected to PayPal's secure platform to authorise your purchase. We do not store your financial data.",
                            "您将被重定向到 PayPal 安全平台以授权此次购买。我们不会存储您的财务信息。"],
        "pagos.bz1":       ["1. Entra en la app de tu banco.", "1. Open your bank's app.", "1. 打开您的银行 App。"],
        "pagos.bz2":       ["2. Envía el total mediante Bizum al siguiente número:", "2. Send the total via Bizum to the following number:", "2. 通过 Bizum 将总金额转至以下号码："],
        "pagos.bz3":       ["3. Indica tu nombre en el concepto.", "3. Put your name in the payment reference.", "3. 在备注中填写您的姓名。"],
        "pagos.bzConfirma":["Confirma tu teléfono para validar el pago:", "Confirm your phone number to validate the payment:", "请确认您的手机号码以验证付款："],
        "pagos.phTel":     ["Ej: 612 345 678", "e.g. 612 345 678", "例如：612 345 678"],
        "pagos.btnPaypal": ["Pagar con PayPal", "Pay with PayPal", "使用 PayPal 支付"],
        "pagos.btnBizum":  ["Confirmar pago Bizum", "Confirm Bizum payment", "确认 Bizum 支付"],
        "pagos.volver":    ["← Volver a la tienda", "← Back to the shop", "← 返回商店"],
        "pagos.resumen":   ["Resumen del Pedido", "Order Summary", "订单摘要"],
        "pagos.articulos": ["Artículos de tu cesta", "Items in your cart", "购物车中的商品"],
        "pagos.calculando":["Calculando...", "Calculating...", "计算中……"],
        "pagos.envio":     ["Gastos de envío", "Shipping", "运费"],
        "pagos.gratis":    ["Gratis", "Free", "免费"],
        "pagos.totalPagar":["Total a pagar", "Total to pay", "应付总额"],
        "pagos.errTelefono":["Debes introducir tu teléfono para verificar el Bizum.", "You must enter your phone number to verify the Bizum payment.", "请填写手机号码以验证 Bizum 支付。"],
        "pagos.okBizum":   ["Pedido #{id} registrado. Verificaremos tu Bizum en breve.", "Order #{id} registered. We will verify your Bizum payment shortly.", "订单 #{id} 已提交。我们将尽快核实您的 Bizum 付款。"],
        "pagos.okCompra":  ["¡Compra confirmada! Pedido #{id} por {total}.", "Purchase confirmed! Order #{id} for {total}.", "购买成功！订单 #{id}，金额 {total}。"],
        "pagos.redirigiendo":["Redirigiendo...", "Redirecting...", "正在跳转……"],
        "pagos.grupoMetodos":["Métodos de pago disponibles", "Available payment methods", "可用的支付方式"],
        "pagos.infoAlipay":[
            "Serás redirigido a Alipay (支付宝) para autorizar el pago. Puedes pagar con tu saldo o con una tarjeta vinculada.",
            "You will be redirected to Alipay to authorise the payment. You can pay with your balance or a linked card.",
            "您将跳转至支付宝授权付款，可使用账户余额或已绑定的银行卡支付。"],
        "pagos.infoApplePay":[
            "Confirma el pago con Face ID, Touch ID o el código de tu dispositivo. Apple Pay no comparte con el comercio el número real de tu tarjeta.",
            "Confirm the payment with Face ID, Touch ID or your device passcode. Apple Pay does not share your real card number with the merchant.",
            "请使用 Face ID、Touch ID 或设备密码确认付款。Apple Pay 不会向商家提供您的真实卡号。"],
        "pagos.btnAlipay":  ["Pagar con Alipay", "Pay with Alipay", "使用支付宝支付"],
        "pagos.btnApplePay":["Pagar con Apple Pay", "Pay with Apple Pay", "使用 Apple Pay 支付"],
        "pagos.tarjeta":    ["Tarjeta", "Card", "银行卡"],
        "pagos.btnStripe":  ["Pagar con tarjeta", "Pay by card", "银行卡支付"],
        "pagos.infoStripe":[
            "Serás redirigido a la página segura de Stripe para introducir los datos de tu tarjeta y pagar. Nosotros no vemos ni almacenamos los datos de tu tarjeta.",
            "You will be redirected to Stripe's secure page to enter your card details and pay. We never see or store your card details.",
            "您将被重定向到 Stripe 安全页面填写银行卡信息并付款。我们不会看到或存储您的银行卡信息。"],
        "pagos.stripeRedir":[
            "Redirigiendo a Stripe para completar el pago…",
            "Redirecting to Stripe to complete the payment…",
            "正在跳转到 Stripe 完成付款……"],
        "pagos.errStripe":[
            "No se ha podido iniciar el pago con tarjeta. Inténtalo de nuevo en unos minutos.",
            "Could not start the card payment. Please try again in a few minutes.",
            "无法启动银行卡支付，请几分钟后重试。"],
        "pagos.errStripeConfig":[
            "El pago con tarjeta aún no está configurado en esta web (falta la dirección de la función de Stripe).",
            "Card payment is not yet set up on this site (the Stripe function address is missing).",
            "本网站尚未配置银行卡支付（缺少 Stripe 函数地址）。"],
        "pagos.pagoCancelado":[
            "Has cancelado el pago con tarjeta. No se te ha cobrado nada.",
            "You cancelled the card payment. You have not been charged.",
            "您已取消银行卡支付，未产生任何扣款。"],
        "cuenta.pagoOk":[
            "¡Pago recibido! Tu pedido aparecerá en la lista en unos instantes.",
            "Payment received! Your order will appear in the list in a few moments.",
            "已收到付款！您的订单将在片刻后显示在列表中。"],
        "pagos.errTelefonoFormato":[
            "Introduce un móvil español válido: 9 dígitos que empiecen por 6 o 7 (puedes añadir +34).",
            "Enter a valid Spanish mobile number: 9 digits starting with 6 or 7 (you may add +34).",
            "请输入有效的西班牙手机号码：以 6 或 7 开头的 9 位数字（可加 +34）。"],
        "pagos.errMetodo":[
            "Este método de pago no está disponible en este idioma.",
            "This payment method is not available in this language.",
            "此支付方式在当前语言下不可用。"],
        "pagos.notaMoneda":[
            "",
            "Amounts are shown in US dollars as an estimate. The order is processed and charged in euros: {eur}.",
            "金额以人民币显示，仅供参考。订单以欧元结算并扣款：{eur}。"],

        /* ---- vídeo (index) ---- */
        "index.videoTitulo": ["Míralo en acción", "See it in action", "视频演示"],
        "index.videoP":      ["Descubre ProductNova en vídeo.", "Discover ProductNova on video.", "通过视频了解 ProductNova。"],
        "index.videoIframe": ["Vídeo de YouTube de ProductNova", "ProductNova YouTube video", "ProductNova 的 YouTube 视频"],
        "index.videoEnlace": ["Ver en YouTube ↗", "Watch on YouTube ↗", "在 YouTube 上观看 ↗"],
        "index.videoVacio":  ["El vídeo estará disponible próximamente.", "The video will be available soon.", "视频即将上线。"],

        /* ---- cuenta ---- */
        "cuenta.title":    ["ProductNova | Mi cuenta", "ProductNova | My account", "ProductNova | 我的账户"],
        "cuenta.sub":      ["Consulta tus datos y gestiona tu sesión.", "View your details and manage your session.", "查看您的资料并管理登录状态。"],
        "cuenta.logout":   ["Cerrar sesión", "Log out", "退出登录"],
        "cuenta.datos":    ["Datos de la cuenta", "Account details", "账户信息"],
        "cuenta.estadoSesion":["Estado de la sesión", "Session status", "登录状态"],
        "cuenta.recordarOn":["Recordarme activado", "Remember me enabled", "已启用“记住我”"],
        "cuenta.nArticulos":["Artículos en la cesta", "Items in your cart", "购物车商品数"],
        "cuenta.resumenCesta":["Resumen de tu cesta", "Your cart summary", "购物车摘要"],
        "cuenta.sinProductos":["Todavía no has añadido ningún producto.", "You haven't added any products yet.", "您还没有添加任何商品。"],
        "cuenta.irProductos":["Ir a productos →", "Go to products →", "前往产品 →"],
        "cuenta.misPedidos":["Mis pedidos", "My orders", "我的订单"],
        "cuenta.cargando": ["Cargando tus pedidos...", "Loading your orders...", "正在加载订单……"],
        "cuenta.invitado": ["Inicia sesión para ver tu historial de pedidos.", "Log in to see your order history.", "请登录以查看订单历史。"],
        "cuenta.sinPedidos":["Todavía no has realizado ningún pedido.", "You haven't placed any orders yet.", "您还没有下过任何订单。"],
        "cuenta.rolAdmin": ["Administrador de ProductNova", "ProductNova administrator", "ProductNova 管理员"],
        "cuenta.rolCliente":["Cuenta de cliente", "Customer account", "客户账户"],
        "cuenta.rolDefecto":["Cuenta ProductNova", "ProductNova account", "ProductNova 账户"],
        "cuenta.usuarioDef":["Usuario", "User", "用户"],
        "cuenta.sesionActiva":["Sesión activa en este navegador", "Active session in this browser", "此浏览器中已登录"],
        "cuenta.sesionRecordada":["Sesión recordada", "Remembered session", "已记住登录"],
        "cuenta.si":       ["Sí", "Yes", "是"],
        "cuenta.no":       ["No", "No", "否"],
        "cuenta.unidades": ["{n} unidad(es)", "{n} unit(s)", "{n} 件"],
        "cuenta.pedido":   ["Pedido #{id}", "Order #{id}", "订单 #{id}"],
        "cuenta.nArt":     ["{n} artículo(s)", "{n} item(s)", "{n} 件商品"],

        /* ---- estados de pedido (valores de la base de datos) ---- */
        "estado.Pendiente":  ["Pendiente", "Pending", "待处理"],
        "estado.Pendiente_Verificación": ["Pendiente verificación", "Pending verification", "待核实"],
        "estado.Completado": ["Completado", "Completed", "已完成"],
        "estado.Enviado":    ["Enviado", "Shipped", "已发货"],
        "estado.Cancelado":  ["Cancelado", "Cancelled", "已取消"],

        /* ---- errores que llegan de la base de datos / conexion_db.js ---- */
        "err.conexion":   ["No se ha podido conectar con el servidor.", "Could not connect to the server.", "无法连接到服务器。"],
        "err.pass6":      ["La contraseña debe tener al menos 6 caracteres.", "The password must be at least 6 characters long.", "密码长度至少为 6 个字符。"],
        "err.usuarioDup": ["Ese nombre de usuario ya está registrado.", "That username is already taken.", "该用户名已被注册。"],
        "err.sinArticulos":["El pedido no contiene artículos.", "The order contains no items.", "订单中没有商品。"],
        "err.bizumTel":   ["Para pagar con Bizum hay que indicar un teléfono.", "A phone number is required to pay with Bizum.", "使用 Bizum 支付需要填写手机号码。"],
        "err.articuloDesc":["Artículo desconocido: {x}", "Unknown item: {x}", "未知商品：{x}"],
        "err.pedidoInterno":["Error interno al registrar el pedido.", "Internal error while registering the order.", "提交订单时发生内部错误。"]
    };


    /* Texto original (español) de cada error → clave */
    const ERRORES_ES = {};
    ["err.conexion", "err.pass6", "err.usuarioDup", "err.sinArticulos", "err.bizumTel", "err.pedidoInterno"]
        .forEach(function (c) { ERRORES_ES[K[c][0]] = c; });


    /* ---------- CATÁLOGO: nombres, unidades y descripciones ----------
       El nombre en español es la clave canónica (así se guarda en la
       base de datos y en el carrito); aquí solo se traduce para mostrar. */

    const PRODUCTOS = {
        "Frigorífico No Frost":    ["No Frost Refrigerator",          "无霜冰箱"],
        "Lavadora carga frontal":  ["Front-Loading Washing Machine",  "滚筒洗衣机"],
        "Horno multifunción":      ["Multifunction Oven",             "多功能烤箱"],
        "Microondas digital":      ["Digital Microwave",              "数字微波炉"],
        "Lavavajillas integrable": ["Built-in Dishwasher",            "嵌入式洗碗机"],
        "Instalación a domicilio": ["Home Installation",              "上门安装"],
        "Reparación a domicilio":  ["Home Repair",                    "上门维修"],
        "Mantenimiento anual":     ["Annual Maintenance",             "年度保养"],
        "Garantía extendida":      ["Extended Warranty",              "延长保修"],
        "Soporte técnico 24/7":    ["24/7 Technical Support",         "24小时技术支持"]
    };

    const UNIDADES = {
        "unidad":   ["unit",    "件"],
        "servicio": ["service", "次"],
        "visita":   ["visit",   "次上门"],
        "mes":      ["month",   "月"],
        "año":      ["year",    "年"]
    };

    const DESCRIPCIONES = {
        p1: ["Two-door combi fridge-freezer with No Frost technology and adjustable interior layout.",
             "双门冰箱冷冻组合，采用无霜技术，内部分层可灵活调节。"],
        p2: ["Front-loading washing machine with quick programmes and high energy efficiency.",
             "前置式滚筒洗衣机，配备快速洗涤程序，能效等级高。"],
        p3: ["Multifunction electric oven with several cooking modes and easy cleaning.",
             "多功能电烤箱，提供多种烹饪模式，清洁方便。"],
        p4: ["Microwave with digital panel, automatic programmes and defrost function.",
             "数字面板微波炉，带自动程序和解冻功能。"],
        p5: ["12 place settings, 6 wash programmes and low water and energy consumption.",
             "12套餐具容量，6种洗涤程序，水电消耗低。"],
        s1: ["We install and connect your new appliance on the same day it is delivered.",
             "新电器送货当天，我们即上门安装并接通使用。"],
        s2: ["A technician comes to your home to diagnose and repair the fault.",
             "技术人员上门诊断并维修故障。"],
        s3: ["Regular check-ups of your appliances to extend their lifespan and performance.",
             "定期检查您的电器，延长使用寿命并保持良好性能。"],
        s4: ["Extend your appliance's coverage beyond the manufacturer's warranty.",
             "在厂家保修期之外，延长您电器的保修范围。"],
        s5: ["Phone and remote support every day of the year, at any hour.",
             "全年无休，随时提供电话和远程支持。"]
    };


    /* ============================================================
       NÚCLEO
       ============================================================ */

    let idioma = "es";

    function indice() { return ORDEN.indexOf(idioma); }

    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    function t(clave, vars) {
        const fila = K[clave];
        const i = indice();
        let txt;
        if (!fila) txt = clave;
        else txt = fila[i] || fila[0];
        if (vars) {
            Object.keys(vars).forEach(function (k) {
                txt = txt.split("{" + k + "}").join(vars[k]);
            });
        }
        return txt;
    }

    let tasas = Object.assign({}, TASAS_FIJAS);

    function moneda() { return MONEDAS[idioma] || MONEDAS.es; }

    /* Convierte un importe en euros a la moneda del idioma activo (número) */
    function convertir(valorEur) {
        const n = Number(valorEur) || 0;
        return n * (tasas[moneda().codigo] || 1);
    }

    /* Importe formateado en la moneda del idioma: 499,99 € · $539.99 · ¥3,899.92
       (se mantiene el nombre "euros" porque todas las páginas ya lo usan;
       recibe SIEMPRE euros, que es lo que guarda la base de datos) */
    function euros(valor) {
        const m = moneda();
        const n = convertir(valor);
        try {
            return new Intl.NumberFormat(m.locale, { style: "currency", currency: m.codigo }).format(n);
        } catch (e) {
            const simbolo = { EUR: "€", USD: "$", CNY: "¥" }[m.codigo];
            return m.codigo === "EUR" ? n.toFixed(2).replace(".", ",") + " €" : simbolo + n.toFixed(2);
        }
    }

    /* Importe SIEMPRE en euros (para avisar de lo que realmente se cobra) */
    function eurosReales(valor) {
        const n = Number(valor) || 0;
        try {
            return new Intl.NumberFormat(moneda().locale, { style: "currency", currency: "EUR" }).format(n);
        } catch (e) { return n.toFixed(2) + " €"; }
    }

    function cargarTasas() {

        if (!USAR_TIPO_CAMBIO_ONLINE) return;

        function aceptar(r) {
            if (!r || !(r.USD > 0.5 && r.USD < 3) || !(r.CNY > 3 && r.CNY < 15)) return false;   // descarta datos absurdos
            tasas = { EUR: 1, USD: r.USD, CNY: r.CNY };
            return true;
        }

        try {
            const c = JSON.parse(localStorage.getItem(CLAVE_TASAS));
            if (c && (Date.now() - c.ts) < HORAS_CACHE_TASAS * 3600000 && aceptar(c.r)) return;
        } catch (e) { }

        const ctl = ("AbortController" in window) ? new AbortController() : null;
        const timer = setTimeout(function () { if (ctl) ctl.abort(); }, 3000);

        fetch(URL_TIPO_CAMBIO, { signal: ctl ? ctl.signal : undefined })
            .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
            .then(function (j) {
                const r = j && j.rates ? { USD: j.rates.USD, CNY: j.rates.CNY } : null;
                if (aceptar(r)) {
                    try { localStorage.setItem(CLAVE_TASAS, JSON.stringify({ ts: Date.now(), r: r })); } catch (e) { }
                    aplicar(document);
                    // las páginas repintan sus importes al oír este evento
                    document.dispatchEvent(new CustomEvent("idiomaCambiado", { detail: { lang: idioma, soloTasas: true } }));
                }
            })
            .catch(function () { /* se quedan las tasas de reserva */ })
            .finally(function () { clearTimeout(timer); });
    }

    function fecha(iso) {
        return new Date(iso).toLocaleDateString(IDIOMAS[idioma].locale,
            { day: "2-digit", month: "short", year: "numeric" });
    }

    // Columna del catálogo para el idioma activo: 0 = inglés, 1 = chino (los idiomas nuevos usan inglés)
    function colCat() { return idioma === "zh" ? 1 : 0; }

    function producto(nombreEs) {
        const f = PRODUCTOS[nombreEs];
        return (f && idioma !== "es") ? f[colCat()] : nombreEs;
    }

    function unidad(u) {
        const f = UNIDADES[u];
        return (f && idioma !== "es") ? f[colCat()] : u;
    }

    function descripcion(codigo, original) {
        const f = DESCRIPCIONES[codigo];
        return (f && idioma !== "es") ? f[colCat()] : original;
    }

    function estado(valor) {
        const clave = "estado." + valor;
        return K[clave] ? t(clave) : String(valor).replace("_", " ");
    }

    /* Traduce los mensajes de error en español que lanza PostgreSQL */
    function traducirError(msg) {
        if (!msg) return msg;
        const limpio = String(msg).trim();
        if (ERRORES_ES[limpio]) return t(ERRORES_ES[limpio]);
        const m = limpio.match(/^Artículo desconocido: (.*)$/);
        if (m) return t("err.articuloDesc", { x: m[1] });
        return msg;
    }


    /* ---------- aplicar traducciones al DOM ---------- */

    function aplicar(raiz) {

        raiz = raiz || document;

        raiz.querySelectorAll("[data-i18n]").forEach(function (el) {
            el.textContent = t(el.getAttribute("data-i18n"));
        });

        raiz.querySelectorAll("[data-i18n-html]").forEach(function (el) {
            el.innerHTML = t(el.getAttribute("data-i18n-html"));   // texto propio, de confianza
        });

        [["placeholder", "data-i18n-placeholder"],
         ["title",       "data-i18n-title"],
         ["alt",         "data-i18n-alt"],
         ["aria-label",  "data-i18n-aria"]].forEach(function (par) {
            raiz.querySelectorAll("[" + par[1] + "]").forEach(function (el) {
                el.setAttribute(par[0], t(el.getAttribute(par[1])));
            });
        });

        raiz.querySelectorAll("[data-i18n-producto]").forEach(function (el) {
            el.textContent = producto(el.getAttribute("data-i18n-producto"));
        });

        raiz.querySelectorAll("[data-i18n-desc]").forEach(function (el) {
            if (el.dataset.orig === undefined) {
                el.dataset.orig = el.textContent.trim().replace(/\s+/g, " ");
            }
            el.textContent = descripcion(el.getAttribute("data-i18n-desc"), el.dataset.orig);
        });

        raiz.querySelectorAll(".precio[data-precio]").forEach(function (el) {
            el.innerHTML = esc(euros(el.dataset.precio)) +
                ' <small>/ ' + esc(unidad(el.dataset.unidad || "unidad")) + '</small>';
        });
    }


    /* ---------- cambiar idioma ---------- */

    function setIdioma(lang, manual) {

        if (!IDIOMAS[lang]) lang = "es";

        idioma = lang;

        if (manual) {
            try { localStorage.setItem(CLAVE_MANUAL, lang); } catch (e) { }
        }

        document.documentElement.lang = IDIOMAS[lang].html;

        aplicar(document);
        actualizarSelector();

        document.dispatchEvent(new CustomEvent("idiomaCambiado", { detail: { lang: lang } }));
    }


    /* ============================================================
       DETECCIÓN AUTOMÁTICA
       ============================================================ */

    function desdeNavegador() {
        const lista = (navigator.languages && navigator.languages.length)
            ? navigator.languages : [navigator.language || "es"];
        for (let i = 0; i < lista.length; i++) {
            const base = String(lista[i]).toLowerCase().split("-")[0];
            if (IDIOMAS[base]) return base;
        }
        return null;
    }

    function desdePais(pais) {
        pais = String(pais || "").toUpperCase();
        if (PAISES_ZH.indexOf(pais) >= 0) return "zh";
        if (PAISES_EN.indexOf(pais) >= 0) return "en";
        if (PAISES_ES.indexOf(pais) >= 0) return "es";
        if (/^[A-Z]{2}$/.test(pais)) return desdeNavegador() || "en";   // país conocido, sin idioma propio
        return null;
    }

    function leerManual() {
        try {
            const v = localStorage.getItem(CLAVE_MANUAL);
            return IDIOMAS[v] ? v : null;
        } catch (e) { return null; }
    }

    function leerAuto() {
        try {
            const o = JSON.parse(localStorage.getItem(CLAVE_AUTO));
            if (o && IDIOMAS[o.lang] && (Date.now() - o.ts) < DIAS_CACHE * 86400000) return o.lang;
        } catch (e) { }
        return null;
    }

    function guardarAuto(lang) {
        try { localStorage.setItem(CLAVE_AUTO, JSON.stringify({ lang: lang, ts: Date.now() })); } catch (e) { }
    }

    function consultarPais(servicio) {
        const ctl = ("AbortController" in window) ? new AbortController() : null;
        const timer = setTimeout(function () { if (ctl) ctl.abort(); }, 2500);
        return fetch(servicio.url, { signal: ctl ? ctl.signal : undefined, cache: "no-store" })
            .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return servicio.leer(r); })
            .finally(function () { clearTimeout(timer); });
    }

    async function detectarPorUbicacion() {

        if (!USAR_GEOLOCALIZACION_IP) return;
        if (leerManual() || leerAuto()) return;
        try { if (sessionStorage.getItem("pn_geo_intentado")) return; } catch (e) { }
        try { sessionStorage.setItem("pn_geo_intentado", "1"); } catch (e) { }

        for (let i = 0; i < SERVICIOS_GEO.length; i++) {
            try {
                const pais = await consultarPais(SERVICIOS_GEO[i]);
                const lang = desdePais(pais);
                if (lang) {
                    guardarAuto(lang);
                    if (!leerManual() && lang !== idioma) setIdioma(lang, false);
                    return;
                }
            } catch (e) { /* probamos el siguiente servicio */ }
        }

        // Sin ubicación: nos quedamos con el idioma del navegador
        guardarAuto(idioma);
    }


    /* ============================================================
       SELECTOR DE IDIOMA (arriba a la derecha)
       ============================================================ */

    const CSS = `
    #selector-idioma{position:relative;display:inline-block;font-family:Arial,Helvetica,sans-serif;z-index:2000}
    #selector-idioma.flotante{position:fixed;top:14px;right:16px}
    nav > #selector-idioma{margin-left:14px;flex-shrink:0}
    nav #carrito-container:not([style*="flex"]) ~ #login{margin-left:auto}
    #idioma-boton{display:flex;align-items:center;gap:7px;height:42px;padding:0 12px;border:1px solid var(--borde,#e2e8f0);
        border-radius:10px;background:var(--blanco,#fff);color:var(--azul-oscuro,#0f172a);font-size:14px;font-weight:600;
        font-family:inherit;cursor:pointer;transition:.2s}
    #idioma-boton:hover,#idioma-boton:focus-visible{background:var(--azul-claro,#eff6ff);border-color:#bfdbfe;outline:none}
    #idioma-boton svg{width:18px;height:18px;stroke:currentColor;flex-shrink:0}
    #idioma-menu{display:none;position:absolute;top:calc(100% + 8px);right:0;min-width:150px;padding:6px;margin:0;list-style:none;
        background:var(--blanco,#fff);border:1px solid var(--borde,#e2e8f0);border-radius:12px;box-shadow:0 10px 30px rgba(15,23,42,.12)}
    #idioma-menu.abierto{display:block}
    #idioma-menu button{display:flex;justify-content:space-between;align-items:center;width:100%;padding:10px 12px;border:none;
        border-radius:8px;background:none;color:var(--texto,#1e293b);font-size:14px;font-family:inherit;cursor:pointer;text-align:left}
    #idioma-menu button:hover,#idioma-menu button:focus-visible{background:var(--azul-claro,#eff6ff);color:var(--azul,#2563eb);outline:none}
    #idioma-menu button[aria-checked="true"]{font-weight:700;color:var(--azul,#2563eb)}
    #idioma-menu button[aria-checked="true"]::after{content:"✓"}
    @media (max-width:600px){#idioma-boton{height:38px;padding:0 9px}#selector-idioma.flotante{top:10px;right:10px}}

    /* Tipografía para chino */
    html[lang^="zh"] body,html[lang^="zh"] input,html[lang^="zh"] button,html[lang^="zh"] select,html[lang^="zh"] textarea{
        font-family:"PingFang SC","Microsoft YaHei","Noto Sans SC","Hiragino Sans GB",Arial,sans-serif}

    /* Etiqueta "DESTACADO" de la tarjeta p3 */
    html[lang="en"] #p3::before{content:"FEATURED"}
    html[lang^="zh"] #p3::before{content:"推荐"}
    `;

    const ICONO_GLOBO =
        '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line>' +
        '<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>';

    function crearSelector() {

        if (document.getElementById("selector-idioma")) return;

        const estilo = document.createElement("style");
        estilo.textContent = CSS;
        document.head.appendChild(estilo);

        const caja = document.createElement("div");
        caja.id = "selector-idioma";

        caja.innerHTML =
            '<button type="button" id="idioma-boton" aria-haspopup="true" aria-expanded="false" aria-controls="idioma-menu" aria-label="Language / Idioma / 语言">' +
                ICONO_GLOBO + '<span id="idioma-actual"></span></button>' +
            '<ul id="idioma-menu" role="menu"></ul>';

        const menu = caja.querySelector("#idioma-menu");

        ORDEN.forEach(function (cod) {
            const li = document.createElement("li");
            li.setAttribute("role", "none");
            const b = document.createElement("button");
            b.type = "button";
            b.setAttribute("role", "menuitemradio");
            b.dataset.lang = cod;
            b.lang = IDIOMAS[cod].html;
            b.textContent = IDIOMAS[cod].nombre;
            b.addEventListener("click", function () {
                setIdioma(cod, true);
                cerrarMenu();
                caja.querySelector("#idioma-boton").focus();
            });
            li.appendChild(b);
            menu.appendChild(li);
        });

        // Dentro de la barra de navegación si existe; si no (login, pagos), flotante arriba a la derecha
        const nav = document.querySelector("nav");
        if (nav) { nav.appendChild(caja); } else { caja.classList.add("flotante"); document.body.appendChild(caja); }

        const boton = caja.querySelector("#idioma-boton");

        boton.addEventListener("click", function (e) {
            e.stopPropagation();
            menu.classList.contains("abierto") ? cerrarMenu() : abrirMenu();
        });

        document.addEventListener("click", function (e) { if (!caja.contains(e.target)) cerrarMenu(); });

        caja.addEventListener("keydown", function (e) {
            if (e.key === "Escape") { cerrarMenu(); boton.focus(); }
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                const items = Array.prototype.slice.call(menu.querySelectorAll("button"));
                if (!menu.classList.contains("abierto")) return;
                e.preventDefault();
                let i = items.indexOf(document.activeElement);
                i = e.key === "ArrowDown" ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
                items[i].focus();
            }
        });

        function abrirMenu() {
            menu.classList.add("abierto");
            boton.setAttribute("aria-expanded", "true");
            const actual = menu.querySelector('[aria-checked="true"]');
            if (actual) actual.focus();
        }

        function cerrarMenu() {
            menu.classList.remove("abierto");
            boton.setAttribute("aria-expanded", "false");
        }

        actualizarSelector();
    }

    function actualizarSelector() {
        const actual = document.getElementById("idioma-actual");
        if (!actual) return;
        actual.textContent = IDIOMAS[idioma].corto;
        document.querySelectorAll("#idioma-menu button").forEach(function (b) {
            b.setAttribute("aria-checked", b.dataset.lang === idioma ? "true" : "false");
        });
    }


    /* ============================================================
       API PÚBLICA E INICIO
       ============================================================ */

    window.I18N = {
        t: t, euros: euros, eurosReales: eurosReales, convertir: convertir, fecha: fecha, producto: producto, unidad: unidad,
        descripcion: descripcion, estado: estado, traducirError: traducirError,
        aplicar: aplicar, esc: esc, setIdioma: setIdioma,
        get idioma() { return idioma; },
        get nombre() { return IDIOMAS[idioma].nombre; },
        get lista() { return ORDEN.map(function (c) { return { cod: c, nombre: IDIOMAS[c].nombre }; }); },
        get locale() { return IDIOMAS[idioma].locale; },
        get moneda() { return moneda().codigo; }
    };

    // Idioma inicial (síncrono, para evitar parpadeos): elección manual > detección guardada > navegador > español
    idioma = leerManual() || leerAuto() || desdeNavegador() || "es";
    document.documentElement.lang = IDIOMAS[idioma].html;

    function iniciar() {
        crearSelector();
        aplicar(document);
        document.dispatchEvent(new CustomEvent("idiomaCambiado", { detail: { lang: idioma } }));
        detectarPorUbicacion();
        cargarTasas();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar);
    } else {
        iniciar();
    }

})();
