import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const strokeSchema = new mongoose.Schema({
  type: { type: String, enum: ["draw", "erase", "shape", "text", "image"], required: true },
  points: [{ x: Number, y: Number }],
  color: String, size: Number,
  shapeType: { type: String, enum: ["rect", "circle", "line", "arrow"], default: null },
  x1: Number, y1: Number, x2: Number, y2: Number,
  text: String, x: Number, y: Number, fontSize: Number,
  imageData: String, imgX: Number, imgY: Number, imgWidth: Number, imgHeight: Number,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const stickyNoteSchema = new mongoose.Schema({
  id: String, text: String, color: String,
  x: Number, y: Number,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  username: String,
}, { _id: false });

const textNodeSchema = new mongoose.Schema({
  id: String, text: String, color: String,
  fontSize: Number, x: Number, y: Number,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  username: String,
}, { _id: false });

const imageNodeSchema = new mongoose.Schema({
  id: String, src: String,
  x: Number, y: Number,
  width: Number, height: Number,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  username: String,
}, { _id: false });

const chatSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  senderName: String, message: String,
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const activitySchema = new mongoose.Schema({
  type: { type: String, enum: ["joined", "left", "kicked", "locked", "unlocked", "cleared"] },
  username: String,
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const roomSchema = new mongoose.Schema({
  roomId: { type: String, unique: true, default: () => uuidv4().slice(0, 8).toUpperCase() },
  name: { type: String, required: true, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  participants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    role: { type: String, enum: ["host", "participant"], default: "participant" },
  }],
  strokes: [strokeSchema],
  stickyNotes: [stickyNoteSchema],
  textNodes: [textNodeSchema],
  imageNodes: [imageNodeSchema],
  chat: [chatSchema],
  activityLog: [activitySchema],
  thumbnail: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  isLocked: { type: Boolean, default: false },
  isEnded: { type: Boolean, default: false },
  password: { type: String, default: null },
}, { timestamps: true });

export const Room = mongoose.model("Room", roomSchema);