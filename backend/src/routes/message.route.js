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
  addMember,
  createGroup,
  deleteGroup,
  exitGroup,
  getGroups,
  removeMember,
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
messageRoutes.post("/groups/:groupId/remove-member", protectRoute, removeMember);
messageRoutes.post("/groups/:groupId/add-member", protectRoute, addMember);
messageRoutes.post("/groups/:groupId/exit", protectRoute, exitGroup);
messageRoutes.delete('/groups/:groupId', protectRoute, deleteGroup); // Add the deleteGroup route
export default messageRoutes;