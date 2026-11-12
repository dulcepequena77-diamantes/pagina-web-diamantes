# PAGINA WEB — Diamantes

Sitio web estático (HTML/CSS/JS) para la marca **Diamantes**, reconstruido a partir de los recursos locales y del sitio alojado en Wix.

## Estructura

```
PAGINA WEB/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── config.js
│   ├── data.js
│   └── app.js
├── assets/
│   ├── logo.png
│   ├── foto.jpg
│   ├── banner.jpg
│   └── hero.avif
├── nuestra-idea.html
└── README.md
```

## Cómo ver

Abrir `index.html` en el navegador (doble clic) o servir con un servidor local:

```bash
cd "PAGINA WEB"
python3 -m http.server 8000
# luego abrir http://localhost:8000
```

## Iteraciones

### Iteración 22 — Eliminar alimentos (2026-11-09)
- Se eliminó "alimentos" de la lista de tipos de productos en "Nuestra idea".

### Iteración 21 — Todo tipo de productos (2026-11-09)
- Se aclaró que en la plataforma no solo se venderán joyas, sino todo tipo de productos (artesanías, moda, tecnología, hogar, alimentos, etc.).
- Título ajustado a "Crear un espacio donde cada producto cuente una historia".

### Iteración 20 — Texto ampliado "Nuestra idea" (2026-11-09)
- Se amplió el texto para incluir productores nacionales, emprendedores, artesanos, pymes y grandes empresas, importadoras y comerciantes nacionales, como ventana al comercio web.

### Iteración 19 — Página "Nuestra idea" (2026-11-09)
- Nueva página `nuestra-idea.html` accesible desde el menú principal ("Nuestra idea").
- Contenido: visión y propósito de Diamantes, comunidad, comisiones, valores.
- Reutiliza estilos, tema claro/oscuro, redes sociales y WhatsApp flotante.

### Iteración 18 — Sección Nosotros (2026-11-09)
- Sección final "Nosotros" con datos de la página: correo (diamantesartesanias@gmail.com), teléfono (+57 322 881 8536), ciudad (Fusagasugá) y país (Colombia).
- Enlaces clicables para correo y WhatsApp.

### Iteración 17 — Correo prellenado (2026-11-09)
- Al abrir la redacción de Gmail, el destinatario queda prellenado con diamantesartesanias@gmail.com.

### Iteración 16 — Enviar correo (2026-11-09)
- El icono de correo ahora abre la ventana de redacción de Gmail (enviar correo) en lugar de la bandeja de entrada.

### Iteración 15 — Enlace de correo (2026-11-09)
- El botón de Correo del footer se enlazó a la URL de Gmail indicada (se abre en nueva pestaña).

### Iteración 14 — Enlace de Facebook (2026-11-09)
- El botón de Facebook del footer se enlazó a https://www.facebook.com/profile.php?id=61595199278302 (se abre en nueva pestaña).

### Iteración 13 — Chat de WhatsApp (2026-11-09)
- Botón flotante de WhatsApp (esquina inferior derecha) que abre chat con el número +57 322 881 8536 con mensaje predefinido.
- Enlace de WhatsApp en el footer actualizado al mismo número.
- Estilo del botón flotante con tooltip "Chatea con nosotros".

### Iteración 12 — Parallax en banner principal (2026-11-09)
- Efecto parallax aplicado al banner principal (hero) mediante transformación del fondo al hacer scroll.
- Imagen de fondo ampliada (120% de altura) para evitar huecos durante el movimiento.

### Iteración 11 — Título más cerca del logo (2026-11-09)
- Título principal acercado aún más al logo central (margin-bottom: -30px).

### Iteración 10 — Título pegado al logo (2026-11-09)
- Título principal pegado al logo central (margin-bottom del logo: 0).

### Iteración 9 — Espaciado y título (2026-11-09)
- Reducido el espacio entre el logo central y el título principal (margin-bottom 24px → 8px).
- Título principal ampliado (clamp 6rem–11rem).

### Iteración 8 — Logo central al doble (2026-11-09)
- El logo central del hero se amplió al doble (600px en escritorio, 440px en móvil).

### Iteración 7 — Logo ampliado nuevamente (2026-11-09)
- Logo ampliado otra vez: cabecera (90px), hero (300px), footer (100px).
- Ajuste del menú móvil para la nueva altura de cabecera.

### Iteración 6 — Logo ampliado (2026-11-09)
- Logo ampliado en cabecera (64px), hero (220px) y footer (72px).
- Ajuste del menú móvil para la nueva altura de cabecera.

### Iteración 5 — Iconos de redes sociales (2026-11-09)
- Se agregaron iconos SVG (Instagram, Facebook, WhatsApp, TikTok, Correo) en el footer.
- Iconos vectoriales, escalables y con soporte para tema claro/oscuro.

### Iteración 4 — Título principal (2026-11-09)
- El título principal del hero ahora dice únicamente **Diamantes**.
- Tipografía cursiva (Great Vibes) para el título principal.

