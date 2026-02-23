import bcrypt from "bcryptjs";
import { Room } from "../models/room.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// CREATE ROOM
const createRoom = asyncHandler(async (req, res) => {
  const { name, password } = req.body;

  if (!name?.trim()) throw new ApiError(400, "Room name is required");

  const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

  const room = await Room.create({
    name,
    password: hashedPassword,
    createdBy: req.user._id,
    participants: [{ userId: req.user._id, role: "host" }],
  });

  console.log("[Room] Created:", room.roomId, "by", req.user.username);

  return res
    .status(201)
    .json(new ApiResponse(201, room, "Room created successfully"));
});

// JOIN ROOM
const joinRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const { password } = req.body;

  const room = await Room.findOne({ roomId });
  if (!room) throw new ApiError(404, "Room not found");
  if (room.isEnded) throw new ApiError(400, "This room has ended");
  if (room.isLocked) throw new ApiError(403, "Room is locked by the host");

  // Check password if room is password protected
  if (room.password) {
    if (!password) throw new ApiError(401, "This room requires a password");
    const isValid = await bcrypt.compare(password, room.password);
    if (!isValid) throw new ApiError(401, "Incorrect room password");
  }

  const alreadyIn = room.participants.find(
    (p) => p.userId.toString() === req.user._id.toString()
  );

  if (!alreadyIn) {
    room.participants.push({ userId: req.user._id, role: "participant" });
    await room.save();
  }

  console.log("[Room] Joined:", roomId, "by", req.user.username);

  return res
    .status(200)
    .json(new ApiResponse(200, room, "Joined room successfully"));
});

// GET ROOM
const getRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;

  const room = await Room.findOne({ roomId })
    .populate("participants.userId", "username avatar")
    .populate("createdBy", "username");

  if (!room) throw new ApiError(404, "Room not found");

  const isMember = room.participants.find(
    (p) => p.userId._id.toString() === req.user._id.toString()
  );
  if (!isMember) throw new ApiError(403, "You are not a member of this room");

  return res
    .status(200)
    .json(new ApiResponse(200, room, "Room fetched successfully"));
});

// GET MY ROOMS
const getMyRooms = asyncHandler(async (req, res) => {
  const rooms = await Room.find({
    "participants.userId": req.user._id,
    isEnded: false,
  })
    .select("roomId name createdBy participants createdAt isLocked password")
    .populate("createdBy", "username")
    .sort({ createdAt: -1 });

  // Map hasPassword flag — don't expose actual hash
  const sanitized = rooms.map((r) => ({
    ...r.toObject(),
    hasPassword: !!r.password,
    password: undefined,
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, sanitized, "Rooms fetched successfully"));
});

// DELETE ROOM — host only
const deleteRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;

  const room = await Room.findOne({ roomId });
  if (!room) throw new ApiError(404, "Room not found");

  if (room.createdBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only host can delete this room");
  }

  room.isEnded = true;
  await room.save();

  console.log("[Room] Ended:", roomId, "by", req.user.username);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Room ended successfully"));
});

export { createRoom, joinRoom, getRoom, getMyRooms, deleteRoom };