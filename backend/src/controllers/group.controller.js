import Group from "../models/group.model.js";

export const createGroup = async (req, res) => {
  try {
    const { name, members } = req.body;
    const admin = req.user._id;

    if (!name || !members || members.length < 2) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    // Add admin to members if not already included
    if (!members.includes(admin)) {
      members.push(admin);
    }

    const newGroup = new Group({
      name,
      members,
      admin,
    });

    await newGroup.save();

    // Populate members info
    const populatedGroup = await Group.findById(newGroup._id)
      .populate("members", "fullName email profilepic")
      .populate("admin", "fullName email profilepic");

    res.status(201).json(populatedGroup);
  } catch (error) {
    console.error("Error in createGroup:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getGroups = async (req, res) => {
  try {
    const userId = req.user._id;
    const groups = await Group.find({ members: userId })
      .populate("members", "fullName email profilepic")
      .populate("admin", "fullName email profilepic")
      .populate("lastMessage");

    res.status(200).json(groups);
  } catch (error) {
    console.error("Error in getGroups:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



