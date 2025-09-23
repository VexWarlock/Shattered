# Folosim Ubuntu cu Lua și LuaRocks
FROM ubuntu:22.04

# Instalăm Lua, LuaRocks și unelte build
RUN apt-get update && \
    apt-get install -y lua5.3 luarocks git build-essential && \
    apt-get clean

# Instalăm lua-websockets
RUN luarocks install lua-websockets

# Setăm directorul de lucru
WORKDIR /app

# Copiem server.lua
COPY server.lua .

# Expunem portul Render
EXPOSE 4342

# Comanda de start
CMD ["lua", "server.lua"]
