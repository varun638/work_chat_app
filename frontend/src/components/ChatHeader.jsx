import { X, Users } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useState } from "react";
import GroupMembersModal from "./GroupMembersModal";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [showMembersModal, setShowMembersModal] = useState(false);

  // Direct chat header (Personal chat)
  const renderDirectChatHeader = () => {
    return (
      <div className="flex items-center gap-3">
        {/* Avatar for direct chat */}
        <div className="avatar">
          <div className="size-10 rounded-full relative">
            <img src={selectedUser.profilepic || "/avatar.png"} alt={selectedUser.fullName} />
          </div>
        </div>

        {/* User info for direct chat */}
        <div className="flex items-center gap-2">
          <h3 className="font-medium">{selectedUser.fullName}</h3>
        </div>
        <p className="text-sm text-base-content/70">
          {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
        </p>
      </div>
    );
  };

  // Group chat header
  const renderGroupChatHeader = () => {
    return (
      <div className="flex items-center gap-3">
        {/* Group name */}
        <h3 className="font-medium">{selectedUser.name}</h3>

        {/* View members button */}
        <button
          onClick={() => setShowMembersModal(true)}
          className="btn btn-ghost btn-sm btn-circle"
          title="View members"
        >
          <Users className="w-4 h-4" />
        </button>

        <p className="text-sm text-base-content/70">
          {selectedUser.members?.length || 0} members
        </p>
      </div>
    );
  };

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        {/* Render either direct chat header or group chat header */}
        {selectedUser.type === "group" ? renderGroupChatHeader() : renderDirectChatHeader()}

        {/* Close button */}
        <button onClick={() => setSelectedUser(null)}>
          <X />
        </button>
      </div>

      {/* Group Members Modal */}
      <GroupMembersModal
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        group={selectedUser}
      />
    </div>
  );
};

export default ChatHeader;
