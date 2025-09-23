FROM ubuntu:22.04

# Instalăm Lua, LuaRocks și unelte build + header files pentru Lua
RUN apt-get update && \
    apt-get install -y lua5.3 lua5.3-dev luarocks git build-essential && \
    apt-get clean

# Instalăm lua-websockets
RUN luarocks install lua-websockets

WORKDIR /app
COPY server.lua .

EXPOSE 4342

CMD ["lua", "server.lua"]
