import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// used to store online users and their group memberships
const userSocketMap = {}; // {userId: socketId}
const userGroups = new Map(); // Keep track of which groups each user is in

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
    
    // Join user to their groups
    socket.on("joinGroup", (groupId) => {
      socket.join(groupId);
      if (!userGroups.has(userId)) {
        userGroups.set(userId, new Set());
      }
      userGroups.get(userId).add(groupId);
      console.log(`User ${userId} joined group ${groupId}`);
    });

    // Handle group messages
    socket.on("groupMessage", ({ groupId, message }) => {
      // Broadcast to all users in the group except sender
      socket.to(groupId).emit("newGroupMessage", {
        groupId,
        message: {
          ...message,
          senderId: userId,
          timestamp: new Date(),
        },
      });
    });

    // Handle user leaving groups
    socket.on("leaveGroup", (groupId) => {
      socket.leave(groupId);
      if (userGroups.has(userId)) {
        userGroups.get(userId).delete(groupId);
      }
      console.log(`User ${userId} left group ${groupId}`);
    });
  }

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    // Clean up user's group memberships
    if (userGroups.has(userId)) {
      for (const groupId of userGroups.get(userId)) {
        socket.leave(groupId);
      }
      userGroups.delete(userId);
    }
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };