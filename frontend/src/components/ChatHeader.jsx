import { X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

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
          <div>
            <h3 className="font-medium">
              {selectedUser.type === 'group' ? selectedUser.groupname : selectedUser.fullName}
            </h3>
            <p className="text-sm text-base-content/70">
              {selectedUser.type === 'group' 
                ? selectedUser.groupname // Show the group name instead of status for group chats
                : (onlineUsers.includes(selectedUser._id) ? "Online" : "Offline")}
            </p>
          </div>
        </div>

        {/* Close button */}
        <button onClick={() => setSelectedUser(null)}>
          <X />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
