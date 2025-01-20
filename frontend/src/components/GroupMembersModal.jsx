import { X, UserMinus, LogOut, Trash2 } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";

const GroupMembersModal = ({ isOpen, onClose, group }) => {
  const { authUser } = useAuthStore();
  const { removeMember, leaveGroup, deleteGroup, setSelectedUser } = useChatStore();
  const isAdmin = group?.admin?._id === authUser?._id;

  if (!isOpen || !group) return null;

  const handleRemoveMember = async (memberId) => {
    if (!isAdmin) {
      toast.error("Only admin can remove members");
      return;
    }

    if (memberId === group.admin._id) {
      toast.error("Cannot remove admin from group");
      return;
    }

    try {
      await removeMember(group._id, memberId);
      toast.success("Member removed successfully");
    } catch (error) {
      toast.error("Failed to remove member");
    }
  };

  const handleLeaveGroup = async () => {
    try {
      // Make the user leave the group
      await leaveGroup(group._id);
  
      setSelectedUser(null); // Clear selected user after leaving the group
      onClose();
      toast.success("You have left the group");
    } catch (error) {
      toast.error("Failed to leave group");
    }
  };

  const handleDeleteGroup = async () => {
    if (!isAdmin) {
      toast.error("Only admin can delete the group");
      return;
    }

    if (window.confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
      try {
        await deleteGroup(group._id);
        setSelectedUser(null); // Clear selected user after deletion
        onClose();
        toast.success("Group deleted successfully");
      } catch (error) {
        toast.error("Failed to delete group");
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-lg w-[95%] max-w-md p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Group Members</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Admin Section */}
          <div className="p-3 bg-base-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={group.admin.profilepic || "/avatar.png"}
                  alt={group.admin.fullName}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium">{group.admin.fullName}</p>
                  <p className="text-sm text-base-content/70">Admin</p>
                </div>
              </div>
            </div>
          </div>

          {/* Members List */}
          <div className="space-y-2">
            {group.members
              .filter((member) => member._id !== group.admin._id)
              .map((member) => (
                <div
                  key={member._id}
                  className="p-3 bg-base-200 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={member.profilepic || "/avatar.png"}
                      alt={member.fullName}
                      className="w-10 h-10 rounded-full"
                    />
                    <p className="font-medium">{member.fullName}</p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleRemoveMember(member._id)}
                      className="btn btn-ghost btn-sm btn-circle text-error"
                      title="Remove member"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-4">
            {isAdmin ? (
              <button
                onClick={handleDeleteGroup}
                className="btn btn-error w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Group
              </button>
            ) : (
              <button
                onClick={handleLeaveGroup}
                className="btn btn-error btn-outline w-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Leave Group
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupMembersModal;
