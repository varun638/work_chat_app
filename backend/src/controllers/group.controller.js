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

export const removeMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberId } = req.body;
    const adminId = req.user._id;

    // Find the group and verify admin
    const group = await Group.findOne({
      _id: groupId,
      admin: adminId,
    });

    if (!group) {
      return res.status(403).json({ message: "Not authorized to modify this group" });
    }

    // Remove member from group
    group.members = group.members.filter(
      (member) => member.toString() !== memberId
    );

    await group.save();

    // Return updated group with populated members
    const updatedGroup = await Group.findById(groupId)
      .populate("members", "fullName email profilepic")
      .populate("admin", "fullName email profilepic");

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("Error in removeMember:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const memberId = req.user._id; // The current user who wants to leave the group

    // Find the group
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if the member is part of the group
    if (!group.members.includes(memberId)) {
      return res.status(400).json({ message: "You are not a member of this group" });
    }

    // Remove the member from the group
    group.members = group.members.filter((member) => member.toString() !== memberId);

    // If the member is the admin, transfer admin rights to another member
    if (group.admin.toString() === memberId) {
      if (group.members.length > 0) {
        // Assign new admin as the first member in the list
        group.admin = group.members[0];
      } else {
        // If no members left, delete the group
        await Group.findByIdAndDelete(groupId);
        return res.status(200).json({ message: "Group deleted as the last member left" });
      }
    }

    await group.save();

    // Return the updated group with populated members
    const updatedGroup = await Group.findById(groupId)
      .populate("members", "fullName email profilepic")
      .populate("admin", "fullName email profilepic");

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("Error in leaveGroup:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};





export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const adminId = req.user._id;

    // Find the group and verify admin
    const group = await Group.findOne({
      _id: groupId,
      admin: adminId,
    });

    if (!group) {
      return res.status(403).json({ message: "Not authorized to delete this group" });
    }

    // Delete the group
    await Group.findByIdAndDelete(groupId);

    res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error("Error in deleteGroup:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

