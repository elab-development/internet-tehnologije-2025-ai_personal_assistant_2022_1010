import type { Express } from "express";
import { createServer, type Server } from "http";
import { createProxyMiddleware } from "http-proxy-middleware";
import { spawn } from "child_process";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Start Python Backend
  // We use a shell to ensure we find uvicorn in the path (installed via pip)
  console.log("Attempting to start Python backend...");
  const pythonProcess = spawn("uvicorn", ["main:app", "--host", "0.0.0.0", "--port", "8000"], {
    stdio: "inherit", 
    shell: true 
  });

  pythonProcess.on('error', (err) => {
    console.error('Failed to start Python backend:', err);
  });
  
  // Proxy /api requests to Python backend
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://127.0.0.1:8000",
      changeOrigin: true,
      // We want to forward /api/xyz -> /api/xyz, so no path rewrite needed
    })
  );

  return httpServer;
}
