# Folosim o imagine cu Lua preinstalat
FROM ubuntu:22.04

# Instalăm Lua și LuaRocks
RUN apt-get update && apt-get install -y lua5.3 luarocks git build-essential

# Instalăm lua-websockets
RUN luarocks install lua-websockets

# Copiem codul serverului
WORKDIR /app
COPY server.lua .

# Setăm portul
ENV PORT=4342

# Expunem portul
EXPOSE 4342

# Comanda de start
CMD ["lua", "server.lua"]
