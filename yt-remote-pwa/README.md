# YT Remote PWA 🎵

**Control remoto para YouTube** - Convierte cualquier dispositivo en un control remoto para YouTube.

![Versión](https://img.shields.io/badge/version-1.0.0-red)
![PWA](https://img.shields.io/badge/PWA-Ready-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Características PWA

- ✅ **Manifest.json** completo con iconos, temas y configuración
- ✅ **Service Worker** con estrategia de caché inteligente
- ✅ **Botón de instalación automático** - Aparece cuando la app es instalable
- ✅ **Funciona offline** - Caché de recursos estáticos
- ✅ **Actualizaciones en caliente** - Notificación cuando hay nueva versión
- ✅ **Iconos adaptativos** - Maskable icons para Android
- ✅ **Atajos** - Modo Pantalla y Modo Control desde el launcher
- ✅ **Share Target** - Compartir URLs de YouTube directamente a la app

## 📁 Estructura de Archivos

```
yt-remote-pwa/
├── index.html          # App principal con PWA integrado
├── manifest.json       # Configuración del PWA
├── sw.js              # Service Worker
├── icons/
│   ├── icon-192.png   # Icono estándar
│   ├── icon-512.png   # Icono alta resolución
│   └── icon-maskable.png  # Icono adaptable
└── README.md          # Este archivo
```

## 🚀 Despliegue

### Opción 1: GitHub Pages (Gratuito)

1. Crea un nuevo repositorio en GitHub
2. Sube todos los archivos de esta carpeta
3. Ve a **Settings > Pages**
4. Selecciona la rama `main` y carpeta `/ (root)`
5. Tu app estará en: `https://tuusuario.github.io/nombre-repo/`

### Opción 2: Netlify (Gratuito)

1. Ve a [netlify.com](https://netlify.com)
2. Arrastra la carpeta `yt-remote-pwa` al área de deploy
3. Listo! Obtienes una URL como `https://yt-remote-abc123.netlify.app`

### Opción 3: Vercel (Gratuito)

1. Instala Vercel CLI: `npm i -g vercel`
2. En la carpeta del proyecto: `vercel`
3. Sigue las instrucciones

### Opción 4: Servidor Propio (Apache/Nginx)

Sube todos los archivos a tu servidor web. Asegúrate de que:
- Los archivos se sirvan con HTTPS (requerido para PWA)
- El MIME type de `manifest.json` sea `application/json`
- El Service Worker esté en la raíz (`/`)

#### Configuración Apache (.htaccess)

```apache
<IfModule mod_headers.c>
    Header set Service-Worker-Allowed "/"
</IfModule>

AddType application/json manifest.json
```

#### Configuración Nginx

```nginx
location ~ \.json$ {
    add_header Content-Type application/json;
}

location /sw.js {
    add_header Service-Worker-Allowed "/";
}
```

## 📱 Instalación

### Android (Chrome)
1. Abre la app en Chrome
2. Toca el botón "Instalar App" o el menú ⋮ > "Agregar a pantalla de inicio"
3. Confirma la instalación

### iOS (Safari)
1. Abre la app en Safari
2. Toca el botón Compartir ⬆️
3. Selecciona "Agregar a Inicio"
4. Confirma con "Agregar"

### Desktop (Chrome/Edge)
1. Abre la app en el navegador
2. Haz clic en el icono de instalación en la barra de direcciones
3. O usa el botón "Instalar App" que aparece en la app

## 🔧 Configuración Avanzada

### Personalizar colores

Edita `manifest.json`:
```json
{
  "theme_color": "#FF0000",      // Color de la barra de estado
  "background_color": "#0f0f0f"  // Color de splash screen
}
```

### Cambiar nombre

Edita `manifest.json`:
```json
{
  "name": "Tu Nombre Largo",
  "short_name": "Tu Nombre Corto"
}
```

### Actualizar versión

Cuando hagas cambios, actualiza la versión en `sw.js`:
```javascript
const CACHE_NAME = 'yt-remote-v1.0.1'; // Incrementa versión
```

## 📊 Estrategia de Caché

El Service Worker usa estrategias diferentes según el tipo de recurso:

| Recurso | Estrategia | Descripción |
|---------|------------|-------------|
| HTML/CSS/JS/Iconos | Cache-First | Carga rápida desde caché |
| Imágenes YouTube | Stale-While-Revalidate | Muestra caché, actualiza en background |
| APIs (PeerJS, YouTube) | Network-First | Siempre intenta red primero |
| Otros | Network + Fallback | Red con fallback a caché |

## 🔄 Actualizaciones

Cuando subas una nueva versión:

1. Cambia la versión en `sw.js`
2. Los usuarios verán un banner "Nueva versión disponible"
3. Al tocar "Actualizar", la página se recarga con la nueva versión

## 🐛 Solución de Problemas

### La app no se instala
- Asegúrate de usar HTTPS
- Verifica que el manifest sea válido en [PWABuilder](https://www.pwabuilder.com/)
- Revisa la consola del navegador para errores

### Service Worker no funciona
- El SW debe estar en la raíz (`/sw.js`)
- Verifica que `Service-Worker-Allowed` header esté configurado
- Limpia la caché del navegador

### Iconos no aparecen
- Verifica que las rutas en `manifest.json` sean correctas
- Los iconos deben ser PNG
- Tamaños mínimos: 192x192 y 512x512

## 📋 Checklist PWA

- [x] Manifest válido
- [x] Service Worker registrado
- [x] HTTPS habilitado
- [x] Iconos en múltiples tamaños
- [x] Icono maskable
- [x] Tema y colores configurados
- [x] Responsive design
- [x] Funciona offline
- [x] Botón de instalación
- [x] Atajos de app

## 📝 Licencia

MIT License - Libre para usar y modificar.

---

**Hecho con ❤️ para la comunidad**