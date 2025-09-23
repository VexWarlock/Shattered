local socket = require("socket")

-- Portul este dat de Render prin variabila de mediu PORT
local port = tonumber(os.getenv("PORT")) or 4342
local server = assert(socket.bind("*", port))
server:settimeout(0)

local clients = {}
local positions = {}

print("Server started on port: " .. port .. "...")

while true do
    -- Acceptă clienți noi
    local client = server:accept()
    if client then
        client:settimeout(0)
        table.insert(clients, client)
        print("Player connected!")
    end

    -- Procesează clienții existenți
    for i = #clients, 1, -1 do
        local c = clients[i]
        local line, err = c:receive("*l")
        if line then
            local x, y = line:match("([^,]+),([^,]+)")
            if x and y then
                positions[c] = { x = tonumber(x), y = tonumber(y) }
                print("Player " .. tostring(c) .. " -> x: " .. x .. " , y: " .. y)
            end
        elseif err == "closed" then
            print("Player left!")
            table.remove(clients, i)
            positions[c] = nil
        end
    end

    socket.sleep(0.01)
end
