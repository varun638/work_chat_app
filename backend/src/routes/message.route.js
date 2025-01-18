import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { 
  deleteMessage, 
  forwardMessage, 
  getMessages, 
  getUsersForSidebar, 
  searchUsers, 
  sendMessage 
} from "../controllers/message.controller.js";
import {
  createGroup,
  getGroups,
} from "../controllers/group.controller.js";

const messageRoutes = express.Router();

// Direct message routes
messageRoutes.get("/users", protectRoute, getUsersForSidebar);
messageRoutes.get("/msg/:id/:groupname?", protectRoute, getMessages);
messageRoutes.post("/send/:id", protectRoute, sendMessage);
messageRoutes.get("/search", protectRoute, searchUsers);
messageRoutes.delete("/delete/:messageId", protectRoute, deleteMessage);
messageRoutes.post("/forward", protectRoute, forwardMessage);

// Group routes
messageRoutes.post("/groups", protectRoute, createGroup);
messageRoutes.get("/getgroups/messages", protectRoute, getGroups);
export default messageRoutes;