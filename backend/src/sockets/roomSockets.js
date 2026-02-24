import { Room } from "../models/room.model.js";

const SAVE_INTERVAL = 8000;
const saveIntervals = {};

const stopBatchSave = (roomId) => {
  if (saveIntervals[roomId]) {
    clearInterval(saveIntervals[roomId]);
    delete saveIntervals[roomId];
  }
};

const logActivity = (roomStates, roomId, type, username) => {
  if (!roomStates[roomId]) return null;
  roomStates[roomId].activityLog = roomStates[roomId].activityLog || [];
  const entry = { type, username, timestamp: Date.now() };
  roomStates[roomId].activityLog.push(entry);
  roomStates[roomId].unsavedChanges = true;
  return entry;
};

const saveRoom = async (roomId, state) => {
  await Room.findOneAndUpdate({ roomId }, {
    strokes: state.strokes,
    chat: state.chat,
    stickyNotes: state.stickyNotes || [],
    textNodes: state.textNodes || [],
    imageNodes: state.imageNodes || [],
    activityLog: state.activityLog || [],
    thumbnail: state.thumbnail || null,
  });
};

const startBatchSave = (roomId, roomStates) => {
  if (saveIntervals[roomId]) return;
  saveIntervals[roomId] = setInterval(async () => {
    const state = roomStates[roomId];
    if (!state || !state.unsavedChanges) return;
    try {
      await saveRoom(roomId, state);
      state.unsavedChanges = false;
      console.log(`[Save] Room ${roomId} saved`);
    } catch (err) {
      console.error(`[Save] Failed for ${roomId}:`, err.message);
    }
  }, SAVE_INTERVAL);
};

