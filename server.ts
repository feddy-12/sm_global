
import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import twilio from "twilio";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

console.log("Environment check - SID present:", !!process.env.TWILIO_ACCOUNT_SID);

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sm_global_express',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function checkDbConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ MySQL Connected successfully");
    connection.release();
    return true;
  } catch (err: any) {
    console.error("❌ MySQL Connection failed:", err.message);
    return false;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/debug-twilio", (req, res) => {
    res.json({
      hasSid: !!process.env.TWILIO_ACCOUNT_SID,
      hasToken: !!process.env.TWILIO_AUTH_TOKEN,
      hasPhone: !!process.env.TWILIO_PHONE_NUMBER,
      hasDb: !!process.env.DB_NAME,
      envPath: path.join(process.cwd(), ".env")
    });
  });

  // Fetch all data from DB
  app.get("/api/data", async (req, res) => {
    try {
      const connection = await pool.getConnection();
      try {
        const [parcels] = await connection.execute("SELECT * FROM parcels ORDER BY createdAt DESC");
        const [customers] = await connection.execute("SELECT * FROM customers");
        const [users] = await connection.execute("SELECT * FROM users");
        res.json({ parcels, customers, users });
      } finally {
        connection.release();
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Login Endpoint
  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const [rows]: any = await pool.execute("SELECT * FROM users WHERE email = ?", [email]);
      if (rows.length === 0) {
        return res.status(401).json({ error: "Usuario no encontrado" });
      }
      const user = rows[0];
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        const { password, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
      } else {
        res.status(401).json({ error: "Contraseña incorrecta" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Sync Endpoint
  app.post("/api/sync", async (req, res) => {
    const { parcels, customers, users } = req.body;
    console.log(`Syncing: ${parcels?.length} parcels, ${customers?.length} customers, ${users?.length} users`);

    try {
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // Sync Customers
        if (customers && customers.length > 0) {
          for (const c of customers) {
            await connection.execute(
              `INSERT INTO customers (id, fullName, phone, address, dni, email) 
               VALUES (?, ?, ?, ?, ?, ?) 
               ON DUPLICATE KEY UPDATE fullName=VALUES(fullName), phone=VALUES(phone), address=VALUES(address), email=VALUES(email)`,
              [c.id, c.fullName, c.phone, c.address, c.dni, c.email || null]
            );
          }
        }

        // Sync Users
        if (users && users.length > 0) {
          for (const u of users) {
            let passwordToStore = u.password || '123';
            // Solo encriptar si no parece ser un hash ya existente (bcrypt hashes start with $2)
            if (passwordToStore && !passwordToStore.startsWith('$2')) {
              passwordToStore = await bcrypt.hash(passwordToStore, 10);
            }

            await connection.execute(
              `INSERT INTO users (id, name, email, role, branch, password) 
               VALUES (?, ?, ?, ?, ?, ?) 
               ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role), branch=VALUES(branch), password=VALUES(password)`,
              [u.id, u.name, u.email, u.role, u.branch, passwordToStore]
            );
          }
        }

        // Sync Parcels
        if (parcels && parcels.length > 0) {
          for (const p of parcels) {
            await connection.execute(
              `INSERT INTO parcels (id, trackingCode, senderId, receiverName, receiverPhone, receiverAddress, weight, type, cost, status, paymentMethod, paymentStatus, origin, destination, createdAt, branch, createdById) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
               ON DUPLICATE KEY UPDATE status=VALUES(status), paymentStatus=VALUES(paymentStatus), cost=VALUES(cost), weight=VALUES(weight)`,
              [
                p.id, p.trackingCode, p.senderId, p.receiverName, p.receiverPhone, 
                p.receiverAddress, p.weight, p.type, p.cost, p.status, 
                p.paymentMethod, p.paymentStatus, p.origin, p.destination, 
                p.createdAt.slice(0, 19).replace('T', ' '), p.branch, p.createdById
              ]
            );

            // Sync History for this parcel
            if (p.history && p.history.length > 0) {
              for (const h of p.history) {
                await connection.execute(
                  `INSERT INTO tracking_history (parcelId, status, note, updatedAt) 
                   VALUES (?, ?, ?, ?)`,
                  [p.id, h.status, h.note || '', h.date.slice(0, 19).replace('T', ' ')]
                );
              }
            }
          }
        }

        await connection.commit();
        res.json({ success: true, message: "Sincronización completada" });
      } catch (err: any) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } catch (error: any) {
      console.error("Sync Error:", error);
      res.status(500).json({ error: "Error de base de datos: " + error.message });
    }
  });

  // API Route for Twilio SMS
  app.post("/api/notify-sms", async (req, res) => {
    console.log("SMS Request received:", req.body);
    const { to, message } = req.body;

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      console.error("Twilio credentials missing:", {
        hasSid: !!accountSid,
        hasToken: !!authToken,
        hasPhone: !!fromNumber
      });
      return res.status(500).json({ error: "Configuración de Twilio incompleta en el servidor." });
    }

    try {
      const client = twilio(accountSid, authToken);
      const response = await client.messages.create({
        body: message,
        from: fromNumber,
        to: to,
      });

      console.log(`SMS sent: ${response.sid}`);
      res.json({ success: true, sid: response.sid });
    } catch (error: any) {
      console.error("Twilio Error:", error);
      res.status(500).json({ error: error.message || "Error al enviar el SMS." });
    }
  });

  // Vite middleware for development or if dist is missing
  const isProduction = process.env.NODE_ENV === "production";
  const distPath = path.join(__dirname, "dist");
  const distExists = await import("fs").then(fs => fs.existsSync(distPath));

  if (!isProduction || !distExists) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    
    app.use(vite.middlewares);
    
    // Manual SPA Fallback for Development
    app.use(async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) return next();
      
      try {
        const fs = await import("fs/promises");
        let template = await fs.readFile(path.resolve(__dirname, "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
    
    console.log(`Vite middleware loaded (${!isProduction ? 'Development' : 'Production fallback because dist/ is missing'})`);
  } else {
    app.use(express.static(distPath));
    // SPA Fallback for production
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static files from dist/ in production mode");
  }

  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    await checkDbConnection();
  });
}

startServer();
