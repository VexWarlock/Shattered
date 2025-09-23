FROM debian:bullseye

RUN apt-get update && apt-get install -y lua5.3 luarocks && \
    luarocks install luasocket && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .

EXPOSE $PORT

CMD ["lua5.3", "server.lua"]
