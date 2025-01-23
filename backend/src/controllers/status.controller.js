import Status from "../models/status.model.js";
import cloudinary from "../lib/cloudinary.js";
import { io } from "../lib/socket.js";

export const createStatus = async (req, res) => {
  try {
    const { content, type } = req.body;
    const userId = req.user._id;

    // Retrieve the most recent status for the user
    const oldStatuses = await Status.find({ userId }).sort({ createdAt: -1 });

    let statusContent = content;

    if (type === "image" || type === "video") {
      const uploadResponse = await cloudinary.uploader.upload(content, { resource_type: 'auto' });
      statusContent = uploadResponse.secure_url;
    }

    // Create new status
    const newStatus = new Status({
      userId,
      content: statusContent,
      type,
    });

    await newStatus.save();

    // Notify all users about new status
    io.emit("newStatus", newStatus);

    // Send both old and new statuses grouped by user to frontend
    const groupedStatuses = [...oldStatuses, newStatus]; // Include the new status with old ones

    res.status(201).json({
      userId,
      statuses: groupedStatuses,
    });
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



