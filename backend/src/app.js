import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
import roomRouter from "./routes/room.routes.js";
import passport from "./config/passport.js";

const app = express();

// Dynamically handle CORS for local development AND production
app.use(cors({
  origin: process.env.CORS_ORIGIN === "*" ? "*" : process.env.CORS_ORIGIN?.split(","),
  credentials: true,
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(passport.initialize());

// Health Check Route (Render uses this to make sure your server is alive)
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running smoothly." });
});

// Main Routes
app.use("/api/auth", authRouter);
app.use("/api/rooms", roomRouter);

// Global error handler — MUST be last
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: err.errors || [],
  });
});

export { app };