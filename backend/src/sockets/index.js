import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { registerRoomSocket } from "./roomSockets.js";

const roomStates = {};

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN === "*" ? "*" : process.env.CORS_ORIGIN?.split(","),
      methods: ["GET", "POST"],
      credentials: true
    },
    maxHttpBufferSize: 1e8 // Allows large image uploads
  });

  // 🔴 RESTORED: Authentication Middleware
  // This intercepts the connection, verifies the token, and attaches the User to the socket
  io.use(async (socket, next) => {
    try {
      // Get token from the frontend auth payload
      const token = socket.handshake.auth?.token;
      
      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find the user in the database
      const user = await User.findById(decoded._id).select("-password -refreshToken").lean();
      
      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      // Attach the verified user to the socket object!
      socket.user = user; 
      next();
    } catch (err) {
      console.error("[Socket Auth Error]:", err.message);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    // Now socket.user actually exists!
    console.log(`[Socket Connected] User: ${socket.user?.username || "Unknown"} (ID: ${socket.id})`);

    // Register all room-specific socket events
    registerRoomSocket(io, socket, roomStates);

    socket.on("disconnect", () => {
      console.log(`[Socket Disconnected] ID: ${socket.id}`);
    });
  });

  return io;
};