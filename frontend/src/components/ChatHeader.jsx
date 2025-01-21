import { X, Users } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useState } from "react";
import GroupMembersModal from "./GroupMembersModal";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [showMembersModal, setShowMembersModal] = useState(false);

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar (only display for personal chats, not groups) */}
          {selectedUser.type !== 'group' && (
            <div className="avatar">
              <div className="size-10 rounded-full relative">
                <img src={selectedUser.profilepic || "/avatar.png"} alt={selectedUser.fullName} />
              </div>
            </div>
          )}

          {/* User info */}
          <div className="flex items-center gap-2">
            <h3 className="font-medium">
              {selectedUser.type === 'group' ? selectedUser.name : selectedUser.fullName}
            </h3>
            {selectedUser.type === 'group' && (
              <button
                onClick={() => setShowMembersModal(true)}
                className="btn btn-ghost btn-sm btn-circle"
                title="View members"
              >
                <Users className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-sm text-base-content/70">
            {selectedUser.type === 'group' 
              ? `${selectedUser.members?.length || 0} members`
              : (onlineUsers.includes(selectedUser._id) ? "Online" : "Offline")}
          </p>
        </div>

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
