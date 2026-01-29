import type { Express, Request, Response } from "express";
import type { Server } from "http";
import { spawn } from "child_process";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Start Python Backend
  console.log("Attempting to start Python backend...");
  const pythonProcess = spawn("uvicorn", ["main:app", "--host", "0.0.0.0", "--port", "8000"], {
    stdio: "inherit", 
    shell: true 
  });

  pythonProcess.on('error', (err) => {
    console.error('Failed to start Python backend:', err);
  });

  // Wait for Python to start
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Proxy API requests to Python backend using fetch
  app.use("/api", async (req: Request, res: Response) => {
    try {
      const url = `http://127.0.0.1:8000${req.originalUrl}`;
      const headers: Record<string, string> = {};
      
      // Forward relevant headers
      if (req.headers['content-type']) {
        headers['Content-Type'] = req.headers['content-type'] as string;
      }
      if (req.headers['authorization']) {
        headers['Authorization'] = req.headers['authorization'] as string;
      }

      const options: RequestInit = {
        method: req.method,
        headers,
      };

      // Add body for non-GET requests
      if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
        options.body = JSON.stringify(req.body);
      }

      const response = await fetch(url, options);
      const contentType = response.headers.get('content-type');
      
      res.status(response.status);
      
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        res.json(data);
      } else {
        const text = await response.text();
        res.send(text);
      }
    } catch (error) {
      console.error('Proxy error:', error);
      res.status(502).json({ message: 'Backend unavailable' });
    }
  });

  return httpServer;
}
