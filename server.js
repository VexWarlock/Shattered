const WebSocket = require('ws');

const PORT = process.env.PORT || 4342;
const SECRET_TOKEN = "mysecret123";

const wss = new WebSocket.Server({ port: PORT });
const players = {}; // id -> { ws, x, y }

let nextPlayerId = 1; // counter incremental

console.log(`WebSocket server running on port ${PORT}`);

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

        if (!authenticated) {
            if (msg === SECRET_TOKEN) {
                authenticated = true;

                // folosește counter-ul ca ID
                playerId = (nextPlayerId++).toString();
                players[playerId] = { ws, x: 0, y: 0 };

                ws.send(JSON.stringify({ type: "AUTH_OK", id: playerId }));
                console.log(`Client authenticated with id ${playerId}`);

                const snapshot = {};
                for (const [id, p] of Object.entries(players)) {
                    snapshot[id] = { x: p.x, y: p.y };
                }
                ws.send(JSON.stringify({ type: "SNAPSHOT", players: snapshot }));

                broadcast({ type: "NEW_PLAYER", id: playerId, x: 0, y: 0 }, playerId);
            } else {
                ws.close();
                console.log("Authentication failed");
            }
        } else {
            const [x, y] = msg.split(',');
            if (x && y) {
                players[playerId].x = parseFloat(x);
                players[playerId].y = parseFloat(y);

                broadcast({ type: "POS", id: playerId, x: players[playerId].x, y: players[playerId].y }, playerId);
            }
        }
    });

    ws.on('close', () => {
        if (playerId && players[playerId]) {
            delete players[playerId];
            broadcast({ type: "REMOVE", id: playerId });
            console.log(`Client ${playerId} disconnected`);
        }
    });
});
