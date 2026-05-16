const WebSocket = require('ws');

const PORT = process.env.PORT || 3000;
const wss  = new WebSocket.Server({ port: PORT });

// roomCode → Map<ws, {mode, password}>
const rooms = new Map();

wss.on('connection', (ws) => {
  let room = null;
  let clientMode = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === 'join') {
      const code = (msg.room || '').toUpperCase().slice(0, 12);
      const pw   = msg.password || '';
      if (!code) return;

      if (rooms.has(code)) {
        const members = rooms.get(code);
        const host = [...members.values()].find(m => m.mode === 'host');
        if (host?.password && host.password !== pw) {
          ws.send(JSON.stringify({ type: 'auth-rejected', reason: 'Contraseña incorrecta' }));
          return;
        }
      } else {
        rooms.set(code, new Map());
      }

      room       = code;
      clientMode = msg.mode;
      rooms.get(code).set(ws, { mode: msg.mode, password: pw });

      ws.send(JSON.stringify({ type: 'joined', room: code, mode: msg.mode }));
      broadcast(code, ws, { type: 'peer-joined', mode: msg.mode });
      return;
    }

    if (!room) return;

    // Relay to everyone else in the room
    broadcast(room, ws, msg);
  });

  ws.on('close', () => {
    if (!room || !rooms.has(room)) return;
    rooms.get(room).delete(ws);
    broadcast(room, ws, { type: 'peer-left', mode: clientMode });
    if (rooms.get(room).size === 0) rooms.delete(room);
  });

  ws.on('error', () => {});
});

function broadcast(roomCode, sender, msg) {
  if (!rooms.has(roomCode)) return;
  const data = JSON.stringify(msg);
  rooms.get(roomCode).forEach((_, client) => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

console.log(`YT Remote relay server on :${PORT}`);
