const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid'); // npm install uuid

const PORT = process.env.PORT || 4342;
const SECRET_TOKEN = "mysecret123";

const wss = new WebSocket.Server({ port: PORT });
const players = {}; // id -> { ws, x, y }

console.log(`WebSocket server running on port ${PORT}`);

// Funcție pentru broadcast la toți ceilalți clienți
function broadcast(data, exceptId = null) {
    const msg = JSON.stringify(data);
    for (const [id, p] of Object.entries(players)) {
        if (id !== exceptId) {
            p.ws.send(msg);
        }
    }
}

wss.on('connection', (ws) => {
    let playerId = null;
    let authenticated = false;

    ws.on('message', (message) => {
        const msg = message.toString();

        // autentificare
        if (!authenticated) {
            if (msg === SECRET_TOKEN) {
                authenticated = true;
                playerId = uuidv4();
                players[playerId] = { ws, x: 0, y: 0 };

                ws.send(JSON.stringify({ type: "AUTH_OK", id: playerId }));
                console.log(`Client authenticated with id ${playerId}`);

                // trimite snapshot cu toți ceilalți jucători
                const snapshot = {};
                for (const [id, p] of Object.entries(players)) {
                    snapshot[id] = { x: p.x, y: p.y };
                }
                ws.send(JSON.stringify({ type: "SNAPSHOT", players: snapshot }));

                // anunță ceilalți jucători că s-a conectat unul nou
                broadcast({ type: "NEW_PLAYER", id: playerId, x: 0, y: 0 }, playerId);
            } else {
                ws.close();
                console.log("Authentication failed");
            }
        } else {
            // procesăm poziția
            const [x, y] = msg.split(',
