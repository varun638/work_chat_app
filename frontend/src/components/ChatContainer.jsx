import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import toast from "react-hot-toast";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    deleteMessage,
    forwardMessage,
    users,
    joinGroup,
    groupname
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  const [isForwarding, setIsForwarding] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [selectedUserForForwarding, setSelectedUserForForwarding] = useState(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [showContextMenu, setShowContextMenu] = useState(false);
  const contextMenuRef = useRef(null); // Ref for context menu

  useEffect(() => {
    // Join group room when entering the chat
    if (selectedUser?.type === 'group' && selectedUser?._id) {
      joinGroup(selectedUser._id);

      // Removed exitGroup logic
      // return () => {
      //   exitGroup(selectedUser._id);
      // };
    }
  }, [selectedUser?._id, joinGroup]); // No need for exitGroup in dependency array
  
  useEffect(() => {
    getMessages(selectedUser._id, groupname);
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle the right-click on a message to show the context menu
  const handleRightClick = (e, message) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setSelectedMessage(message);
    setShowContextMenu(true);
  };

  // Close the context menu if clicked outside
  const handleCloseContextMenu = (e) => {
    if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
      setShowContextMenu(false);
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleCloseContextMenu);
    return () => document.removeEventListener("click", handleCloseContextMenu); // Cleanup
  }, []);

  const handleDeleteClick = (messageId) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      deleteMessage(messageId);
      setShowContextMenu(false);
    }
  };

  const handleForwardClick = (message) => {
    setSelectedMessage(message);
    setIsForwarding(true);
  };

  const handleSelectUserForForwarding = (user) => {
    setSelectedUserForForwarding(user);
  };

  const handleForward = () => {
    if (selectedMessage && selectedUserForForwarding) {
      forwardMessage({ messageId: selectedMessage._id, receiverId: selectedUserForForwarding._id });
      toast.success("Message forwarded successfully");
      setIsForwarding(false);
    }
  };

  const handleCancelForward = () => {
    setIsForwarding(false);
  };

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
            ref={messageEndRef}
            onContextMenu={(e) => handleRightClick(e, message)} // Right-click handler
          >
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                {groupname ? (
                  <img
                    src={message.senderId === authUser._id
                      ? authUser.profilepic || "/avatar.png"
                      : message.profile || "/avatar.png"}
                    alt="profile pic"
                  />
                ) : (
                  <img
                    src={message.senderId === authUser._id
                      ? authUser.profilepic || "/avatar.png"
                      : selectedUser.profilepic || "/avatar.png"}
                    alt="profile pic"
                  />
                )}
              </div>
            </div>
            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">{formatMessageTime(message.createdAt)}</time>
            </div>
            <div className="chat-bubble flex flex-col relative">
              {message.image && (
                <a href={message?.image} download>
                  {message?.image?.split("/")[4] === "raw" ? (
                    <img
                      src={"https://static.vecteezy.com/system/resources/previews/000/581/925/original/file-icon-vector-illustration.jpg"}
                      alt="Attachment"
                      className="w-[30px] h-[35px] rounded-md mb-2"
                    />
                  ) : message?.image?.endsWith(".mp4") || message?.image?.endsWith(".mov") ? (
                    <video
                      src={message.image}
                      controls
                      className="sm:max-w-[200px] rounded-md mb-2"
                      alt="Video Attachment"
                    />
                  ) : message?.image?.endsWith(".mp3") || message?.image?.endsWith(".webm") ? (
                    <audio
                      src={message.image}
                      controls
                      className="sm:max-w-[250px] rounded-md mb-2"
                      alt="Audio Attachment"
                    />
                  ) : (
                    <img
                      src={message.image}
                      alt="Attachment"
                      className="sm:max-w-[200px] rounded-md mb-2"
                    />
                  )}
                </a>
              )}
              {message.text && <p>{message.text}</p>}
            </div>
          </div>
        ))}
      </div>

      <MessageInput imgs={authUser.profilepic} />

      {/* Context Menu (Dropdown) */}
      {showContextMenu && (
        <div
          ref={contextMenuRef}
          className="dropdown-content menu p-2 shadow bg-base-100 rounded-box"
          style={{
            position: "absolute",
            top: contextMenuPosition.y,
            left: contextMenuPosition.x,
          }}
        >
          <ul>
            <li>
              <button
                onClick={() => handleForwardClick(selectedMessage)}
                className="btn btn-primary btn-sm flex items-center justify-center w-full py-2 sm:w-auto sm:px-4 sm:py-3"
              >
                ➜
              </button>
            </li>
            <li>
              <button
                onClick={() => handleDeleteClick(selectedMessage._id)}
                className="btn btn-danger btn-sm flex items-center justify-center w-full py-2 sm:w-auto sm:px-4 sm:py-3"
              >
                🗑️
              </button>
            </li>
          </ul>
        </div>
      )}

      {/* User Selection Modal for Forwarding */}
      {isForwarding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-3 rounded-md w-[95%] sm:w-[350px] shadow-lg max-h-[50vh] flex flex-col">
            <h3 className="mb-3 text-lg font-semibold">Select User to Forward</h3>

            <div className="flex-1 overflow-y-auto mb-4">
              {users.map((user) => (
                <div
                  key={user._id}
                  className={`cursor-pointer hover:bg-gray-100 p-2 rounded-md ${selectedUserForForwarding?._id === user._id ? 'bg-blue-100' : ''}`}
                  onClick={() => handleSelectUserForForwarding(user)}
                >
                  <p>{user.fullName}</p>
                </div>
              ))}
            </div>

            {selectedUserForForwarding && (
              <div className="mb-3 p-2 bg-gray-100 rounded-md">
                <p className="text-sm text-gray-700">Selected: <strong>{selectedUserForForwarding.fullName}</strong></p>
              </div>
            )}

            {selectedUserForForwarding && (
              <div className="flex gap-3 mt-3">
                <button
                  onClick={handleCancelForward}
                  className="btn btn-secondary btn-sm w-40"
                >
                  Cancel
                </button>
                <button
                  onClick={handleForward}
                  className="btn btn-primary btn-sm w-40"
                >
                  Forward
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
