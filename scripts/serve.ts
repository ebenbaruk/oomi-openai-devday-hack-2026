import { loadEnvConfig } from "@next/env";
import { createServer } from "node:http";
import next from "next";
import { WebSocketServer } from "ws";
import { getConfig } from "../src/server/config";
import { authenticated, trustedOrigin } from "../src/server/auth";
import { attachDevice } from "../src/server/voice/connection";

loadEnvConfig(process.cwd());
async function main() {
  const dev = !process.argv.includes("--production");
  const port = Number(process.env.PORT ?? 3000);
  const app = next({ dev, hostname: "localhost", port });
  await app.prepare();
  const handler = app.getRequestHandler();
  const server = createServer((req, res) => { void handler(req, res); });
  const sockets = new WebSocketServer({ noServer: true, maxPayload: 60_000 });
  server.on("upgrade", (req, socket, head) => {
    if (req.url?.split("?")[0] !== "/api/voice") { void app.getUpgradeHandler()(req, socket, head); return; }
    try {
      const config = getConfig();
      if (!trustedOrigin(req.headers.origin, config) || !authenticated(req.headers.cookie, config)) {
        socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n"); socket.destroy(); return;
      }
      sockets.handleUpgrade(req, socket, head, ws => attachDevice(ws, config));
    } catch { socket.write("HTTP/1.1 503 Service Unavailable\r\nConnection: close\r\n\r\n"); socket.destroy(); }
  });
  server.listen(port, "127.0.0.1", () => console.log(`Oomi ready at http://localhost:${port}`));
  const stop = () => { sockets.clients.forEach(ws => ws.close()); server.close(); void app.close().finally(() => process.exit()); };
  process.on("SIGINT", stop); process.on("SIGTERM", stop);
}
main().catch(() => { console.error("Server startup failed."); process.exitCode = 1; });
