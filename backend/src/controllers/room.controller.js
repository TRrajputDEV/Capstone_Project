import { Room } from "../models/room.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// CREATE ROOM
const createRoom = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name?.trim()) throw new ApiError(400, "Room name is required");

  const room = await Room.create({
    name,
    createdBy: req.user._id,
    participants: [{ userId: req.user._id, role: "host" }],
  });

  return res
    .status(201)
    .json(new ApiResponse(201, room, "Room created successfully"));
});

// JOIN ROOM
const joinRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;

  const room = await Room.findOne({ roomId });
  if (!room) throw new ApiError(404, "Room not found");
  if (!room.isActive) throw new ApiError(400, "Room is no longer active");

  // Check if already a participant
  const alreadyIn = room.participants.find(
    (p) => p.userId.toString() === req.user._id.toString()
  );

  if (!alreadyIn) {
    room.participants.push({ userId: req.user._id, role: "participant" });
    await room.save();
  }

  return res
    .status(200)
    .json(new ApiResponse(200, room, "Joined room successfully"));
});

// GET ROOM (fetch strokes + chat on load)
const getRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;

  const room = await Room.findOne({ roomId })
    .populate("participants.userId", "username avatar")
    .populate("createdBy", "username");

  if (!room) throw new ApiError(404, "Room not found");

  // Only participants can fetch room data
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
  })
    .select("roomId name createdBy participants createdAt")
    .populate("createdBy", "username")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, rooms, "Rooms fetched successfully"));
});

export { createRoom, joinRoom, getRoom, getMyRooms };