// server.js
const WebSocket = require('ws');

const PORT = process.env.PORT || 4342;
const SECRET_TOKEN = "mysecret123";

const wss = new WebSocket.Server({ port: PORT });

console.log(`WebSocket server started on port ${PORT}`);

wss.on('connection', function connection(ws) {
    let authenticated = false;

    ws.on('message', function incoming(message) {
        const msg = message.toString();

        if (!authenticated) {
            if (msg === SECRET_TOKEN) {
                authenticated = true;
                ws.send("OK");
                console.log("Client authenticated");
            } else {
                ws.close();
                console.log("Authentication failed");
            }
        } else {
            // procesăm poziția
            const [x, y] = msg.split(',');
            if (x && y) {
                console.log(`Player -> x: ${x}, y: ${y}`);
            }
        }
    });

    ws.on('close', () => {
        console.log("Client disconnected");
    });
});
