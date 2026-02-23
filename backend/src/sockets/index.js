import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { registerRoomSocket } from "./roomSockets.js";

// In-memory room state
export const roomStates = {};

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN,
      credentials: true,
    },
  });

  // JWT Auth middleware for every socket connection
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      console.log("[Socket] Incoming connection, token present:", !!token);

      if (!token) return next(new Error("Authentication error: No token"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded._id).select("-password -refreshToken");

      if (!user) return next(new Error("Authentication error: User not found"));

      socket.user = user;
      console.log("[Socket] Authenticated:", user.username);
      next();
    } catch (err) {
      console.error("[Socket] Auth failed:", err.message);
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log("[Socket] Connected:", socket.user.username, socket.id);
    registerRoomSocket(io, socket, roomStates);

    socket.on("disconnect", () => {
      console.log("[Socket] Disconnected:", socket.user.username, socket.id);
    });
  });

  return io;
};