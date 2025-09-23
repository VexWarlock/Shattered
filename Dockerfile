# Folosim Ubuntu 20.04 pentru compatibilitate lua-websockets
FROM ubuntu:20.04

# Instalăm Lua 5.1, LuaRocks și unelte build (fără tzdata)
RUN apt-get update && \
    apt-get install -y lua5.1 lua5.1-dev luarocks git build-essential && \
    apt-get clean

# Instalăm dependențele Lua
RUN luarocks install luabitop
RUN luarocks install lua-websockets

# Setăm directorul de lucru
WORKDIR /app
COPY server.lua .

# Expunem portul Render
EXPOSE 4342

# Comanda de start
CMD ["lua5.1", "server.lua"]