export const registerRoomSocket = (io, socket, roomStates) => {

  // ── JOIN ROOM ──────────────────────────────────────────
  socket.on("join-room", async ({ roomId }) => {
    try {
      const room = await Room.findOne({ roomId });
      if (!room) return socket.emit("error", { message: "Room not found" });
      if (room.isEnded) return socket.emit("error", { message: "This room has ended" });

      const isMember = room.participants.find(
        (p) => p.userId.toString() === socket.user._id.toString()
      );
      if (!isMember) return socket.emit("error", { message: "Not a member of this room" });

      if (room.isLocked && isMember.role !== "host") {
        return socket.emit("error", { message: "Room is locked" });
      }

      if (!roomStates[roomId]) {
        roomStates[roomId] = {
          strokes: room.strokes || [],
          chat: room.chat || [],
          stickyNotes: room.stickyNotes || [],
          textNodes: room.textNodes || [],
          imageNodes: room.imageNodes || [],
          activityLog: room.activityLog || [],
          users: [],
          unsavedChanges: false,
          thumbnail: room.thumbnail || null,
        };
      }

      const alreadyPresent = roomStates[roomId].users.find(
        (u) => u.userId.toString() === socket.user._id.toString()
      );
      if (!alreadyPresent) {
        roomStates[roomId].users.push({
          userId: socket.user._id,
          username: socket.user.username,
          socketId: socket.id,
          role: isMember.role,
          raisedHand: false,
        });
      } else {
        // Update socketId on reconnect
        alreadyPresent.socketId = socket.id;
      }

      socket.join(roomId);
      socket.currentRoom = roomId;

      socket.emit("room-state", {
        strokes: roomStates[roomId].strokes,
        chat: roomStates[roomId].chat,
        stickyNotes: roomStates[roomId].stickyNotes || [],
        textNodes: roomStates[roomId].textNodes || [],
        imageNodes: roomStates[roomId].imageNodes || [],
        activityLog: roomStates[roomId].activityLog || [],
      });

      const entry = logActivity(roomStates, roomId, "joined", socket.user.username);
      io.to(roomId).emit("presence-update", { users: roomStates[roomId].users });
      if (entry) io.to(roomId).emit("activity-update", { entry });
      socket.to(roomId).emit("user-joined", { username: socket.user.username });

      startBatchSave(roomId, roomStates);
    } catch (err) {
      console.error("[join-room]", err.message);
      socket.emit("error", { message: "Failed to join room" });
    }
  });

  // ── DRAW STROKE ────────────────────────────────────────
  socket.on("draw-stroke", ({ roomId, stroke }) => {
    if (!roomStates[roomId]) return;
    const fullStroke = { ...stroke, userId: socket.user._id, timestamp: Date.now() };
    roomStates[roomId].strokes.push(fullStroke);
    roomStates[roomId].unsavedChanges = true;
    // Broadcast to others only — sender already drew it locally
    socket.to(roomId).emit("receive-stroke", { stroke: fullStroke });
  });

  // ── THUMBNAIL ──────────────────────────────────────────
  socket.on("save-thumbnail", ({ roomId, thumbnail }) => {
    if (!roomStates[roomId]) return;
    roomStates[roomId].thumbnail = thumbnail;
    roomStates[roomId].unsavedChanges = true;
  });

  // ── CURSOR ─────────────────────────────────────────────
  socket.on("cursor-move", ({ roomId, x, y }) => {
    socket.to(roomId).emit("cursor-update", {
      userId: socket.user._id,
      username: socket.user.username,
      x, y,
    });
  });

  // ── UNDO ───────────────────────────────────────────────
  socket.on("undo", ({ roomId }) => {
    if (!roomStates[roomId]) return;
    const strokes = roomStates[roomId].strokes;
    for (let i = strokes.length - 1; i >= 0; i--) {
      if (strokes[i].userId?.toString() === socket.user._id.toString()) {
        strokes.splice(i, 1);
        break;
      }
    }
    roomStates[roomId].unsavedChanges = true;
    io.to(roomId).emit("stroke-undo", { strokes: roomStates[roomId].strokes });
  });

  // ── CLEAR BOARD ────────────────────────────────────────
  socket.on("clear-board", async ({ roomId }) => {
    if (!roomStates[roomId]) return;
    const room = await Room.findOne({ roomId });
    const participant = room?.participants.find(
      (p) => p.userId.toString() === socket.user._id.toString()
    );
    if (participant?.role !== "host") return socket.emit("error", { message: "Only host can clear" });

    roomStates[roomId].strokes = [];
    roomStates[roomId].stickyNotes = [];
    roomStates[roomId].textNodes = [];
    roomStates[roomId].imageNodes = [];
    roomStates[roomId].thumbnail = null;
    roomStates[roomId].unsavedChanges = true;

    const entry = logActivity(roomStates, roomId, "cleared", socket.user.username);
    io.to(roomId).emit("board-cleared");
    if (entry) io.to(roomId).emit("activity-update", { entry });
  });

  // ── CHAT ───────────────────────────────────────────────
  socket.on("send-message", ({ roomId, message }) => {
    if (!roomStates[roomId] || !message?.trim()) return;
    const chatMessage = {
      senderId: socket.user._id,
      senderName: socket.user.username,
      message: message.trim(),
      timestamp: Date.now(),
    };
    roomStates[roomId].chat.push(chatMessage);
    roomStates[roomId].unsavedChanges = true;
    io.to(roomId).emit("receive-message", { message: chatMessage });
  });

  // ── TYPING ─────────────────────────────────────────────
  socket.on("typing-start", ({ roomId }) => {
    socket.to(roomId).emit("user-typing", { username: socket.user.username });
  });
  socket.on("typing-stop", ({ roomId }) => {
    socket.to(roomId).emit("user-stopped-typing", { username: socket.user.username });
  });

  // ── RAISE HAND ─────────────────────────────────────────
  socket.on("raise-hand", ({ roomId }) => {
    if (!roomStates[roomId]) return;
    const u = roomStates[roomId].users.find(
      (u) => u.userId.toString() === socket.user._id.toString()
    );
    if (u) {
      u.raisedHand = !u.raisedHand;
      io.to(roomId).emit("hand-raised", { userId: socket.user._id, username: socket.user.username, raisedHand: u.raisedHand });
      io.to(roomId).emit("presence-update", { users: roomStates[roomId].users });
    }
  });

  // ── REACTIONS ──────────────────────────────────────────
  socket.on("send-reaction", ({ roomId, emoji }) => {
    io.to(roomId).emit("receive-reaction", {
      userId: socket.user._id,
      username: socket.user.username,
      emoji,
    });
  });

  // ── STICKY NOTES ───────────────────────────────────────
  socket.on("add-sticky", ({ roomId, note }) => {
    if (!roomStates[roomId]) return;
    const fullNote = { ...note, userId: socket.user._id, username: socket.user.username };
    roomStates[roomId].stickyNotes.push(fullNote);
    roomStates[roomId].unsavedChanges = true;
    io.to(roomId).emit("receive-sticky", { note: fullNote });
  });

  socket.on("update-sticky", ({ roomId, noteId, updates }) => {
    if (!roomStates[roomId]) return;
    const idx = roomStates[roomId].stickyNotes.findIndex((n) => n.id === noteId);
    if (idx !== -1) {
      roomStates[roomId].stickyNotes[idx] = { ...roomStates[roomId].stickyNotes[idx], ...updates };
      roomStates[roomId].unsavedChanges = true;
      socket.to(roomId).emit("sticky-updated", { noteId, updates });
    }
  });

  socket.on("delete-sticky", ({ roomId, noteId }) => {
    if (!roomStates[roomId]) return;
    roomStates[roomId].stickyNotes = roomStates[roomId].stickyNotes.filter((n) => n.id !== noteId);
    roomStates[roomId].unsavedChanges = true;
    io.to(roomId).emit("sticky-deleted", { noteId });
  });

  // ── TEXT NODES ─────────────────────────────────────────
  socket.on("add-text-node", ({ roomId, node }) => {
    if (!roomStates[roomId]) return;
    const fullNode = { ...node, userId: socket.user._id, username: socket.user.username };
    roomStates[roomId].textNodes = roomStates[roomId].textNodes || [];
    roomStates[roomId].textNodes.push(fullNode);
    roomStates[roomId].unsavedChanges = true;
    socket.to(roomId).emit("receive-text-node", { node: fullNode });
  });

  socket.on("update-text-node", ({ roomId, nodeId, updates }) => {
    if (!roomStates[roomId]) return;
    const idx = roomStates[roomId].textNodes?.findIndex((n) => n.id === nodeId);
    if (idx !== -1 && idx !== undefined) {
      roomStates[roomId].textNodes[idx] = { ...roomStates[roomId].textNodes[idx], ...updates };
      roomStates[roomId].unsavedChanges = true;
      socket.to(roomId).emit("text-node-updated", { nodeId, updates });
    }
  });

  socket.on("delete-text-node", ({ roomId, nodeId }) => {
    if (!roomStates[roomId]) return;
    roomStates[roomId].textNodes = roomStates[roomId].textNodes?.filter((n) => n.id !== nodeId) || [];
    roomStates[roomId].unsavedChanges = true;
    io.to(roomId).emit("text-node-deleted", { nodeId });
  });

  // ── IMAGE NODES ────────────────────────────────────────
  socket.on("add-image-node", ({ roomId, node }) => {
    if (!roomStates[roomId]) return;
    const fullNode = { ...node, userId: socket.user._id, username: socket.user.username };
    roomStates[roomId].imageNodes = roomStates[roomId].imageNodes || [];
    roomStates[roomId].imageNodes.push(fullNode);
    roomStates[roomId].unsavedChanges = true;
    socket.to(roomId).emit("receive-image-node", { node: fullNode });
  });

  socket.on("update-image-node", ({ roomId, nodeId, updates }) => {
    if (!roomStates[roomId]) return;
    const idx = roomStates[roomId].imageNodes?.findIndex((n) => n.id === nodeId);
    if (idx !== -1 && idx !== undefined) {
      roomStates[roomId].imageNodes[idx] = { ...roomStates[roomId].imageNodes[idx], ...updates };
      roomStates[roomId].unsavedChanges = true;
      socket.to(roomId).emit("image-node-updated", { nodeId, updates });
    }
  });

  socket.on("delete-image-node", ({ roomId, nodeId }) => {
    if (!roomStates[roomId]) return;
    roomStates[roomId].imageNodes = roomStates[roomId].imageNodes?.filter((n) => n.id !== nodeId) || [];
    roomStates[roomId].unsavedChanges = true;
    io.to(roomId).emit("image-node-deleted", { nodeId });
  });

  // ── KICK ───────────────────────────────────────────────
  socket.on("kick-participant", async ({ roomId, targetUserId }) => {
    const state = roomStates[roomId];
    if (!state) return;
    const room = await Room.findOne({ roomId });
    const requester = room?.participants.find(
      (p) => p.userId.toString() === socket.user._id.toString()
    );
    if (requester?.role !== "host") return socket.emit("error", { message: "Only host can kick" });

    const targetUser = state.users.find((u) => u.userId.toString() === targetUserId);
    if (targetUser) {
      io.to(targetUser.socketId).emit("kicked", { message: "You were removed by the host" });
      await Room.findOneAndUpdate({ roomId }, { $pull: { participants: { userId: targetUserId } } });
      state.users = state.users.filter((u) => u.userId.toString() !== targetUserId);
      const entry = logActivity(roomStates, roomId, "kicked", targetUser.username);
      io.to(roomId).emit("presence-update", { users: state.users });
      if (entry) io.to(roomId).emit("activity-update", { entry });
    }
  });

  // ── TOGGLE LOCK ────────────────────────────────────────
  socket.on("toggle-lock", async ({ roomId }) => {
    const room = await Room.findOne({ roomId });
    const requester = room?.participants.find(
      (p) => p.userId.toString() === socket.user._id.toString()
    );
    if (requester?.role !== "host") return socket.emit("error", { message: "Only host can lock" });
    room.isLocked = !room.isLocked;
    await room.save();
    const type = room.isLocked ? "locked" : "unlocked";
    const entry = logActivity(roomStates, roomId, type, socket.user.username);
    io.to(roomId).emit("room-locked", { isLocked: room.isLocked });
    if (entry) io.to(roomId).emit("activity-update", { entry });
  });

  // ── END ROOM ───────────────────────────────────────────
  socket.on("end-room", async ({ roomId }) => {
    const room = await Room.findOne({ roomId });
    const requester = room?.participants.find(
      (p) => p.userId.toString() === socket.user._id.toString()
    );
    if (requester?.role !== "host") return socket.emit("error", { message: "Only host can end" });

    const state = roomStates[roomId];
    if (state) {
      await saveRoom(roomId, { ...state, isEnded: true });
      await Room.findOneAndUpdate({ roomId }, { isEnded: true });
    }
    io.to(roomId).emit("room-ended", { message: "Host ended the session" });
    stopBatchSave(roomId);
    delete roomStates[roomId];
  });

  // ── LEAVE ──────────────────────────────────────────────
  socket.on("leave-room", ({ roomId }) => handleLeave(io, socket, roomId, roomStates));
  socket.on("disconnect", () => {
    if (socket.currentRoom) handleLeave(io, socket, socket.currentRoom, roomStates);
  });
};

const handleLeave = async (io, socket, roomId, roomStates) => {
  if (!roomStates[roomId]) return;

  roomStates[roomId].users = roomStates[roomId].users.filter(
    (u) => u.socketId !== socket.id
  );
  socket.leave(roomId);

  const entry = logActivity(roomStates, roomId, "left", socket.user.username);
  io.to(roomId).emit("presence-update", { users: roomStates[roomId].users });
  if (entry) io.to(roomId).emit("activity-update", { entry });
  socket.to(roomId).emit("user-left", { username: socket.user.username });

  if (roomStates[roomId].users.length === 0) {
    try {
      await saveRoom(roomId, roomStates[roomId]);
    } catch (err) {
      console.error(`[Leave] Final save failed:`, err.message);
    }
    stopBatchSave(roomId);
    delete roomStates[roomId];
  }
};