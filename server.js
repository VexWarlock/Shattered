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
const players = {}; // id -> { ws, x, y, z, anim }
let nextId = 1;

console.log(`Starting WebSocket server on port ${PORT}`);

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
                players[playerId] = { ws, x: 23, y: 231, z: 1, anim: "idle" };

                ws.send(`AUTH_OK:${playerId}`);
                console.log(`✅ Client authenticated with id ${playerId}`);

                // trimite SNAPSHOT cu animatii
                let snapshot = [];
                for (const [id, p] of Object.entries(players)) {
                    snapshot.push(`${id},${p.x},${p.y},${p.z},${p.anim}`);
                }
                ws.send("SNAPSHOT:" + snapshot.join(";"));

                broadcast(`NEW:${playerId},${players[playerId].x},${players[playerId].y},${players[playerId].z},${players[playerId].anim}`, playerId);
            } else {
                ws.close();
                console.log("❌ Authentication failed");
            }
        } else {
            const parts = msg.split(",");
            const x = parseFloat(parts[0]);
            const y = parseFloat(parts[1]);
            const z = parts[2] ? parseFloat(parts[2]) : 1;
            const anim = parts[3] || "idle";

            players[playerId].x = x;
            players[playerId].y = y;
            players[playerId].z = z;
            players[playerId].anim = anim;

            broadcast(`POS:${playerId},${x},${y},${z},${anim}`, playerId);
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

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