### Iteración 3 — Tema claro/oscuro (2026-11-09)
- Se mantiene el nombre de la página: **Diamantes**.
- Se consolida el diseño actual (marketplace C2C) como diseño definitivo.
- Opción de configuración del fondo: **modo oscuro** (actual) o **modo claro** (fondos blancos).
- Botón de alternancia de tema en la cabecera (🌙/☀️).
- Preferencia guardada en `localStorage` (`dw_theme`) y aplicada al cargar.
- Variables CSS sobrescritas para el tema claro (fondos blancos, texto oscuro, dorado más oscuro para contraste, sombras suaves).
- README actualizado.

### Iteración 2 — Marketplace C2C (2026-11-09)
- Transformación del sitio en un **marketplace C2C** (consumidor a consumidor).
- Autenticación de usuarios: registro e inicio de sesión (nombre, correo, contraseña, rol vendedor).
- Publicación de productos por vendedores: título, categoría, precio, descripción, imagen (URL o archivo).
- Listado público con búsqueda, filtro por categoría y ordenamiento.
- Página de detalle de producto con desglose de comisión.
- Panel de vendedor: mis productos, mis ventas, ganancia neta, cambio de estado de pedidos.
- Panel de plataforma: historial de ventas y comisiones retenidas.
- Sistema de comisiones: la plataforma retiene el **10%** de cada venta; el 90% es para el vendedor.
- Capa de datos dual:
  - **Demo (por defecto):** localStorage (un solo navegador).
  - **Producción:** Firebase (Auth + Firestore) activando credenciales en `js/config.js`.
- Nuevos estilos: tarjetas de producto, filtros, formularios de auth, tablas, estadísticas, responsive.
- README actualizado.

### Iteración 1 — Base (2026-11-09)
- Creación de la estructura del proyecto en `~/Desktop/PAGINA WEB`.
- Copia de los recursos gráficos desde `~/Desktop/DIMANTES` (logo, foto, banner, hero).
- Maquetación inicial: header/nav, hero, sobre nosotros, colecciones, galería, contacto y footer.
- Estilos: tema oscuro con acentos dorados, tipografía Cormorant Garamond + Montserrat, diseño responsive.
- JS: menú móvil, formulario de contacto (demo) y año dinámico en footer.
- README creado.

## Funcionalidades

- Marketplace C2C: registro/inicio de sesión, publicación de productos, listado con búsqueda/filtros/ordenamiento.
- Detalle de producto con desglose de comisión (10% plataforma / 90% vendedor).
- Panel de vendedor: productos, ventas, ganancia neta, estado de pedidos.
- Panel de plataforma: historial de ventas y comisiones.
- Tema claro/oscuro con botón de alternancia (🌙/☀️) y preferencia guardada.
- Diseño responsive.

## Modo producción (multi-usuario real)

Por defecto el sitio corre en modo **demo** (localStorage). Para que otras personas puedan crear cuenta y publicar productos de verdad:

1. Crea un proyecto en https://console.firebase.google.com
2. Activa **Authentication → Email/Password**.
3. Crea una base de datos **Firestore** (modo producción o prueba).
4. Copia las credenciales web del proyecto en `js/config.js` (campo `FIREBASE_CONFIG`).
5. (Opcional) Activa **Storage** y ajusta `createProduct` para subir imágenes ahí en lugar de base64.
6. Reglas de seguridad sugeridas para Firestore:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid;
    }
    match /products/{id} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.sellerId;
    }
    match /orders/{id} {
      allow create: if request.auth != null;
      allow read: if request.auth.uid == resource.data.sellerId || request.auth.uid == resource.data.buyerId;
    }
  }
}
```

## Contacto

- Correo: diamantesartesanias@gmail.com
- WhatsApp: +57 322 881 8536
- Ciudad: Fusagasugá
- País: Colombia
- Facebook: https://www.facebook.com/profile.php?id=61595199278302

## Notas / Pendientes

- El editor de Wix requiere inicio de sesión, por lo que no fue posible acceder directamente al sitio original.
- Para lograr una réplica **idéntica** del sitio Wix, se necesita la **URL publicada** o capturas de pantalla.
- La comisión está fija en 10% (`PLATFORM_COMMISSION_RATE` en `js/config.js`); ajustable.
- El tema preferido se guarda en `localStorage` (`dw_theme`).
- La página "Nuestra idea" (`nuestra-idea.html`) amplía la propuesta de valor y el tipo de productos.

## Cómo usar el tema

- Haz clic en el botón 🌙/☀️ de la cabecera para alternar entre modo oscuro y claro.
- La preferencia se recuerda en el navegador.

## Cambios recientes
- Panel de vendedor: nombre de tienda, logo de negocio, gestión de envíos por transportadora, fondos pendientes/liberados.
- Categorías añadidas: Bolsos, Carteras, Ropa para dama, Ropa para caballero, Ropa para niño.
- Sección Nosotros ampliada con descripción de la marca.
- Eliminado título "Datos de la página" en la sección Nosotros.
- Imágenes de productos: vista previa, lightbox, compresión automática.
- Panel de administrador con analíticas (visitas, compras, ventas, comisiones) y reinicio de pedidos.
- Sistema de liberación de fondos (escrow): confirmación del comprador o 5 días tras entrega.
- Notificaciones en app y por correo (EmailJS/FormSubmit).
- Pasarela de pago simulada (demo).
- Tipografía cursiva (Great Vibes) en el header.
- Textos del header ajustados para no superponerse.
- Página "Vender" con categorías y formulario de publicación.
- Productos ilimitados en inicio.
