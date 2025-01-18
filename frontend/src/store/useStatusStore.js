// src/store/useStatusStore.js
import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore"; // Assuming socket is available here

export const useStatusStore = create((set, get) => ({
  statuses: [], // To hold all statuses
  isLoading: false, // To track loading state
  isUploading: false, // To track upload state
  setStatuses: (statuses) => set({ statuses }),
  addStatus: (newStatus) => set((state) => ({
    statuses: [newStatus, ...state.statuses], // Add the new status at the top
  })),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsUploading: (uploading) => set({ isUploading: uploading }),

  fetchStatuses: async () => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.get("/status");
      set({ statuses: response.data });
    } catch (error) {
      toast.error("Failed to fetch statuses");
    } finally {
      set({ isLoading: false });
    }
  },

  createStatus: async (content, type) => {
    set({ isUploading: true });
    try {
      const response = await axiosInstance.post("/status/create", {
        content,
        type,
      });
      set({ statuses: [response.data, ...get().statuses] });
      toast.success("Status uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload status");
    } finally {
      set({ isUploading: false });
    }
  },

  // New socket setup to immediately fetch and update statuses
  subscribeToNewStatuses: () => {
    const socket = useAuthStore.getState().socket;
    
    socket.on("newStatus", (newStatus) => {
      // When a new status is received, add it to the store
      set((state) => ({
        statuses: [newStatus, ...state.statuses],
      }));
    });
  },

  // Unsubscribe from the socket event to avoid memory leaks
  unsubscribeFromNewStatuses: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newStatus");
  },

  // Call this method when the component mounts to start listening to new statuses
  startListening: () => {
    get().subscribeToNewStatuses();
  },

  // Stop listening when the component unmounts
  stopListening: () => {
    get().unsubscribeFromNewStatuses();
  },
}));