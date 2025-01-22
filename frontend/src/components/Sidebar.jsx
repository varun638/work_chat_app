import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, UserPlus, Camera } from "lucide-react";
import GroupChatModal from "./GroupChatModal";

const Sidebar = ({ onViewChange, currentView }) => {
  const {
    getUsers,
    users,
    selectedUser,
    setSelectedUser,
    setchatArea,
    isUsersLoading,
    getGroups,
    setgroupname,
    groups, // Access `groups` from the store
  } = useChatStore();
  const { onlineUsers } = useAuthStore();

  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [activeTab, setActiveTab] = useState("direct"); // 'direct' or 'groups'
  const [searchQuery, setSearchQuery] = useState(""); // Search query for filtering

  useEffect(() => {
    getUsers(); // Fetch users
  }, [getUsers]);

  // Fetch groups data when switching to the "groups" tab
  useEffect(() => {
    if (activeTab === "groups") {
      getGroups(); // Fetch groups from the server and update the store
    }
  }, [activeTab, getGroups]);

  // Filtering users based on search query and online status
  const filteredUsers = users
    .filter((user) => {
      const matchesSearch =
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    })
    .filter((user) => (showOnlineOnly ? onlineUsers.includes(user._id) : true));

  // If users are loading, show the sidebar skeleton
  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-32 lg:w-96 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="size-6" />
            <span className="font-medium hidden lg:block">Chats</span>
          </div>
          <button
            onClick={() => setShowGroupModal(true)}
            className="btn btn-ghost btn-sm btn-circle"
            title="Create Group"
          >
            <UserPlus className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar (Visible on larger screens) */}
        <div className="mt-3 hidden lg:block">
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-sm w-full border-base-300"
          />
        </div>

        {/* Tab Buttons */}
        <div className="mt-4 flex gap-2 flex-wrap">
          <button
            onClick={() => {
              setActiveTab("direct");
              setchatArea(false);
              onViewChange("chat");
            }}
            className={`flex-1 btn btn-sm ${activeTab === "direct" && currentView === "chat" ? "btn-primary" : "btn-ghost"}`}
          >
            <Users className="w-4 h-4" />
            <span className="hidden lg:inline">Direct</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("groups");
              setchatArea(true);
              onViewChange("chat");
            }}
            className={`flex-1 btn btn-sm ${activeTab === "groups" && currentView === "chat" ? "btn-primary" : "btn-ghost"}`}
          >
            <Users className="w-4 h-4" />
            <span className="hidden lg:inline">Groups</span>
          </button>
          <button
            onClick={() => onViewChange("status")}
            className={`flex-1 btn btn-sm ${currentView === "status" ? "btn-primary" : "btn-ghost"}`}
          >
            <Camera className="w-4 h-4" />
            <span className="hidden lg:inline">Status</span>
          </button>
        </div>

        {/* Online Filter Toggle (Only visible on large screens) */}
        {activeTab === "direct" && (
          <div className="mt-3 hidden lg:flex items-center gap-2">
            <label className="cursor-pointer flex items-center gap-2">
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                className="checkbox checkbox-sm"
              />
              <span className="text-sm">Show online only</span>
            </label>
            <span className="text-xs text-zinc-500">({onlineUsers.length - 1} online)</span>
          </div>
        )}
      </div>

      <div className="overflow-y-auto w-full py-3">
        {activeTab === "direct" ? (
          filteredUsers.map((user) => (
            <button
              key={user._id} // Ensure unique key
              onClick={() => {
                setSelectedUser({ ...user, type: "direct" });
                setgroupname("");
              }}
              className={`w-full p-3 flex items-center gap-3
                hover:bg-base-300 transition-colors
                ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}`}
            >
              <div className="relative mx-auto lg:mx-0">
                <img
                  src={user.profilepic || "/avatar.png"}
                  alt={user.name}
                  className="size-12 object-cover rounded-full"
                />
                {onlineUsers.includes(user._id) && (
                  <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />
                )}
              </div>

              <div className="hidden lg:block text-left min-w-0">
                <div className="font-medium truncate">{user.fullName}</div>
                <div className="text-sm text-zinc-400">
                  {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                </div>
              </div>
            </button>
          ))
        ) : (
          groups?.map((group) => (
            <button
              key={group._id || group.tempId} // Ensure unique key for groups
              onClick={() => {
                setSelectedUser({ ...group, type: "group" });
                setgroupname(group.name);
              }}
              className={`w-full p-3 flex items-center gap-3
                hover:bg-base-300 transition-colors
                ${selectedUser?._id === group._id ? "bg-base-300 ring-1 ring-base-300" : ""}`}
            >
              <div className="relative mx-auto lg:mx-0">
                <Users className="w-12 h-12 p-2 bg-base-200 rounded-full" />
              </div>

              <div className="hidden lg:block text-left min-w-0">
                <div className="font-medium truncate">{group.name}</div>
                <div className="text-sm text-zinc-400">
                  {group.members?.length} members
                </div>
              </div>
            </button>
          ))
        )}

        {/* No results found for direct users */}
        {activeTab === "direct" && filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4">No online users</div>
        )}

        {/* No results found for groups */}
        {activeTab === "groups" && groups?.length === 0 && (
          <div className="text-center text-zinc-500 py-4">No groups yet</div>
        )}
      </div>

      <GroupChatModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
      />
    </aside>
  );
};

export default Sidebar;
