// server.js
const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 10000;
const SECRET_TOKEN = "mysecret123";

// --- HTTP pentru health check (Render verifică asta) ---
const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
});

// --- WebSocket Server ---
const wss = new WebSocket.Server({ server });
const players = {}; // id -> { ws, x, y }
let nextId = 1;

console.log(`Starting WebSocket server on port ${PORT}`);

// Trimite un mesaj text tuturor clienților (mai puțin unu)
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
            // --- autentificare ---
            if (msg === SECRET_TOKEN) {
                authenticated = true;
                playerId = "player" + nextId++;
                players[playerId] = { ws, x: 23, y: 231 }; // spawn default

                // confirmă autentificarea
                ws.send(`AUTH_OK:${playerId}`);
                console.log(`✅ Client authenticated with id ${playerId}`);

                // trimite snapshot (toți ceilalți jucători)
                let snapshot = [];
                for (const [id, p] of Object.entries(players)) {
                    snapshot.push(`${id},${p.x},${p.y}`);
                }
                ws.send("SNAPSHOT:" + snapshot.join(";"));

                // anunță ceilalți
                broadcast(`NEW:${playerId},${players[playerId].x},${players[playerId].y}`, playerId);
            } else {
                ws.close();
                console.log("❌ Authentication failed");
            }
        } else {
            // --- poziție nouă ---
            const [x, y] = msg.split(",");
            if (x && y) {
                players[playerId].x = parseFloat(x);
                players[playerId].y = parseFloat(y);

                broadcast(`POS:${playerId},${x},${y}`, playerId);
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
});

// --- Pornește serverul ---
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
