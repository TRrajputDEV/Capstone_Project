import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const strokeSchema = new mongoose.Schema({
  type: { type: String, enum: ["draw", "erase"], required: true },
  points: [{ x: Number, y: Number }],
  color: String,
  size: Number,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const chatSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  senderName: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    unique: true,
    default: () => uuidv4().slice(0, 8).toUpperCase(),
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  participants: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      role: { type: String, enum: ["host", "participant"], default: "participant" },
    },
  ],
  strokes: [strokeSchema],
  chat: [chatSchema],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const Room = mongoose.model("Room", roomSchema);