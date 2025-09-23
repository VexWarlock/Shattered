local socket = require("socket")
local server = assert(socket.bind("*", 4342))
server:settimeout(0)

local clients = {}
local positions = {}

-- Token secret
local SECRET_TOKEN = "mysecret123"

print("Server started on port 4342...")

while true do
    local client = server:accept()
    if client then
        client:settimeout(0)
        -- marcați clientul ca "neautentificat" la început
        clients[client] = { authenticated = false }
        print("Player connected! Waiting for authentication...")
    end

    for c, data in pairs(clients) do
        local line, err = c:receive("*l")
        if line then
            if not data.authenticated then
                -- verificăm token-ul
                if line == SECRET_TOKEN then
                    data.authenticated = true
                    print("Player authenticated!")
                else
                    print("Authentication failed. Disconnecting client.")
                    c:close()
                    clients[c] = nil
                end
            else
                -- clientul este autentificat, procesăm poziția
                local x, y = line:match("([^,]+),([^,]+)")
                if x and y then
                    positions[c] = { x = tonumber(x), y = tonumber(y) }
                    print("Player " .. tostring(c) .. " -> x: " .. x .. " , y: " .. y)
                end
            end
        elseif err == "closed" then
            print("Player left!")
            clients[c] = nil
            positions[c] = nil
        elseif err == "timeout" then
            -- nimic, clientul e încă conectat
        else
            print("Other error:", err)
        end
    end

    socket.sleep(0.01)
end
