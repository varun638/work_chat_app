import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    console.log("getMessages",req.params)
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    if(req.params?.groupname){
      const messages = await Message.find({
       
        groupName: req.params?.groupname  // Replace 'givenGroupName' with the actual group name you're querying for
      });
      res.status(200).json(messages);
    }else{
      const messages = await Message.find({
        $or: [
          { senderId: myId, receiverId: userToChatId },
          { senderId: userToChatId, receiverId: myId },
        ],
      })
      res.status(200).json(messages);
    }

    ;

    
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const searchUsers = async (req, res) => {
  const { query } = req.query;
  try {
    const loggedInUserId = req.user._id;

    const users = await User.find({
      $and: [
        { _id: { $ne: loggedInUserId } },
        {
          $or: [
            { fullName: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } },
          ],
        },
      ],
    }).select("-password");

    res.status(200).json(users);
  } catch (error) {
    console.error("Error in searchUsers controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image,groupName,profile } = req.body;
    console.log("groupName",req.body)
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image,{resource_type: 'auto'});
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      groupName,
      image: imageUrl,
      profile
    });

    await newMessage.save();
    if(groupName){
      io.emit("grpMessage", newMessage);
    }else{
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage);
      }

    }

    
    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  try {
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    const isAuthorized = [message.senderId.toString(), message.receiverId.toString()].includes(userId.toString());
    if (!isAuthorized) {
      return res.status(403).json({ error: "Not authorized to delete this message" });
    }

    await Message.deleteOne({ _id: messageId });

    // Notify other users about message deletion
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    const senderSocketId = getReceiverSocketId(message.senderId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", { messageId });
    }

    if (senderSocketId) {
      io.to(senderSocketId).emit("messageDeleted", { messageId });
    }

    return res.status(200).json({ 
      success: true,
      message: "Message deleted successfully" 
    });

  } catch (error) {
    console.error("Delete message error:", error);
    return res.status(500).json({ 
      success: false,
      error: "Failed to delete message" 
    });
  }
};


export const forwardMessage = async (req, res) => {
  try {
    const { messageId} = req.body; 
    const senderId = req.user._id;

    // Find the message that is being forwarded
    const messageToForward = await Message.findOne({_id:messageId.messageId});
    console.log("forward",messageToForward)
    if (!messageToForward) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Create a new forwarded message
    const forwardedMessage = new Message({
      senderId,
      receiverId:messageId.receiverId,
      text: messageToForward.text,
      image: messageToForward.image, 
    });

    await forwardedMessage.save();

    // Send the forwarded message to the receiver via socket
    const receiverSocketId = getReceiverSocketId(messageId.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", forwardedMessage);
    }

    res.status(201).json(forwardedMessage);
  } catch (error) {
    console.log("Error in forwardMessage controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};








