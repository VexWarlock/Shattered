-- server.lua
local websocket = require("websocket")
local server = require("websocket.server")

local SECRET_TOKEN = "mysecret123"
local positions = {}

-- Folosim portul setat de Render sau fallback 4342
local port = tonumber(os.getenv("PORT") or 4342)
local ws = server.sync({ port = port })

print("WebSocket server started on port " .. port)

while true do
    for client in ws:clients() do
        local message, err = client:receive()
        if message then
            -- Verificăm autentificarea
            if message == SECRET_TOKEN then
                client:send("OK")
                print("Client authenticated")
            else
                -- Parsează coordonatele
                local x, y = message:match("([^,]+),([^,]+)")
                if x and y then
                    positions[client] = { x = tonumber(x), y = tonumber(y) }
                    print("Player " .. tostring(client) .. " -> x: " .. x .. " , y: " .. y)
                end
            end
        elseif err then
            print("Client disconnected or error:", err)
            positions[client] = nil
        end
    end
end
