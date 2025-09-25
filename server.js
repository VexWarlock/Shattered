const WebSocket = require('ws');

const PORT = process.env.PORT || 4342;
const SECRET_TOKEN = "mysecret123";

const wss = new WebSocket.Server({ port: PORT });
const players = {}; // id -> { ws, x, y }
let nextId = 1;

console.log(`WebSocket server running on port ${PORT}`);

// Trimite un mesaj tuturor clienților (mai puțin unu)
function broadcast(msg, exceptId = null) {
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

        if (!authenticated) {
            // autentificare
            if (msg === SECRET_TOKEN) {
                authenticated = true;
                playerId = "player" + nextId++;
                
                // spawn default (ex: 23,231 în loc de 0,0)
                const startX = 23;
                const startY = 231;

                players[playerId] = { ws, x: startX, y: startY };

                // confirmă autentificarea
                ws.send(`AUTH_OK:${playerId}`);
                console.log(`Client authenticated with id ${playerId}`);

                // trimite snapshot (toți ceilalți jucători existenți)
                let snapshot = [];
                for (const [id, p] of Object.entries(players)) {
                    snapshot.push(`${id},${p.x},${p.y}`);
                }
                ws.send("SNAPSHOT:" + snapshot.join(";"));

                // anunță ceilalți cu poziția reală
                broadcast(`NEW:${playerId},${startX},${startY}`, playerId);
            } else {
                ws.close();
                console.log("Authentication failed");
            }
        } else {
            // poziție nouă primită de la client
            const [x, y] = msg.split(",");
            if (x && y) {
                players[playerId].x = parseFloat(x);
                players[playerId].y = parseFloat(y);

                broadcast(`POS:${playerId},${x},${y}`, playerId);
            }
        }
    });

    ws.on('close', () => {
        if (playerId && players[playerId]) {
            delete players[playerId];
            broadcast(`REMOVE:${playerId}`);
            console.log(`Client ${playerId} disconnected`);
        }
    });
});
