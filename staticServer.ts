const server = Bun.serve({
    port:8080,
    fetch(req) {
        const url = new URL(req.url);
        if (url.pathname === "/") return new Response(Bun.file("index.html"));
        if (url.pathname === "/blog") return new Response("Blog!");
        return new Response("404!");
    },
});

console.log(server.port)
