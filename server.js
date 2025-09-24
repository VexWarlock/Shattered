const WebSocket = require('ws');

const PORT = process.env.PORT || 4342;
const SECRET_TOKEN = "mysecret123";

const wss = new WebSocket.Server({ port: PORT });

console.log(`WebSocket server started on port ${PORT}`);

// funcție simplă pentru id random
function generateId() {
    return Math.random().toString(36).substr(2, 9); // ex: "k8fj39s2a"
}

wss.on('connection', function connection(ws) {
    let authenticated = false;
    let playerId = null;

    ws.on('message', function incoming(message) {
        const msg = message.toString();

        if (!authenticated) {
            if (msg === SECRET_TOKEN) {
                authenticated = true;
                playerId = generateId();
                ws.send(JSON.stringify({ type: "AUTH_OK", id: playerId }));
                console.log(`Client authenticated -> ID: ${playerId}`);
            } else {
                ws.close();
                console.log("Authentication failed");
            }
        } else {
            // procesăm poziția
            const [x, y] = msg.split(',');
            if (x && y) {
                console.log(`Player ${playerId} -> x: ${x}, y: ${y}`);
            }
        }
    });

    ws.on('close', () => {
        console.log(`Client ${playerId || "unknown"} disconnected`);
    });
});
