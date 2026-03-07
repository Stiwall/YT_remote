# 🎬 YT Remote

Control remoto para YouTube. Pon el video en la pantalla grande y manéjalo desde el móvil via WebRTC.

## 📁 Estructura

```
yt-remote/
├── index.html      ← Landing page (página de inicio)
├── app.html        ← La aplicación principal
├── sw.js           ← Service Worker (PWA / offline)
├── manifest.json   ← Configuración PWA
└── icons/          ← Iconos (icon-192.png, icon-512.png)
```

## 🚀 Publicar en GitHub Pages

```bash
git init
git add .
git commit -m "🚀 Launch YT Remote"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/yt-remote.git
git push -u origin main
```

Luego en GitHub → Settings → Pages → Branch: main → Save.

Tu app estará en: `https://TU_USUARIO.github.io/yt-remote`

## ⚡ Publicar en Netlify (más fácil)

1. Ve a [netlify.com/drop](https://netlify.com/drop)
2. Arrastra esta carpeta
3. Listo — URL instantánea

## 🔧 Publicar en Vercel

```bash
npm i -g vercel
vercel deploy
```

## ⚙️ Configuración

Los límites de anti-abuso están en `app.html`, objeto `ABUSE`:

```js
const ABUSE = {
  MAX_CONTROLS:    10,   // Controles máximos por sala
  CMD_RATE_LIMIT:  15,   // Comandos por control cada 3s
  SEARCH_COOLDOWN: 2000, // Ms entre búsquedas
  MAX_Q_SIZE:      50,   // Videos máximos en cola
};
```

## 📡 Servidor PeerJS propio (para producción)

El servidor público `0.peerjs.com` es suficiente para uso personal.
Para publicar a gran escala, monta tu propio servidor:

```bash
npm install -g peer
peerjs --port 9000 --key peerjs --path /
```

Y cambia en `app.html`:
```js
host: 'tu-servidor.com',
port: 9000,
```
