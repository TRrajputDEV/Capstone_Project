import { Router } from "express";
import {
  createRoom, joinRoom, getRoom,
  getMyRooms, deleteRoom
} from "../controllers/room.controller.js";
import { generateAiCanvas } from "../controllers/ai.controller.js"; // 🔴 ADDED
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

router.post("/create", createRoom);
router.post("/join/:roomId", joinRoom);
router.get("/my-rooms", getMyRooms);
router.get("/:roomId", getRoom);
router.delete("/:roomId", deleteRoom);

// 🔴 ADDED: New AI Route
router.post("/ai/generate", generateAiCanvas);

export default router;