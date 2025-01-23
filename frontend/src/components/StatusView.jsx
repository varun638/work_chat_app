import { useEffect, useState, useRef } from "react";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";
import { Loader2, Plus, X, ArrowRight } from "lucide-react"; // Added ArrowRight icon
import toast from "react-hot-toast";

const StatusView = () => {
  const [statuses, setStatuses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [showStatusViewer, setShowStatusViewer] = useState(false);
  const { socket, authUser } = useAuthStore();
  const statusTimeoutRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      await fetchStatuses();
    };
  
    fetchData();
    const intervalId = setInterval(fetchStatuses, 30000);
  
    if (socket) {
      socket.on("newStatus", (newStatus) => {
        console.log("Received new status:", newStatus);
  
        setStatuses((prev) => {
          const updatedStatuses = JSON.parse(JSON.stringify(prev));
  
          const userIndex = updatedStatuses.findIndex(
            (group) => group.user._id === newStatus.userId._id
          );
  
          if (userIndex !== -1) {
            // Adding new status at the beginning of the user statuses array
            updatedStatuses[userIndex].statuses.unshift(newStatus);
          } else {
            // If user doesn't exist, create a new group
            updatedStatuses.unshift({
              user: newStatus.userId,
              statuses: [newStatus],
            });
          }
  
          return updatedStatuses; // Trigger re-render
        });
      });
    }
  
    return () => {
      if (socket) socket.off("newStatus");
      clearInterval(intervalId);
    };
  }, [selectedStatus]);
  


  const fetchStatuses = async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get("/status");
      // Group statuses by user
      const groupedStatuses = res.data.reduce((acc, status) => {
        const userId = status.userId._id;
        if (!acc[userId]) {
          acc[userId] = {
            user: status.userId,
            statuses: [],
          };
        }
        acc[userId].statuses.push(status);
        return acc;
      }, {});
      setStatuses(Object.values(groupedStatuses)); // Update the statuses state
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
        const type =
          file.type.startsWith("image/")
            ? "image"
            : file.type.startsWith("video/")
            ? "video"
            : "text";

        if (type !== "text") {
          await axiosInstance.post("/status/create", {
            content: base64Content,
            type,
          });
          toast.success("Status uploaded successfully");
          fetchStatuses();
        } else {
          toast.error("Unsupported file type");
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to upload status");
    } finally {
      setIsUploading(false);
    }
  };

  const viewStatus = (userStatuses) => {
    setSelectedStatus(userStatuses);
    setShowStatusViewer(true);
  };

  const StatusViewer = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const statusRef = useRef(null);

    useEffect(() => {
      if (showStatusViewer) {
        // Define how long each status will display
        const duration =
          selectedStatus.statuses[currentIndex].type === "video"
            ? 30000 // 30 seconds for video
            : 5000; // 5 seconds for image/text

        // Set the timeout to automatically switch to the next status
        statusTimeoutRef.current = setTimeout(() => {
          if (currentIndex < selectedStatus.statuses.length - 1) {
            setCurrentIndex(currentIndex + 1);
          } else {
            setShowStatusViewer(false); // Close viewer if it's the last status
          }
        }, duration);

        // Clean up timeout on component unmount or when the index changes
        return () => {
          if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
        };
      }
    }, [currentIndex, showStatusViewer]); // Effect runs when `currentIndex` or `showStatusViewer` changes

    const goToNextStatus = () => {
      if (currentIndex < selectedStatus.statuses.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setShowStatusViewer(false); // Close viewer if it's the last status
      }
    };

    if (!selectedStatus) return null;

    const currentStatus = selectedStatus.statuses[currentIndex];

    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
        <button
          onClick={() => setShowStatusViewer(false)}
          className="absolute top-4 right-4 text-white"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="w-full max-w-md">
          {/* Progress Bars */}
          <div className="flex gap-1 mb-4 px-4">
            {selectedStatus.statuses.map((_, idx) => (
              <div
                key={idx}
                className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
              >
                <div
                  className={`h-full bg-white transition-all duration-[5000ms] ease-linear
                    ${idx === currentIndex ? "w-full" : idx < currentIndex ? "w-full" : "w-0"}`}
                />
              </div>
            ))}
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3 px-4 mb-4">
            <img
              src={selectedStatus.user?.profilepic || "/avatar.png"}
              alt={selectedStatus.user?.fullName}
              className="w-10 h-10 rounded-full"
            />
            <div className="text-white">
              <p className="font-medium">{selectedStatus.user?.fullName}</p>
              <p className="text-sm opacity-70">
                {new Date(currentStatus.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>

          {/* Status Content */}
          <div className="relative aspect-[9/16] bg-black flex items-center justify-center">
            {currentStatus.type === "image" ? (
              <img
                src={currentStatus.content}
                alt="Status"
                className="max-h-full max-w-full object-contain"
              />
            ) : currentStatus.type === "video" ? (
              <video
                ref={statusRef}
                src={currentStatus.content}
                className="max-h-full max-w-full"
                autoPlay
                muted
                onEnded={goToNextStatus} // Move to next status when video ends
              />
            ) : (
              <p className="text-white text-center p-4">{currentStatus.content}</p>
            )}
          </div>

          {/* Navigation Button */}
          <div className="absolute bottom-4 w-full flex justify-center px-4">
            <button
              onClick={goToNextStatus}
              className="bg-white text-black p-2 rounded-full"
              disabled={currentIndex === selectedStatus.statuses.length - 1} // Disable if it's the last status
            >
              <ArrowRight className="w-6 h-6" /> {/* ArrowRight icon replaces the text */}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Status Upload */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Status Updates</h2>
      </div>

      {/* My Status */}
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-3">My Status</h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={authUser.profilepic || "/avatar.png"}
              alt="My Status"
              className="w-14 h-14 rounded-full"
            />
            <label className="absolute bottom-0 right-0 bg-primary rounded-full p-1 cursor-pointer">
              <Plus className="w-4 h-4 text-primary-content" />
              <input
                type="file"
                className="hidden"
                accept="image/*,video/*"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
          </div>
          <div>
            <p className="font-medium">My Status</p>
            <p className="text-sm text-base-content/70">Tap to add status update</p>
          </div>
        </div>
      </div>

      {/* Recent Updates */}
      <div>
        <h3 className="text-sm font-medium mb-3">Recent Updates</h3>
        <div className="space-y-4">
          {statuses.map((userStatus) => (
            <button
              key={userStatus.userId}
              className="flex items-center gap-3 w-full hover:bg-base-200 p-2 rounded-lg transition-colors"
              onClick={() => viewStatus(userStatus)}
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-full border-2 border-primary animate-pulse" />
                <img
                  src={userStatus.user?.profilepic || "/avatar.png"}
                  alt={userStatus.user?.fullName}
                  className="w-14 h-14 rounded-full"
                />
              </div>
              <div className="text-left">
                <p className="font-medium">{userStatus.user?.fullName}</p>
                <p className="text-sm text-base-content/70">
                  {/* Ensure that userStatus.statuses exists and has at least one status */}
                  {userStatus.statuses && userStatus.statuses.length > 0
                    ? new Date(userStatus.statuses[0].createdAt).toLocaleTimeString()
                    : "No status"} {/* Fallback text when no status is available */}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {showStatusViewer && <StatusViewer />}
    </div>
  );
};

export default StatusView;
