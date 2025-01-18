import Status from "../models/status.model.js";
import cloudinary from "../lib/cloudinary.js";
import { io } from "../lib/socket.js";

export const createStatus = async (req, res) => {
  try {
    const { content, type } = req.body;
    const userId = req.user._id;

    let statusContent = content;

    if (type === "image" || type === "video") {
      const uploadResponse = await cloudinary.uploader.upload(content,{resource_type: 'auto'});
      statusContent = uploadResponse.secure_url;
    }

    const newStatus = new Status({
      userId,
      content: statusContent,
      type
    });

    await newStatus.save();

    // Notify all users about new status
    io.emit("newStatus", newStatus);

    res.status(201).json(newStatus);
  } catch (error) {
    console.log("Error in createStatus controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getStatuses = async (req, res) => {
  try {
    const statuses = await Status.find()
      .populate("userId", "fullName profilepic")
      .sort("-createdAt");

    res.status(200).json(statuses);
  } catch (error) {
    console.log("Error in getStatuses controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};



