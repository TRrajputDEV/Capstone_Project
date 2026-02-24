import dotenv from "dotenv";
import { createServer } from "http";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import { initSocket } from "./sockets/index.js";

dotenv.config({
  path: new URL("../.env", import.meta.url).pathname,
});

const PORT = process.env.PORT || 8000;

const httpServer = createServer(app);

// Initialize Socket.io
const io = initSocket(httpServer);

// Connect to MongoDB and start server
connectDB()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`⚙️  Server running on port ${PORT}`);
      console.log(`🔗 CORS Origin allowed: ${process.env.CORS_ORIGIN}`);
    });
  })
  .catch((err) => {
    console.error("❌ DB connection failed, server not started:", err);
  });