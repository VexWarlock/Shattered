local websocket = require("websocket.server")
local json = require("dkjson") -- pentru a serializa date (opțional)

local SECRET_TOKEN = "mysecret123"
local positions = {}

-- Creăm serverul WebSocket pe portul Render (folosește $PORT)
local port = os.getenv("PORT") or 4342
local ws = websocket.server.sync({
    port = tonumber(port)
})

print("WebSocket server started on port " .. port)

for client in ws:clients() do
    -- client:send("Mesaj de bun venit") -- poți trimite imediat
end

while true do
    for client in ws:clients() do
        local message, err = client:receive()
        if message then
            local data = message:match("([^,]+),([^,]+)")
            if data then
                local x, y = message:match("([^,]+),([^,]+)")
                if x and y then
                    positions[client] = { x = tonumber(x), y = tonumber(y) }
                    print("Player " .. tostring(client) .. " -> x: " .. x .. " , y: " .. y)
                end
            elseif message == SECRET_TOKEN then
                client:send("OK")
            end
        elseif err then
            print("Client disconnected or error:", err)
            positions[client] = nil
        end
    end
end
