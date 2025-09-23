FROM ubuntu:20.04

RUN apt-get update && \
    apt-get install -y lua5.1 lua5.1-dev luarocks git build-essential && \
    apt-get clean

RUN luarocks install luabitop
RUN luarocks install lua-websockets

WORKDIR /app
COPY server.lua .

EXPOSE 4342
CMD ["lua5.1", "server.lua"]
