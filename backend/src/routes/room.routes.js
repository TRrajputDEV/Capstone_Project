import { Router } from "express";
import { createRoom, joinRoom, getRoom, getMyRooms } from "../controllers/room.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All room routes are protected
router.use(verifyJWT);

router.post("/create", createRoom);
router.post("/join/:roomId", joinRoom);
router.get("/my-rooms", getMyRooms);
router.get("/:roomId", getRoom);

export default router;