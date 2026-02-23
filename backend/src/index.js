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
// Socket.io will attach to httpServer in Phase 4

const io = initSocket(httpServer);

connectDB()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("DB connection failed, server not started:", err);
  });