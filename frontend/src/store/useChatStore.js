import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios.js";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [], // For individual chat messages
  groupMessages: {}, // For group-specific messages
  users: [],
  groups: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  chatArea: false,
  groupname: "",
  count:0,

  setcount: async (data) => {
    set({ count: data });
  },

  setgroupname: async (data) => {
    set({ groupname: data });
  },

  setchatArea: async (data) => {
    set({ chatArea: data });
  },

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId, groupName) => {
    // If groupName is provided, fetch group messages
    // if (groupName) {
    //   set({ isMessagesLoading: true });
    //   try {
    //     const res = await axiosInstance.get(`/messages/groups/${groupName}`);
    //     set({
    //       groupMessages: {
    //         ...get().groupMessages,
    //         [groupName]: res.data, // Store group messages for the selected group
    //       },
    //     });
    //   } catch (error) {
    //     toast.error(error.response?.data?.message || "Failed to fetch group messages");
    //   } finally {
    //     set({ isMessagesLoading: false });
    //   }
    // } else {
      // Otherwise, fetch individual messages
      set({ isMessagesLoading: true });
      try {
        const res = await axiosInstance.get(`/messages/msg/${userId}/${groupName}`);
        set({ messages: res.data });
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to fetch messages");
      } finally {
        set({ isMessagesLoading: false });
      }
    // }
  },
  

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const { groupName } = messageData;
    console.log("messageData",messageData)

    try {
      // if (groupName) {
      //   // Handle group message
      //   await get().sendGroupMessage(groupName, messageData);
      // } else {
        // Handle individual message
        const res = await axiosInstance.post(
          `/messages/send/${selectedUser._id}`,
          { ...messageData, groupName }
        );
        set({ messages: [...messages, res.data] });
      // }
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  createGroup: async (groupData) => {
    try {
      const res = await axiosInstance.post("/messages/groups", groupData);
      set((state) => ({
        groups: [...state.groups, res.data],
      }));
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  getGroups: async () => {
    try {
      const res = await axiosInstance.get("/messages/getgroups/messages");
      set({ groups: res.data });
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch groups");
    }
  },

  deleteMessage: async (messageId, groupName = "") => {
    const { messages } = get();
    try {
      const res = await axiosInstance.delete(`/messages/delete/${messageId}`);
      if (res.status === 200) {
        if (groupName) {
          set((state) => ({
            groupMessages: {
              ...state.groupMessages,
              [groupName]: state.groupMessages[groupName].filter(
                (message) => message._id !== messageId
              ),
            },
          }));
        } else {
          set({
            messages: messages.filter((message) => message._id !== messageId),
          });
        }
        toast.success("Message deleted successfully");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Failed to delete message";
      toast.error(errorMessage);
    }
  },

  forwardMessage: async (messageId, receiverId) => {
    try {
      await axiosInstance.post("/messages/forward", { messageId, receiverId });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to forward message");
    }
  },


  // removeMember: async (groupId, memberId) => {
  //   try {
  //     const res = await axiosInstance.post(`/messages/groups/${groupId}/remove-member`, {
  //       memberId,
  //     });
      
  //     // Update the groups list and selected user if it's the current group
  //     set((state) => {
  //       const updatedGroups = state.groups.map((group) =>
  //         group._id === groupId ? res.data : group
  //       );
        
  //       return {
  //         groups: updatedGroups,
  //         selectedUser: state.selectedUser?._id === groupId ? res.data : state.selectedUser,
  //       };
  //     });
      
  //     return res.data;
  //   } catch (error) {
  //     throw error;
  //   }
  // },

  deleteGroup: async (groupId) => {
    try {
      // Make sure the backend deletes the group and responds with the necessary info.
      const res = await axiosInstance.delete(`/messages/groups/${groupId}`);
      
      // Check the response to ensure deletion was successful
      if (res.status === 200) {
        // Remove the group from the state
        set((state) => ({
          groups: state.groups.filter((group) => group._id !== groupId),
          selectedUser: state.selectedUser?._id === groupId ? null : state.selectedUser,
        }));
      }
      
    } catch (error) {
      console.error("Error deleting group:", error);
    }
  },

  removeMember: async (groupId, memberId) => {
    try {
      const res = await axiosInstance.post(`/messages/groups/${groupId}/remove-member`, {
        memberId,
      });
      
      // Update the groups list and selected user if it's the current group
      set((state) => {
        const updatedGroups = state.groups.map((group) =>
          group._id === groupId ? res.data : group
        );
        
        return {
          groups: updatedGroups,
          selectedUser: state.selectedUser?._id === groupId ? res.data : state.selectedUser,
        };
      });
      
      return res.data;
    } catch (error) {
      console.error("Error removing member:", error);
      throw error;
    }
  },
  
  exitGroup: async (groupId) => {
    try {
      // Check if the user is authenticated
      const user = useAuthStore.getState().user;
      if (!user || !user._id) {
        throw new Error("User is not authenticated.");
      }
      
      const userId = user._id;  // Assuming user is authenticated
  
      // Call the backend to exit the group
      const res = await axiosInstance.post(`/messages/groups/${groupId}/exit`, { memberId: userId });
  
      // If the backend confirms the group exit, update the state
      if (res.status === 200) {
        set((state) => ({
          groups: state.groups.filter((group) => group._id !== groupId),
        }));
  
        // Optionally, reset the selected user if they are currently in the exited group
        if (get().selectedUser?._id === groupId) {
          set({ selectedUser: null });
        }
  
        // Notify the user about the successful exit
        toast.success("You have successfully exited the group.");
  
        // Optionally, emit a socket event to notify other users that this user has exited
        const socket = useAuthStore.getState().socket;
        if (socket) {
          socket.emit("userExited", { groupId, memberId: userId });
        }
      }
    } catch (error) {
      console.error("Error exiting group:", error);
      toast.error("Failed to exit the group.");
    }
  },
  

  addMember: async (groupId, memberId) => {
    try {
      const res = await axiosInstance.post(`/messages/groups/${groupId}/add-member`, { memberId });
  
      // Update the group in the state immediately after adding the member
      set((state) => {
        const updatedGroups = state.groups.map((group) =>
          group._id === groupId ? res.data : group
        );
        
        return {
          groups: updatedGroups,
          selectedUser: state.selectedUser?._id === groupId ? res.data : state.selectedUser,
        };
      });
      
      return res.data;
    } catch (error) {
      console.error("Error adding member:", error);
      throw error;
    }
  },

  

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    const {groupname} = get();
    if(groupname){
      socket.on("grpMessage", (newMessage) => {
        console.log(newMessage)
        
        // const { selectedUser } = get();
        // if (selectedUser && newMessage.senderId === selectedUser._id) {
        // if(count==1){
          set((state) => {
            const messageExists = state.messages.some((message) => message._id === newMessage._id);
      
            if (!messageExists) {
              // If the message doesn't exist, add it to the state
              return {
                messages: [...state.messages, newMessage],
                count: 0,
              };
            }
      
            // If the message already exists, return the current state without changes
            return state;
          });
      });
    }else{
      socket.on("newMessage", (newMessage) => {
        console.log(newMessage)
        const { selectedUser } = get();
        if (selectedUser && newMessage.senderId === selectedUser._id) {
          set((state) => ({ 
            messages: [...state.messages, newMessage] 
          }));
        }
      });
    }
    // Handle individual messages
    

    // Handle group messages
    socket.on("newGroupMessage", ({ groupId, message }) => {
      set((state) => ({
        groupMessages: {
          ...state.groupMessages,
          [groupId]: [
            ...(state.groupMessages[groupId] || []),
            message
          ]
        }
      }));
    });

    // Handle message deletion
    socket.on("messageDeleted", ({ messageId, groupId }) => {
      if (groupId) {
        set((state) => ({
          groupMessages: {
            ...state.groupMessages,
            [groupId]: (state.groupMessages[groupId] || []).filter(
              msg => msg._id !== messageId
            )
          }
        }));
      } else {
        set((state) => ({
          messages: state.messages.filter(msg => msg._id !== messageId)
        }));
      }
    });
  },

  joinGroup: (groupId) => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.emit("joinGroup", groupId);
    }
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("groupMessage");
    socket.off("messageDeleted");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
