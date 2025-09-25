const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 10000;
const SECRET_TOKEN = "mysecret123";

// HTTP for health check
const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
});

// WebSocket server
const wss = new WebSocket.Server({ server });
const players = {}; // id -> { ws, x, y, z, lastUpdate }
let nextId = 1;

console.log(`Starting WebSocket server on port ${PORT}`);

// Broadcast message to all except optional id
function broadcast(msg, exceptId = null) {
    for (const [id, p] of Object.entries(players)) {
        if (id !== exceptId) {
            try {
                p.ws.send(msg);
            } catch (e) {
                console.error(`Error sending to ${id}:`, e.message);
            }
        }
    }
}

wss.on("connection", (ws) => {
    let playerId = null;
    let authenticated = false;

    ws.on("message", (message) => {
        const msg = message.toString();

        if (!authenticated) {
            if (msg === SECRET_TOKEN) {
                authenticated = true;
                playerId = "player" + nextId++;
                players[playerId] = { ws, x: 23, y: 231, z: 1, lastUpdate: Date.now() };

                ws.send(`AUTH_OK:${playerId}`);
                console.log(`✅ Client authenticated with id ${playerId}`);

                // Send snapshot
                const snapshot = [];
                for (const [id, p] of Object.entries(players)) {
                    snapshot.push(`${id},${p.x},${p.y},${p.z}`);
                }
                ws.send("SNAPSHOT:" + snapshot.join(";"));

                // Notify others
                broadcast(`NEW:${playerId},${players[playerId].x},${players[playerId].y},${players[playerId].z}`, playerId);
            } else {
                ws.close();
                console.log("❌ Authentication failed");
            }
        } else {
            // Expect position: x,y,z
            const [xStr, yStr, zStr] = msg.split(",");
            const x = parseFloat(xStr);
            const y = parseFloat(yStr);
            const z = zStr ? parseFloat(zStr) : 1;

            if (!isNaN(x) && !isNaN(y)) {
                const now = Date.now();
                players[playerId].x = x;
                players[playerId].y = y;
                players[playerId].z = z;
                players[playerId].lastUpdate = now;

                // Broadcast POS with timestamp
                broadcast(`POS:${playerId},${x},${y},${z},${now}`, playerId);
            }
        }
    });

    ws.on("close", () => {
        if (playerId && players[playerId]) {
            delete players[playerId];
            broadcast(`REMOVE:${playerId}`);
            console.log(`👋 Client ${playerId} disconnected`);
        }
    });

    ws.on("error", (err) => {
        console.error(`WS error for player ${playerId}:`, err.message);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
