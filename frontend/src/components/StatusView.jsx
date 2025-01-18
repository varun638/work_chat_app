import { useEffect, useState } from "react";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const StatusView = () => {
  const [statuses, setStatuses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { socket, user } = useAuthStore(); // Assume user info is stored here

  useEffect(() => {
    fetchStatuses();

    // Set up polling every 30 seconds
    const intervalId = setInterval(() => {
      fetchStatuses();
    }, 30000); // Refresh every 30 seconds

    if (socket) {
      socket.on("newStatus", (newStatus) => {
        setStatuses((prev) => [newStatus, ...prev]); // Add new status at the beginning
      });
    }

    // Clean up interval on component unmount
    return () => {
      if (socket) {
        socket.off("newStatus"); // Remove socket listener
      }
      clearInterval(intervalId); // Clear the interval when component unmounts
    };
  }, [socket]);

  const fetchStatuses = async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get("/status");
      setStatuses(res.data); // Update statuses with the fetched data
    } catch (error) {
      toast.error("Failed to fetch statuses");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64Content = reader.result;
        const type = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : ""; // Check if it's image or video

        if (type) {
          // Send the status upload request
          const res = await axiosInstance.post("/status/create", {
            content: base64Content,
            type,
          });
          toast.success("Status uploaded successfully");

          // Immediately update the UI with the new status
          const newStatus = {
            ...res.data,
            userId: { fullName: user.fullName, ...user }, // Assuming user object is stored in useAuthStore
          };
          setStatuses((prev) => [newStatus, ...prev]); // Add the new status to the state
        } else {
          toast.error("Unsupported file type");
        }
      };

      // Read the file as base64
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to upload status");
    } finally {
      setIsUploading(false);
    }
  };

  // Function to handle the video playback timeout
  const handleVideoTimeout = (e) => {
    const videoElement = e.target;
    setTimeout(() => {
      videoElement.pause();
    }, 30000); // Pause video after 30 seconds
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Status Upload */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Status Updates</h2>
        <label className={`btn btn-circle btn-sm ${isUploading ? "loading" : ""}`}>
          <Camera className="w-4 h-4" />
          <input
            type="file"
            className="hidden"
            accept="image/*,video/*"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </label>
      </div>

      {/* Status List */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {statuses.map((status) => (
          <div
            key={status._id}
            className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
          >
            {status.type === "image" ? (
              <img
                src={status.content}
                alt="Status"
                className="w-full h-full object-cover"
              />
            ) : status.type === "video" ? (
              <video
                src={status.content}
                controls
                className="w-full h-full object-cover"
                onLoadedMetadata={handleVideoTimeout} // Set timeout when metadata is loaded
              />
            ) : (
              <div className="w-full h-full bg-primary flex items-center justify-center p-4">
                <p className="text-primary-content text-sm text-center">
                  {status.content}
                </p>
              </div>
            )}

            {/* User Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 text-white">
              <p className="text-xs truncate">
                {status.userId && status.userId.fullName
                  ? status.userId.fullName
                  : "Unknown User"}
              </p>
              <p className="text-[10px] opacity-70">
                {new Date(status.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {statuses.length === 0 && (
        <div className="text-center py-8 text-base-content/60">
          <p>No status updates yet</p>
        </div>
      )}
    </div>
  );
};

export default StatusView;
